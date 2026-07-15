#!/usr/bin/env python3
"""Create a local visual comparison report for a source AI/PDF and generator export."""

from __future__ import annotations

import argparse
import copy
import html
import json
import re
import shlex
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

try:
    import numpy as np
    from PIL import Image, ImageChops, ImageDraw, ImageFont
except ImportError as exc:  # pragma: no cover - exercised only on an unprepared machine
    print(
        "Missing comparison dependencies. Run:\n"
        "  python3 -m pip install -r tools/requirements-compare.txt",
        file=sys.stderr,
    )
    raise SystemExit(2) from exc


DOCUMENT_EXTENSIONS = {".ai", ".pdf"}
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff"}
RESAMPLING = Image.Resampling.LANCZOS


def parse_box(value: str) -> tuple[int, int, int, int]:
    try:
        x, y, width, height = (int(part.strip()) for part in value.split(","))
    except (ValueError, TypeError) as exc:
        raise argparse.ArgumentTypeError("box must be x,y,width,height in rendered pixels") from exc
    if min(x, y) < 0 or min(width, height) <= 0:
        raise argparse.ArgumentTypeError("box coordinates must be non-negative and dimensions positive")
    return x, y, width, height


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Compare a PDF-compatible Illustrator/PDF source with a door-sign PNG/PDF export "
            "and write a local HTML visual-diff report."
        )
    )
    parser.add_argument("--reference", type=Path, help="source .ai, .pdf, or image")
    parser.add_argument("--candidate", type=Path, help="generator .png, .pdf, or image")
    parser.add_argument(
        "--manifest",
        type=Path,
        help="JSON list of source/export pairs; creates a keyboard-navigable review gallery",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("output/compare/latest"),
        help="report directory (default: output/compare/latest)",
    )
    parser.add_argument("--dpi", type=int, default=144, help="PDF/AI render DPI (default: 144)")
    parser.add_argument("--width", type=int, default=1400, help="normalized comparison width (default: 1400)")
    parser.add_argument(
        "--reference-crop",
        choices=("auto", "page", "content"),
        default="auto",
        help="reference crop strategy (default: auto/page for AI and PDF)",
    )
    parser.add_argument(
        "--candidate-crop",
        choices=("auto", "page", "content", "sign"),
        default="auto",
        help="candidate crop strategy (default: auto/sign for a PDF, page for an image)",
    )
    parser.add_argument("--reference-box", type=parse_box, help="override reference crop: x,y,width,height")
    parser.add_argument("--candidate-box", type=parse_box, help="override candidate crop: x,y,width,height")
    parser.add_argument(
        "--difference-threshold",
        type=int,
        default=24,
        help="RGB delta counted as visibly changed, 0-255 (default: 24)",
    )
    return parser


def validate_args(args: argparse.Namespace) -> None:
    if args.manifest:
        args.manifest = args.manifest.expanduser().resolve()
        if not args.manifest.is_file():
            raise SystemExit(f"Manifest file not found: {args.manifest}")
        if args.reference or args.candidate:
            raise SystemExit("Use either --manifest or --reference/--candidate, not both")
    elif not args.reference or not args.candidate:
        raise SystemExit("Provide both --reference and --candidate, or provide --manifest")

    if args.manifest:
        paths = []
    else:
        paths = [("reference", args.reference), ("candidate", args.candidate)]

    for label, supplied_path in paths:
        path = supplied_path.expanduser().resolve()
        setattr(args, label, path)
        if not path.is_file():
            raise SystemExit(f"{label.capitalize()} file not found: {path}")
        if path.suffix.lower() not in DOCUMENT_EXTENSIONS | IMAGE_EXTENSIONS:
            raise SystemExit(f"Unsupported {label} format: {path.suffix or '(none)'}")
    if args.dpi < 36 or args.dpi > 1200:
        raise SystemExit("--dpi must be between 36 and 1200")
    if args.width < 320 or args.width > 6000:
        raise SystemExit("--width must be between 320 and 6000")
    if not 0 <= args.difference_threshold <= 255:
        raise SystemExit("--difference-threshold must be between 0 and 255")


