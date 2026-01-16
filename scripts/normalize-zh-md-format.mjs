import fs from 'node:fs/promises';
import path from 'node:path';

function slugifyForAnchor(raw) {
  // Match the style seen in 20260116: remove punctuation/spaces, keep CJK + alnum.
  const text = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[→←↔⇄⇆⇌⇋]/g, '')
    .replace(/&[a-z]+;|&#\d+;|&#x[0-9a-f]+;/gi, '')
    // Remove common punctuation/symbols (keep CJK and alnum)
    .replace(/[\u2010-\u2015\u2212\-–—―]/g, '')
    .replace(/[：:，,。\.！!？?、】【\[\]（）()「」『』“”‘’《》〈〉<>·•\/\\|+=*^~`@#$%&…]/g, '');

  // Keep only letters/digits/CJK/underscore
  const kept = text.replace(/[^0-9a-z_\u4e00-\u9fff]/g, '');
  return kept || 'section';
}

function parseReferenceLines(lines) {
  const entries = new Map();
  const refLineRe = /^- \[(\d+)\] \[(.+)\]\((.+)\)(?:\s+-\s+.*)?$/;
  for (const line of lines) {
    const m = line.match(refLineRe);
    if (!m) continue;
    const n = Number(m[1]);
    const title = m[2].trim();
    const url = m[3].trim();
    if (!Number.isFinite(n)) continue;
    entries.set(n, { title, url });
  }
  return entries;
}

function titleWithPeriod(title) {
  const t = String(title ?? '').trim();
  if (!t) return t;
  if (/[。.!?！？]$/.test(t)) return t;
  return `${t}.`;
}

function isAnchorLine(line) {
  return /^<a\s+id="[^"]+"\s*><\/a>$/.test(line.trim());
}

function replaceCitationMarkers(markdown, refs) {
  // Replace [n] (not already a link) with [n](url), skipping fenced code blocks.
  const lines = markdown.split(/\r?\n/);
  let inFence = false;

  const out = lines.map((line) => {
    const trimmed = line.trimStart();
    if (trimmed.startsWith('```')) {
      inFence = !inFence;
      return line;
    }
    if (inFence) return line;

    return line.replace(/\[(\d{1,3})\](?!\()/g, (full, numStr) => {
      const n = Number(numStr);
      const ref = refs.get(n);
      if (!ref?.url) return full;
      return `[${n}](${ref.url})`;
    });
  });

  return out.join('\n');
}

function extractReferenceBlock(lines) {
  // Find the last contiguous block of reference bullet lines at the end.
  const isRef = (line) => /^- \[\d+\] \[.+\]\(.+\)(?:\s+-\s+.*)?$/.test(line.trim());

  let end = lines.length - 1;
  while (end >= 0 && lines[end].trim() === '') end--;
  if (end < 0) return { bodyLines: lines, refLines: [] };

  let i = end;
  while (i >= 0 && (lines[i].trim() === '' || isRef(lines[i]))) i--;

  const start = i + 1;
  const candidate = lines.slice(start, end + 1);
  const hasAnyRef = candidate.some((l) => isRef(l));
  if (!hasAnyRef) return { bodyLines: lines, refLines: [] };

  const bodyLines = lines.slice(0, start);
  const refLines = candidate.filter((l) => l.trim() !== '');
  return { bodyLines, refLines };
}

