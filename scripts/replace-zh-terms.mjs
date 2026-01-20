import fs from 'node:fs/promises';
import path from 'node:path';

const REPLACEMENTS = [
  { from: '代理', to: 'Agent' },
];

function parseArgs(argv) {
  const args = [...argv];
  const opts = {
    check: false,
    listFile: null,
    targets: [],
  };

  while (args.length > 0) {
    const a = args.shift();
    if (a === '--check') {
      opts.check = true;
      continue;
    }
    if (a === '--list') {
      const v = args.shift();
      if (!v) throw new Error('Missing value for --list');
      opts.listFile = v;
      continue;
    }
    opts.targets.push(a);
  }

  return opts;
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function walkDir(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await walkDir(full)));
    } else if (e.isFile() && e.name.toLowerCase().endsWith('.md')) {
      out.push(full);
    }
  }
  return out;
}

function applyReplacementsToSegment(text) {
  let out = text;
  for (const { from, to } of REPLACEMENTS) {
    if (!from) continue;
    out = out.split(from).join(to);
  }
  return out;
}

function replaceOutsideInlineCode(line) {
  // Preserve inline code spans using backticks (supports multiple backticks).
  let i = 0;
  let out = '';

  while (i < line.length) {
    const ch = line[i];
    if (ch !== '`') {
      // Consume a normal run until next backtick.
      const next = line.indexOf('`', i);
      const end = next === -1 ? line.length : next;
      out += applyReplacementsToSegment(line.slice(i, end));
      i = end;
      continue;
    }

    // Backtick run.
    let runLen = 1;
    while (i + runLen < line.length && line[i + runLen] === '`') runLen++;
    const fence = '`'.repeat(runLen);

    const start = i;
    const searchFrom = i + runLen;
    const close = line.indexOf(fence, searchFrom);

    if (close === -1) {
      // Unclosed; treat as normal text.
      out += applyReplacementsToSegment(line.slice(i, i + runLen));
      i += runLen;
      continue;
    }

    // Copy code span as-is.
    out += line.slice(start, close + runLen);
    i = close + runLen;
  }

  return out;
}

function replaceOutsideFencedCode(markdown) {
  const lines = markdown.split(/\r?\n/);
  let inFence = false;
  let fenceMarker = null;

  const out = lines.map((line) => {
    const trimmed = line.trimStart();

    const isFenceStart =
      trimmed.startsWith('```') ||
      trimmed.startsWith('~~~');

    if (isFenceStart) {
      const marker = trimmed.startsWith('```') ? '```' : '~~~';

      if (!inFence) {
        inFence = true;
        fenceMarker = marker;
      } else if (fenceMarker === marker) {
        inFence = false;
        fenceMarker = null;
      }

      return line;
    }

    if (inFence) return line;
    return replaceOutsideInlineCode(line);
  });

  return out.join('\n');
}

async function loadTargets(opts) {
  if (opts.listFile) {
    const listPath = path.resolve(opts.listFile);
    const raw = await fs.readFile(listPath, 'utf8');
    const files = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((p) => path.resolve(p));
    return files;
  }

  if (opts.targets.length > 0) {
    return opts.targets.map((p) => path.resolve(p));
  }

  return [path.resolve('content/zh')];
}

async function expandTargets(targets) {
  const files = [];
  for (const t of targets) {
    const stat = await fs.stat(t);
    if (stat.isDirectory()) {
      files.push(...(await walkDir(t)));
    } else if (stat.isFile() && t.toLowerCase().endsWith('.md')) {
      files.push(t);
    }
  }

  // Only operate on content/zh to avoid accidental changes.
  const root = path.resolve('content/zh') + path.sep;
  return [...new Set(files)].filter((f) => path.resolve(f).startsWith(root));
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const targets = await loadTargets(opts);

  for (const t of targets) {
    if (!(await fileExists(t))) {
      throw new Error(`Target not found: ${t}`);
    }
  }

  const files = await expandTargets(targets);
  if (files.length === 0) {
    process.stdout.write('No zh markdown files found.\n');
    return;
  }

  const changed = [];
  for (const filePath of files) {
    const original = await fs.readFile(filePath, 'utf8');
    const updated = replaceOutsideFencedCode(original);
    if (updated !== original) {
      changed.push(filePath);
      if (!opts.check) {
        await fs.writeFile(filePath, updated, 'utf8');
      }
    }
  }

  if (changed.length === 0) {
    process.stdout.write('OK: no replacements needed.\n');
    return;
  }

  const rel = (p) => path.relative(process.cwd(), p);
  process.stdout.write(
    `${opts.check ? 'NEEDS FIX' : 'FIXED'}: ${changed.length} file(s)\n` +
      changed.map((f) => `- ${rel(f)}`).join('\n') +
      '\n'
  );

  if (opts.check) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