def render_input(path: Path, dpi: int, work_dir: Path, label: str) -> tuple[Image.Image, dict]:
    suffix = path.suffix.lower()
    if suffix in IMAGE_EXTENSIONS:
        image = Image.open(path).convert("RGB")
        return image, {"kind": "image", "rendered_size": list(image.size)}

    pdftoppm = shutil.which("pdftoppm")
    if not pdftoppm:
        raise SystemExit(
            "pdftoppm is required for .ai/.pdf files. Install Poppler with: brew install poppler"
        )

    output_prefix = work_dir / label
    command = [
        pdftoppm,
        "-png",
        "-r",
        str(dpi),
        "-f",
        "1",
        "-singlefile",
        str(path),
        str(output_prefix),
    ]
    completed = subprocess.run(command, capture_output=True, text=True, check=False)
    rendered_path = output_prefix.with_suffix(".png")
    if completed.returncode or not rendered_path.exists():
        detail = completed.stderr.strip() or completed.stdout.strip() or "unknown Poppler error"
        raise SystemExit(f"Could not render {path}: {detail}")
    image = Image.open(rendered_path).convert("RGB")
    return image, {
        "kind": "document",
        "rendered_size": list(image.size),
        "renderer": "pdftoppm",
        "dpi": dpi,
    }


def clamp_box(box: tuple[int, int, int, int], size: tuple[int, int]) -> tuple[int, int, int, int]:
    x, y, width, height = box
    image_width, image_height = size
    left = min(max(x, 0), image_width - 1)
    top = min(max(y, 0), image_height - 1)
    right = min(max(left + width, left + 1), image_width)
    bottom = min(max(top + height, top + 1), image_height)
    return left, top, right, bottom


def content_box(image: Image.Image) -> tuple[int, int, int, int]:
    pixels = np.asarray(image, dtype=np.int16)
    corners = np.array(
        [pixels[0, 0], pixels[0, -1], pixels[-1, 0], pixels[-1, -1]], dtype=np.int16
    )
    background = np.median(corners, axis=0)
    delta = np.max(np.abs(pixels - background), axis=2)
    mask = delta > 8
    ys, xs = np.where(mask)
    if not len(xs):
        return 0, 0, image.width, image.height
    padding = max(2, round(min(image.size) * 0.004))
    left = max(int(xs.min()) - padding, 0)
    top = max(int(ys.min()) - padding, 0)
    right = min(int(xs.max()) + padding + 1, image.width)
    bottom = min(int(ys.max()) + padding + 1, image.height)
    return left, top, right, bottom


def sign_box_from_header(image: Image.Image, target_aspect: float) -> tuple[int, int, int, int] | None:
    """Find the large UNBC-green header and infer the complete artwork rectangle below it."""
    pixels = np.asarray(image, dtype=np.int16)
    red, green, blue = pixels[:, :, 0], pixels[:, :, 1], pixels[:, :, 2]
    green_mask = (
        (green > red + 12)
        & (green > blue + 5)
        & ((np.maximum.reduce((red, green, blue)) - np.minimum.reduce((red, green, blue))) > 22)
        & (green < 185)
    )

    row_counts = green_mask.sum(axis=1)
    substantial_rows = np.where(row_counts >= max(30, image.width * 0.12))[0]
    if not len(substantial_rows):
        return None

    top = int(substantial_rows.min())
    header_rows = substantial_rows[substantial_rows <= top + max(20, image.height * 0.35)]
    header_mask = green_mask[header_rows]
    column_counts = header_mask.sum(axis=0)
    substantial_columns = np.where(column_counts >= max(4, len(header_rows) * 0.35))[0]
    if not len(substantial_columns):
        return None

    left = int(substantial_columns.min())
    right = int(substantial_columns.max()) + 1
    width = right - left
    if width < image.width * 0.25:
        return None

    height = round(width / target_aspect)
    if top + height > image.height:
        height = image.height - top
        width = min(width, round(height * target_aspect))
        right = left + width
    return left, top, right, top + height


