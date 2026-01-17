#!/usr/bin/env python3
"""
Generate images for PPT slides using Gemini API (Nano Banana Pro)
Based on outline/agentic-ai-manufacturing-ppt-outline-20260117.md
"""

import argparse
import os
import re
import sys
import time
from pathlib import Path

from google import genai
from google.genai import types

# Load .env file
env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                # Remove quotes if present
                value = value.strip('"').strip("'")
                os.environ[key] = value

# Initialize Gemini client
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("Error: GEMINI_API_KEY not found in environment or .env file")
    sys.exit(1)

client = None

# Output directory
output_dir = Path("images")
output_dir.mkdir(exist_ok=True)


def _extract_date_token(path: Path) -> str | None:
    m = re.search(r"(20\d{6,8})", str(path))
    return m.group(1) if m else None


def parse_slides_from_outline(outline_path: Path) -> list[dict]:
    """Parse slides from markdown outline.

    Slides are identified by headings like: "## Slide 01｜封面".
    The file also contains '---' separators; we treat them as visual separators only.
    """
    text = outline_path.read_text(encoding="utf-8")
    pattern = re.compile(r"^##\s*Slide\s*(\d+)\s*[｜|]\s*(.+?)\s*$", re.MULTILINE)
    matches = list(pattern.finditer(text))
    if not matches:
        raise ValueError(f"No slides found in {outline_path}")

    slides: list[dict] = []
    for idx, m in enumerate(matches):
        num = int(m.group(1))
        title = m.group(2).strip()
        start = m.end()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
        body = text[start:end].strip()

        slides.append({"num": num, "title": title, "body": body})
    return slides


def build_prompt(slide: dict) -> str:
    title = slide["title"]
    body = slide["body"]

    key_lines: list[str] = []
    for line in body.splitlines():
        s = line.strip()
        if not s:
            continue
        if s.startswith("**一句话结论**") or s.startswith("**PPT版式/图表建议**") or s.startswith("**可视化建议**"):
            key_lines.append(s)
            continue
        if s.startswith("- 版式") or s.startswith("- 图表") or s.startswith("- 视觉") or s.startswith("- 素材"):
            key_lines.append(s)
            continue
        if s.startswith("- ") and len(key_lines) < 14:
            key_lines.append(s)

    distilled = "\n".join(key_lines[:18]).strip()

    if "封面" in title or "Cover" in title:
        style = (
            "Photorealistic, premium corporate slide background. Modern manufacturing factory floor, "
            "robotic automation, clean lighting, subtle digital HUD overlays. "
            "Blue/graphite palette, high-end executive look. "
            "Leave generous empty space on the left for title text."
        )
    else:
        style = (
            "Clean minimalist business infographic illustration for an executive manufacturing PPT. "
            "Flat vector + subtle depth, crisp lines, consistent icon style. "
            "Blue/graphite palette with restrained accent (cyan/orange). "
            "Leave whitespace for text overlay."
        )

    guardrails = (
        "IMPORTANT: Do NOT include any readable text, letters, numbers, watermarks, or logos. "
        "Use shapes/icons only; if labels are needed, use unlabeled placeholders." 
    )

    content = distilled if distilled else body[:800]

    return (
        f"Create a 16:9 slide image for the slide titled: {title}.\n"
        f"Style: {style}\n"
        f"Layout hints (from outline):\n{content}\n"
        f"{guardrails}\n"
        "Resolution: 2K. Aspect ratio: 16:9."
    )


def output_filename(prefix: str, date_token: str | None, slide_num: int) -> Path:
    date_part = f"-{date_token}" if date_token else ""
    return output_dir / f"{prefix}{date_part}-slide-{slide_num:02d}.jpg"

def generate_slide_image(
    slide_info: dict,
    *,
    out_path: Path,
    image_size: str,
    max_retries: int,
) -> bool:
    """Generate a single slide image."""
    num = slide_info["num"]
    title = slide_info["title"]
    prompt = slide_info["prompt"]
    
    print(f"\n{'='*80}")
    print(f"Generating Slide {num}: {title}")
    print(f"{'='*80}")
    print(f"Prompt: {prompt[:100]}...")
    
    for attempt in range(1, max_retries + 1):
        try:
            response = client.models.generate_content(
                model="gemini-3-pro-image-preview",
                contents=[prompt],
                config=types.GenerateContentConfig(
                    response_modalities=["TEXT", "IMAGE"],
                    image_config=types.ImageConfig(
                        aspect_ratio="16:9",
                        image_size=image_size,
                    ),
                ),
            )

            for part in response.parts:
                if getattr(part, "inline_data", None):
                    image = part.as_image()
                    image.save(str(out_path))
                    print(f"✓ Saved: {out_path}")
                    return True

            print(f"⚠ No image returned for slide {num}")
            return False
        except Exception as e:
            print(f"✗ Error (attempt {attempt}/{max_retries}) for slide {num}: {e}")
            if attempt < max_retries:
                time.sleep(2.0 * attempt)

    return False

def main() -> int:
    parser = argparse.ArgumentParser(description="Generate slide images from a markdown outline using Gemini image model")
    parser.add_argument(
        "--outline",
        default="outline/agentic-ai-manufacturing-ppt-outline-20260117.md",
        help="Path to outline markdown file",
    )
    parser.add_argument("--start", type=int, default=1, help="Start slide number (inclusive)")
    parser.add_argument("--end", type=int, default=10_000, help="End slide number (inclusive)")
    parser.add_argument("--image-size", default="2K", choices=["1K", "2K", "4K"], help="Output image size")
    parser.add_argument("--prefix", default="agentic-ai-manufacturing", help="Output filename prefix")
    parser.add_argument("--retries", type=int, default=3, help="Max retries per slide")
    parser.add_argument("--timeout", type=int, default=180, help="Per-request timeout in seconds")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing images")

    args = parser.parse_args()

    global client
    timeout_ms = max(10, args.timeout) * 1000
    client = genai.Client(api_key=api_key, http_options=types.HttpOptions(timeout=timeout_ms))

    outline_path = Path(args.outline)
    date_token = _extract_date_token(outline_path)

    slides_raw = parse_slides_from_outline(outline_path)
    slides_raw.sort(key=lambda s: s["num"])
    slides_raw = [s for s in slides_raw if args.start <= s["num"] <= args.end]

    print("=" * 80)
    print("Generating PPT Slide Images with Gemini API")
    print("=" * 80)
    print(f"Outline: {outline_path}")
    print(f"Slides selected: {len(slides_raw)} (range {args.start}..{args.end})")
    print(f"Output directory: {output_dir.absolute()}")
    print("Model: gemini-3-pro-image-preview")
    print(f"Format: 16:9, {args.image_size} resolution")

    success_count = 0
    failed_slides: list[int] = []

    for slide in slides_raw:
        num = slide["num"]
        title = slide["title"]
        out_path = output_filename(args.prefix, date_token, num)
        if out_path.exists() and not args.overwrite:
            print(f"---\nSkipping Slide {num:02d} (exists): {out_path}")
            success_count += 1
            continue

        prompt = build_prompt(slide)
        ok = generate_slide_image(
            {"num": num, "title": title, "prompt": prompt},
            out_path=out_path,
            image_size=args.image_size,
            max_retries=args.retries,
        )
        if ok:
            success_count += 1
        else:
            failed_slides.append(num)

    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"✓ Successfully generated (or skipped existing): {success_count}/{len(slides_raw)}")
    if failed_slides:
        print(f"✗ Failed slides: {failed_slides}")
        return 1
    print("✓ All selected slides generated successfully!")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