function collectTopLevelHeadings(bodyLines) {
  // Collect ## headings excluding "目录".
  const headings = [];
  let inFence = false;
  for (const line of bodyLines) {
    const t = line.trimStart();
    if (t.startsWith('```')) inFence = !inFence;
    if (inFence) continue;

    const m = line.match(/^##\s+(.+?)\s*$/);
    if (!m) continue;
    const title = m[1].trim();
    if (title === '目录') continue;
    headings.push(title);
  }
  return headings;
}

function rewriteToc(bodyLines, headings) {
  const lines = [...bodyLines];

  const tocIdx = lines.findIndex((l) => l.trim() === '## 目录');
  if (tocIdx === -1) return lines;

  // Find end of TOC block: first line that is '---' or a heading after TOC.
  let end = tocIdx + 1;
  while (end < lines.length) {
    const t = lines[end].trim();
    if (t === '---') break;
    if (/^##\s+/.test(t)) break;
    end++;
  }

  const tocLines = headings
    .map((h) => {
      const id = slugifyForAnchor(h);
      return `- [${h}](#${id})`;
    })
    .join('\n');

  // Keep a blank line after "## 目录" like 20260116.
  const newBlock = ['## 目录', '', ...tocLines.split('\n'), ''];
  lines.splice(tocIdx, end - tocIdx, ...newBlock);
  return lines;
}

function addAnchors(bodyLines) {
  const out = [];
  let inFence = false;
  const used = new Map();

  const uniqueId = (base) => {
    const prev = used.get(base) ?? 0;
    used.set(base, prev + 1);
    if (prev === 0) return base;
    return `${base}-${prev + 1}`;
  };

  for (let idx = 0; idx < bodyLines.length; idx++) {
    const line = bodyLines[idx];
    const t = line.trimStart();
    if (t.startsWith('```')) {
      inFence = !inFence;
      out.push(line);
      continue;
    }
    if (inFence) {
      out.push(line);
      continue;
    }

    const m = line.match(/^(##|###)\s+(.+?)\s*$/);
    if (!m) {
      out.push(line);
      continue;
    }

    const headingText = m[2].trim();
    // Skip adding anchor for "目录" to match 20260116.
    if (m[1] === '##' && headingText === '目录') {
      out.push(line);
      continue;
    }

    // If previous non-empty line is already an anchor, don’t add.
    let j = out.length - 1;
    while (j >= 0 && out[j].trim() === '') j--;
    if (j >= 0 && isAnchorLine(out[j])) {
      out.push(line);
      continue;
    }

    const base = slugifyForAnchor(headingText);
    const id = uniqueId(base);
    out.push(`<a id="${id}"></a>`);
    out.push(line);
  }

  return out;
}

function buildReferenceSection(refs) {
  const keys = [...refs.keys()].sort((a, b) => a - b);
  if (keys.length === 0) return [];

  const lines = [];
  lines.push('');
  lines.push('<a id="引用"></a>');
  lines.push('## 引用');
  lines.push('');
  for (const n of keys) {
    const { title, url } = refs.get(n);
    lines.push(`[${n}] [${titleWithPeriod(title)}](${url})`);
  }
  return lines;
}

async function main() {
  const inputPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve('content/zh/20260117.md');

  const original = await fs.readFile(inputPath, 'utf8');
  const lines = original.split(/\r?\n/);

  const { bodyLines: withoutRefsLines, refLines } = extractReferenceBlock(lines);
  const refs = parseReferenceLines(refLines);

  let bodyLines = withoutRefsLines;

  // 1) Generate TOC from existing top-level headings.
  const headings = collectTopLevelHeadings(bodyLines);
  bodyLines = rewriteToc(bodyLines, headings);

  // 2) Add anchors for headings.
  bodyLines = addAnchors(bodyLines);

  // 3) Replace inline citation markers.
  let body = bodyLines.join('\n');
  if (refs.size > 0) {
    body = replaceCitationMarkers(body, refs);
  }

  // 4) Append normalized reference section.
  const finalLines = body.split(/\r?\n/);
  const refSectionLines = buildReferenceSection(refs);
  let out = [...finalLines, ...refSectionLines].join('\n').replace(/\n{4,}$/g, '\n\n\n');
  if (!out.endsWith('\n')) out += '\n';

  await fs.writeFile(inputPath, out, 'utf8');
  process.stdout.write(`Normalized: ${path.relative(process.cwd(), inputPath)}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