def crop_image(
    image: Image.Image,
    strategy: str,
    explicit_box: tuple[int, int, int, int] | None,
    role: str,
    kind: str,
    target_aspect: float | None,
) -> tuple[Image.Image, dict]:
    if explicit_box:
        box = clamp_box(explicit_box, image.size)
        selected = "manual"
    else:
        selected = strategy
        if strategy == "auto":
            selected = "sign" if role == "candidate" and kind == "document" else "page"

        if selected == "page":
            box = (0, 0, image.width, image.height)
        elif selected == "content":
            box = content_box(image)
        elif selected == "sign":
            box = sign_box_from_header(image, target_aspect or (image.width / image.height))
            if box is None:
                print(
                    f"Warning: could not detect the {role} sign header; using the full page.",
                    file=sys.stderr,
                )
                box = (0, 0, image.width, image.height)
                selected = "page-fallback"
        else:
            raise ValueError(f"Unknown crop strategy: {selected}")

    cropped = image.crop(box)
    return cropped, {
        "strategy": selected,
        "box": [int(value) for value in box],
        "cropped_size": list(cropped.size),
    }


def normalize_pair(reference: Image.Image, candidate: Image.Image, width: int) -> tuple[Image.Image, Image.Image]:
    height = max(1, round(width * reference.height / reference.width))
    size = (width, height)
    return reference.resize(size, RESAMPLING), candidate.resize(size, RESAMPLING)


def default_font(size: int) -> ImageFont.ImageFont:
    try:
        return ImageFont.load_default(size=size)
    except TypeError:  # Pillow < 10
        return ImageFont.load_default()


def labelled_side_by_side(reference: Image.Image, candidate: Image.Image) -> Image.Image:
    label_height = 62
    gap = 24
    canvas = Image.new("RGB", (reference.width * 2 + gap, reference.height + label_height), "#eef2f0")
    canvas.paste(reference, (0, label_height))
    canvas.paste(candidate, (reference.width + gap, label_height))
    draw = ImageDraw.Draw(canvas)
    font = default_font(27)
    draw.text((18, 17), "SOURCE AI / PDF", fill="#173d31", font=font)
    draw.text((reference.width + gap + 18, 17), "GENERATOR EXPORT", fill="#173d31", font=font)
    return canvas


def build_comparison_images(
    reference: Image.Image, candidate: Image.Image, threshold: int
) -> tuple[dict[str, Image.Image], dict[str, float]]:
    reference_array = np.asarray(reference, dtype=np.int16)
    candidate_array = np.asarray(candidate, dtype=np.int16)
    delta = np.abs(reference_array - candidate_array)
    magnitude = delta.max(axis=2)

    mae = float(delta.mean())
    changed = float((magnitude >= threshold).mean() * 100)
    similarity = float(max(0.0, 100.0 * (1.0 - mae / 255.0)))
    p95 = float(np.percentile(magnitude, 95))

    amplified = np.clip(magnitude.astype(np.float32) * 3.5, 0, 255).astype(np.uint8)
    heat = np.zeros((*amplified.shape, 3), dtype=np.uint8)
    heat[:, :, 0] = amplified
    heat[:, :, 1] = np.clip((amplified.astype(np.int16) - 70) * 1.45, 0, 255).astype(np.uint8)
    heat[:, :, 2] = np.clip((amplified.astype(np.int16) - 190) * 2, 0, 255).astype(np.uint8)

    overlay = Image.blend(reference, candidate, 0.5)
    difference = Image.fromarray(heat, "RGB")
    side_by_side = labelled_side_by_side(reference, candidate)
    blink = [reference, candidate]

    return {
        "overlay": overlay,
        "difference": difference,
        "side_by_side": side_by_side,
        "blink_frames": blink,
    }, {
        "mean_absolute_rgb_delta": round(mae, 3),
        "similarity_percent": round(similarity, 2),
        "changed_pixels_percent": round(changed, 2),
        "difference_p95": round(p95, 2),
        "difference_threshold": threshold,
    }


