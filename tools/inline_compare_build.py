#!/usr/bin/env python3
"""Inline the local comparison viewer bundle so its index works directly from file://."""

from __future__ import annotations

import re
import shutil
from pathlib import Path


OUTPUT = Path("output/compare/all-signs")


def main() -> int:
    index_path = OUTPUT / "index.html"
    document = index_path.read_text(encoding="utf-8")

    script_match = re.search(r'<script type="module"[^>]*src="([^"]+)"[^>]*></script>', document)
    if not script_match:
        raise SystemExit("Could not find the comparison viewer JavaScript bundle")
    script_path = (OUTPUT / script_match.group(1)).resolve()
    script = script_path.read_text(encoding="utf-8").replace("</script", "<\\/script")
    document = document[: script_match.start()] + f"<script type=\"module\">{script}</script>" + document[script_match.end() :]

    style_match = re.search(r'<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>', document)
    if style_match:
        style_path = (OUTPUT / style_match.group(1)).resolve()
        style = style_path.read_text(encoding="utf-8").replace("</style", "<\\/style")
        document = document[: style_match.start()] + f"<style>{style}</style>" + document[style_match.end() :]

    index_path.write_text(document, encoding="utf-8")
    assets = OUTPUT / "assets"
    if assets.exists():
        shutil.rmtree(assets)
    print(f"Standalone all-sign viewer: {index_path.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
