#!/usr/bin/env python3
"""Render every production source sign for the local live-generator comparison viewer."""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import struct
import subprocess
import tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path


def parser() -> argparse.ArgumentParser:
    value = argparse.ArgumentParser(description="Prepare all archive source renders for local review")
    value.add_argument("--archive", type=Path, default=Path("data/door-sign-archive.json"))
    value.add_argument("--source-root", type=Path, help="override the archive sourceRoot")
    value.add_argument("--dpi", type=int, default=120)
    value.add_argument("--jobs", type=int, default=min(6, os.cpu_count() or 4))
    value.add_argument("--force", action="store_true", help="rerender sources even when cached")
    value.add_argument(
        "--references",
        type=Path,
        default=Path("tools/compare-viewer/public/references"),
    )
    value.add_argument(
        "--manifest",
        type=Path,
        default=Path("tools/compare-viewer/generated-manifest.json"),
    )
    return value


def slugify(value: str, index: int) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or f"sign-{index}"


def png_size(path: Path) -> tuple[int, int]:
    with path.open("rb") as stream:
        header = stream.read(24)
    if len(header) < 24 or header[:8] != b"\x89PNG\r\n\x1a\n":
        raise RuntimeError(f"Rendered file is not a valid PNG: {path}")
    return struct.unpack(">II", header[16:24])


def render_source(
    pdftoppm: str,
    source: Path,
    destination: Path,
    dpi: int,
    force: bool,
) -> tuple[int, int, bool]:
    if not force and destination.exists() and destination.stat().st_mtime >= source.stat().st_mtime:
        width, height = png_size(destination)
        return width, height, False

    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="unbc-reference-") as temporary:
        prefix = Path(temporary) / "page"
        command = [
            pdftoppm,
            "-png",
            "-r",
            str(dpi),
            "-f",
            "1",
            "-singlefile",
            str(source),
            str(prefix),
        ]
        result = subprocess.run(command, capture_output=True, text=True, check=False)
        rendered = prefix.with_suffix(".png")
        if result.returncode or not rendered.exists():
            detail = result.stderr.strip() or result.stdout.strip() or "unknown Poppler error"
            raise RuntimeError(f"Could not render {source}: {detail}")
        shutil.copy2(rendered, destination)
    width, height = png_size(destination)
    return width, height, True


def main() -> int:
    args = parser().parse_args()
    archive_path = args.archive.expanduser().resolve()
    references = args.references.expanduser().resolve()
    manifest_path = args.manifest.expanduser().resolve()
    archive = json.loads(archive_path.read_text(encoding="utf-8"))
    signs = archive.get("signs", [])
    if not signs:
        raise SystemExit(f"No signs found in {archive_path}")

    source_root = (args.source_root or Path(archive.get("sourceRoot", ""))).expanduser().resolve()
    pdftoppm = shutil.which("pdftoppm")
    if not pdftoppm:
        raise SystemExit("pdftoppm is required. Install Poppler with: brew install poppler")

    references.mkdir(parents=True, exist_ok=True)
    jobs = []
    prepared = [None] * len(signs)
    with ThreadPoolExecutor(max_workers=max(1, args.jobs)) as executor:
        for index, entry in enumerate(signs, 1):
            source = source_root / entry.get("source", "")
            if not source.is_file():
                raise SystemExit(f"Source missing for {entry.get('label', entry.get('id'))}: {source}")
            slug = slugify(str(entry.get("id", "")), index)
            destination = references / f"{slug}.png"
            future = executor.submit(render_source, pdftoppm, source, destination, args.dpi, args.force)
            jobs.append((future, index - 1, entry, source, slug, destination))

        rendered_count = 0
        for future in as_completed([item[0] for item in jobs]):
            record = next(item for item in jobs if item[0] is future)
            _, position, entry, source, slug, destination = record
            width, height, rendered = future.result()
            rendered_count += int(rendered)
            prepared[position] = {
                "id": str(entry.get("id", slug)),
                "slug": slug,
                "label": str(entry.get("label") or entry.get("id") or f"Sign {position + 1}"),
                "source": str(entry.get("source", "")),
                "sourcePath": str(source),
                "referenceImage": f"./references/{destination.name}",
                "referenceWidth": width,
                "referenceHeight": height,
                "signData": entry.get("signData", {}),
            }

    expected = {f"{item['slug']}.png" for item in prepared}
    for stale in references.glob("*.png"):
        if stale.name not in expected:
            stale.unlink()

    payload = {
        "title": archive.get("title", "UNBC Door Sign Production Review"),
        "generatedAt": datetime.now().astimezone().isoformat(),
        "sourceRoot": str(source_root),
        "count": len(prepared),
        "signs": prepared,
    }
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Prepared {len(prepared)} signs ({rendered_count} rendered, {len(prepared) - rendered_count} cached)")
    print(f"Viewer manifest: {manifest_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