def write_report(output: Path, metadata: dict, images: dict[str, Image.Image]) -> None:
    output.mkdir(parents=True, exist_ok=True)
    metadata["normalized_size"] = list(metadata["normalized_size"])

    reference = metadata.pop("_reference_image")
    candidate = metadata.pop("_candidate_image")
    reference.save(output / "reference.png", optimize=True)
    candidate.save(output / "candidate.png", optimize=True)
    images["side_by_side"].save(output / "side-by-side.png", optimize=True)
    images["overlay"].save(output / "overlay.png", optimize=True)
    images["difference"].save(output / "difference.png", optimize=True)
    images["blink_frames"][0].save(
        output / "blink.gif",
        save_all=True,
        append_images=[images["blink_frames"][1]],
        duration=700,
        loop=0,
        optimize=False,
    )
    (output / "metadata.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")

    metrics = metadata["metrics"]
    command = html.escape(metadata["command"])
    reference_path = html.escape(metadata["reference"]["path"])
    candidate_path = html.escape(metadata["candidate"]["path"])
    label = html.escape(metadata.get("label", "Door sign comparison"))
    report = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{label} - UNBC Door Sign Visual Comparison</title>
  <style>
    :root {{ color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }}
    body {{ margin: 0; background: #eef3f1; color: #17231f; }}
    main {{ width: min(1500px, calc(100% - 40px)); margin: 32px auto 64px; }}
    h1 {{ margin: 0 0 8px; color: #155d47; }}
    .lede {{ margin: 0 0 24px; color: #53635d; }}
    .card {{ background: white; border: 1px solid #d9e2de; border-radius: 14px; padding: 20px; margin: 18px 0; box-shadow: 0 6px 22px rgba(18, 55, 43, .06); }}
    .metrics {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }}
    .metric {{ background: #f3f7f5; border-radius: 10px; padding: 14px; }}
    .metric strong {{ display: block; font-size: 1.45rem; color: #155d47; }}
    .metric span {{ color: #66736e; font-size: .9rem; }}
    img {{ display: block; width: 100%; height: auto; border: 1px solid #d8dfdc; background: white; }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 18px; }}
    h2 {{ margin: 0 0 12px; font-size: 1.1rem; }}
    code {{ overflow-wrap: anywhere; }}
    dl {{ display: grid; grid-template-columns: max-content 1fr; gap: 8px 14px; margin: 0; }}
    dt {{ font-weight: 700; }} dd {{ margin: 0; color: #52615c; overflow-wrap: anywhere; }}
    .note {{ color: #52615c; line-height: 1.5; }}
  </style>
</head>
<body>
<main>
  <h1>{label}</h1>
  <p class="lede">Local report generated from the first page of each input.</p>
  <section class="card metrics">
    <div class="metric"><strong>{metrics['similarity_percent']:.2f}%</strong><span>pixel similarity</span></div>
    <div class="metric"><strong>{metrics['changed_pixels_percent']:.2f}%</strong><span>pixels over delta {metrics['difference_threshold']}</span></div>
    <div class="metric"><strong>{metrics['mean_absolute_rgb_delta']:.3f}</strong><span>mean RGB delta (0-255)</span></div>
    <div class="metric"><strong>{metrics['difference_p95']:.2f}</strong><span>95th percentile delta</span></div>
  </section>
  <section class="card"><h2>Side by side</h2><img src="side-by-side.png" alt="Source and generator export side by side"></section>
  <div class="grid">
    <section class="card"><h2>50% overlay</h2><img src="overlay.png" alt="Transparent overlay"></section>
    <section class="card"><h2>Difference heatmap</h2><img src="difference.png" alt="Amplified pixel difference heatmap"></section>
    <section class="card"><h2>Blink comparison</h2><img src="blink.gif" alt="Animation alternating source and candidate"></section>
  </div>
  <section class="card">
    <h2>Inputs</h2>
    <dl><dt>Source</dt><dd>{reference_path}</dd><dt>Candidate</dt><dd>{candidate_path}</dd></dl>
  </section>
  <section class="card note">
    <h2>Reading the result</h2>
    <p>The metric is a rendering diagnostic, not a pass/fail grade. Font rasterization, antialiasing, source bleed, and small page-size differences can change pixels even when the sign is visually correct. Use the overlay and blink views to judge alignment, spacing, wrapping, badge placement, and typography.</p>
    <p><strong>Command:</strong> <code>{command}</code></p>
  </section>
</main>
</body>
</html>
"""
    (output / "report.html").write_text(report, encoding="utf-8")


def resolve_manifest_path(value: str, base: Path) -> Path:
    path = Path(value).expanduser()
    return (path if path.is_absolute() else base / path).resolve()


def slugify(value: str, fallback: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or fallback


def load_manifest(path: Path) -> tuple[str, list[dict]]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise SystemExit(f"Could not read comparison manifest {path}: {exc}") from exc

    entries = payload.get("comparisons") if isinstance(payload, dict) else payload
    if not isinstance(entries, list) or not entries:
        raise SystemExit("Comparison manifest must contain a non-empty 'comparisons' array")

    title = payload.get("title", "UNBC Door Sign Review") if isinstance(payload, dict) else "UNBC Door Sign Review"
    normalized = []
    used_slugs: set[str] = set()
    for index, entry in enumerate(entries, 1):
        if not isinstance(entry, dict) or not entry.get("reference") or not entry.get("candidate"):
            raise SystemExit(f"Manifest comparison {index} needs 'reference' and 'candidate' paths")
        label = str(entry.get("label") or entry.get("id") or f"Sign {index}")
        base_slug = slugify(str(entry.get("id") or label), f"sign-{index}")
        slug = base_slug
        suffix = 2
        while slug in used_slugs:
            slug = f"{base_slug}-{suffix}"
            suffix += 1
        used_slugs.add(slug)

        reference = resolve_manifest_path(str(entry["reference"]), path.parent)
        candidate = resolve_manifest_path(str(entry["candidate"]), path.parent)
        for role, item_path in (("reference", reference), ("candidate", candidate)):
            if not item_path.is_file():
                raise SystemExit(f"Manifest {role} file not found for '{label}': {item_path}")
            if item_path.suffix.lower() not in DOCUMENT_EXTENSIONS | IMAGE_EXTENSIONS:
                raise SystemExit(f"Unsupported {role} format for '{label}': {item_path.suffix}")

        normalized.append(
            {
                "id": str(entry.get("id") or slug),
                "slug": slug,
                "label": label,
                "reference": reference,
                "candidate": candidate,
                "reference_crop": entry.get("referenceCrop"),
                "candidate_crop": entry.get("candidateCrop"),
                "reference_box": parse_box(entry["referenceBox"]) if entry.get("referenceBox") else None,
                "candidate_box": parse_box(entry["candidateBox"]) if entry.get("candidateBox") else None,
            }
        )
    return str(title), normalized


def compare_pair(
    args: argparse.Namespace,
    reference_path: Path,
    candidate_path: Path,
    output: Path,
    label: str,
) -> dict:
    with tempfile.TemporaryDirectory(prefix="unbc-sign-compare-") as temporary:
        work_dir = Path(temporary)
        reference_render, reference_info = render_input(reference_path, args.dpi, work_dir, "reference")
        candidate_render, candidate_info = render_input(candidate_path, args.dpi, work_dir, "candidate")

        reference_crop, reference_crop_info = crop_image(
            reference_render,
            args.reference_crop,
            args.reference_box,
            "reference",
            reference_info["kind"],
            None,
        )
        reference_aspect = reference_crop.width / reference_crop.height
        candidate_crop, candidate_crop_info = crop_image(
            candidate_render,
            args.candidate_crop,
            args.candidate_box,
            "candidate",
            candidate_info["kind"],
            reference_aspect,
        )

        reference, candidate = normalize_pair(reference_crop, candidate_crop, args.width)
        images, metrics = build_comparison_images(reference, candidate, args.difference_threshold)
        metadata = {
            "label": label,
            "reference": {
                "path": str(reference_path),
                **reference_info,
                "crop": reference_crop_info,
            },
            "candidate": {
                "path": str(candidate_path),
                **candidate_info,
                "crop": candidate_crop_info,
            },
            "normalized_size": reference.size,
            "metrics": metrics,
            "command": shlex.join([sys.executable, *sys.argv]),
            "_reference_image": reference,
            "_candidate_image": candidate,
        }
        write_report(output, metadata, images)

    return {
        "label": label,
        "reference": str(reference_path),
        "candidate": str(candidate_path),
        "metrics": metrics,
    }


def write_gallery(output: Path, title: str, comparisons: list[dict]) -> None:
    output.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(comparisons, ensure_ascii=False).replace("</", "<\\/")
    safe_title = html.escape(title)
    document = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{safe_title}</title>
  <style>
    :root {{ color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }}
    * {{ box-sizing: border-box; }}
    body {{ margin: 0; background: #eaf0ed; color: #17231f; }}
    header {{ position: sticky; top: 0; z-index: 2; padding: 16px 24px; background: rgba(255,255,255,.96); border-bottom: 1px solid #d4dfda; backdrop-filter: blur(12px); }}
    .topbar {{ max-width: 1600px; margin: auto; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 16px; }}
    h1 {{ margin: 0; color: #155d47; font-size: 1.2rem; }}
    select, button, a.button {{ min-height: 42px; border: 1px solid #aebdb7; border-radius: 9px; background: white; color: #173d31; padding: 8px 13px; font: inherit; }}
    button, a.button {{ cursor: pointer; font-weight: 700; text-decoration: none; }}
    button:hover, button.active, a.button:hover {{ border-color: #176b51; background: #e5f3ed; }}
    main {{ width: min(1600px, calc(100% - 36px)); margin: 22px auto 60px; }}
    .summary {{ display: flex; flex-wrap: wrap; align-items: center; gap: 10px 18px; margin-bottom: 14px; }}
    #counter {{ color: #66736e; font-weight: 700; }}
    #label {{ margin: 0; flex: 1; min-width: 280px; font-size: 1.35rem; }}
    .modes {{ display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }}
    .viewer {{ background: white; border: 1px solid #d4dfda; border-radius: 14px; padding: 14px; box-shadow: 0 8px 28px rgba(18,55,43,.08); }}
    #comparisonImage {{ width: 100%; height: auto; display: block; border: 1px solid #d8dfdc; background: white; }}
    .metrics {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap: 10px; margin-top: 14px; }}
    .metric {{ background: #f1f6f3; border-radius: 9px; padding: 12px; }}
    .metric strong {{ display: block; color: #155d47; font-size: 1.25rem; }}
    .paths {{ margin-top: 14px; color: #596862; font-size: .85rem; overflow-wrap: anywhere; }}
    .help {{ color: #68766f; font-size: .88rem; }}
    @media (max-width: 800px) {{ .topbar {{ grid-template-columns: 1fr; }} header {{ position: static; }} }}
  </style>
</head>
<body>
<header>
  <div class="topbar">
    <h1>{safe_title}</h1>
    <select id="signPicker" aria-label="Choose sign"></select>
    <div><button id="previous" type="button">Previous</button> <button id="next" type="button">Next</button></div>
  </div>
</header>
<main>
  <div class="summary"><span id="counter"></span><h2 id="label"></h2><a id="detail" class="button" href="#">Detailed report</a></div>
  <div class="modes" aria-label="Comparison view">
    <button type="button" data-mode="side-by-side.png" class="active">Side by side</button>
    <button type="button" data-mode="overlay.png">Overlay</button>
    <button type="button" data-mode="difference.png">Difference</button>
    <button type="button" data-mode="blink.gif">Blink</button>
  </div>
  <section class="viewer">
    <img id="comparisonImage" alt="Current sign comparison">
    <div class="metrics">
      <div class="metric"><strong id="similarity"></strong><span>pixel similarity</span></div>
      <div class="metric"><strong id="changed"></strong><span>changed pixels</span></div>
      <div class="metric"><strong id="delta"></strong><span>mean RGB delta</span></div>
    </div>
    <div class="paths"><div><strong>Source:</strong> <span id="referencePath"></span></div><div><strong>Export:</strong> <span id="candidatePath"></span></div></div>
  </section>
  <p class="help">Use Previous/Next, the picker, or the left and right arrow keys to flip through signs one by one.</p>
</main>
<script>
  const comparisons = {payload};
  const picker = document.querySelector('#signPicker');
  const image = document.querySelector('#comparisonImage');
  let index = Math.max(0, comparisons.findIndex(item => item.id === location.hash.slice(1)));
  let mode = 'side-by-side.png';
  comparisons.forEach((item, itemIndex) => picker.add(new Option(`${{itemIndex + 1}}. ${{item.label}}`, String(itemIndex))));
  function render() {{
    const item = comparisons[index];
    picker.value = String(index);
    location.hash = item.id;
    document.querySelector('#counter').textContent = `${{index + 1}} / ${{comparisons.length}}`;
    document.querySelector('#label').textContent = item.label;
    document.querySelector('#detail').href = `${{item.slug}}/report.html`;
    image.src = `${{item.slug}}/${{mode}}`;
    image.alt = `${{item.label}} - ${{mode.replace(/[-.]/g, ' ')}}`;
    document.querySelector('#similarity').textContent = `${{item.metrics.similarity_percent.toFixed(2)}}%`;
    document.querySelector('#changed').textContent = `${{item.metrics.changed_pixels_percent.toFixed(2)}}%`;
    document.querySelector('#delta').textContent = item.metrics.mean_absolute_rgb_delta.toFixed(3);
    document.querySelector('#referencePath').textContent = item.reference;
    document.querySelector('#candidatePath').textContent = item.candidate;
  }}
  function move(amount) {{ index = (index + amount + comparisons.length) % comparisons.length; render(); }}
  document.querySelector('#previous').addEventListener('click', () => move(-1));
  document.querySelector('#next').addEventListener('click', () => move(1));
  picker.addEventListener('change', event => {{ index = Number(event.target.value); render(); }});
  document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {{
    mode = button.dataset.mode;
    document.querySelectorAll('[data-mode]').forEach(item => item.classList.toggle('active', item === button));
    render();
  }}));
  document.addEventListener('keydown', event => {{
    if (event.key === 'ArrowLeft') move(-1);
    if (event.key === 'ArrowRight') move(1);
  }});
  render();
</script>
</body>
</html>
"""
    (output / "index.html").write_text(document, encoding="utf-8")


def main() -> int:
    args = build_parser().parse_args()
    validate_args(args)
    output = args.output.expanduser().resolve()

    if args.manifest:
        title, entries = load_manifest(args.manifest)
        summaries = []
        for entry in entries:
            pair_args = copy.copy(args)
            if entry["reference_crop"]:
                pair_args.reference_crop = entry["reference_crop"]
            if entry["candidate_crop"]:
                pair_args.candidate_crop = entry["candidate_crop"]
            pair_args.reference_box = entry["reference_box"]
            pair_args.candidate_box = entry["candidate_box"]
            summary = compare_pair(
                pair_args,
                entry["reference"],
                entry["candidate"],
                output / entry["slug"],
                entry["label"],
            )
            summaries.append({"id": entry["id"], "slug": entry["slug"], **summary})
            print(f"Compared {entry['label']}")
        write_gallery(output, title, summaries)
        print(f"Review gallery: {output / 'index.html'}")
    else:
        label = args.reference.stem
        summary = compare_pair(args, args.reference, args.candidate, output, label)
        metrics = summary["metrics"]
        print(f"Comparison report: {output / 'report.html'}")
        print(
            f"Similarity {metrics['similarity_percent']:.2f}% | "
            f"changed pixels {metrics['changed_pixels_percent']:.2f}% | "
            f"mean RGB delta {metrics['mean_absolute_rgb_delta']:.3f}"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
