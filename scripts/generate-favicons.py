#!/usr/bin/env python3
"""
Generate favicon assets from an SVG source.

Defaults are tailored for this project:
- input SVG: public/favicon-objective-b-image-add.svg
- output dir: public/

Outputs:
- favicon.svg
- favicon.ico (multi-size; default: 16,32,48)
- favicon-16x16.png
- favicon-32x32.png
- apple-touch-icon.png (180x180)
- android-chrome-192x192.png
- android-chrome-512x512.png
"""

from __future__ import annotations

import argparse
import io
import shutil
import sys
from pathlib import Path


def parse_sizes(value: str) -> list[int]:
    parts = [part.strip() for part in value.split(",") if part.strip()]
    if not parts:
        raise argparse.ArgumentTypeError("ICO sizes cannot be empty.")

    sizes: list[int] = []
    for part in parts:
        if not part.isdigit():
            raise argparse.ArgumentTypeError(
                f"Invalid ICO size '{part}'. Use comma-separated integers."
            )
        size = int(part)
        if size < 16 or size > 512:
            raise argparse.ArgumentTypeError(
                f"Invalid ICO size '{size}'. Expected range: 16..512."
            )
        sizes.append(size)

    unique_sorted = sorted(set(sizes))
    return unique_sorted


def ensure_dependencies() -> tuple[object, object]:
    try:
        import cairosvg
    except ImportError as exc:
        raise SystemExit(
            "Missing dependency: cairosvg\n"
            "Install with: python3 -m pip install cairosvg"
        ) from exc

    try:
        from PIL import Image
    except ImportError as exc:
        raise SystemExit(
            "Missing dependency: Pillow\n"
            "Install with: python3 -m pip install pillow"
        ) from exc

    return cairosvg, Image


def render_png(cairosvg: object, svg_bytes: bytes, size: int, output_path: Path) -> bytes:
    png_bytes = cairosvg.svg2png(
        bytestring=svg_bytes,
        output_width=size,
        output_height=size,
    )
    output_path.write_bytes(png_bytes)
    return png_bytes


def build_assets(input_svg: Path, output_dir: Path, ico_sizes: list[int]) -> None:
    cairosvg, Image = ensure_dependencies()

    if not input_svg.exists():
        raise SystemExit(f"Input SVG not found: {input_svg}")

    output_dir.mkdir(parents=True, exist_ok=True)
    svg_bytes = input_svg.read_bytes()

    png_specs = {
        "favicon-16x16.png": 16,
        "favicon-32x32.png": 32,
        "apple-touch-icon.png": 180,
        "android-chrome-192x192.png": 192,
        "android-chrome-512x512.png": 512,
    }

    rendered: dict[int, bytes] = {}
    for filename, size in png_specs.items():
        output_path = output_dir / filename
        rendered[size] = render_png(cairosvg, svg_bytes, size, output_path)

    # Keep a copy of the selected SVG as the canonical favicon source.
    shutil.copyfile(input_svg, output_dir / "favicon.svg")

    # Use the largest raster as source and let Pillow embed multiple sizes in .ico.
    largest_size = max(max(ico_sizes), 512)
    largest_png = rendered.get(largest_size)
    if largest_png is None:
        largest_png = cairosvg.svg2png(
            bytestring=svg_bytes,
            output_width=largest_size,
            output_height=largest_size,
        )

    ico_path = output_dir / "favicon.ico"
    source_image = Image.open(io.BytesIO(largest_png)).convert("RGBA")
    source_image.save(
        ico_path,
        format="ICO",
        sizes=[(size, size) for size in ico_sizes],
    )

    print("Generated favicon assets:")
    print(f"- Source: {input_svg}")
    print(f"- Output: {output_dir}")
    print("- Files:")
    print("  - favicon.svg")
    print(f"  - favicon.ico ({', '.join(str(s) for s in ico_sizes)})")
    for filename in png_specs:
        print(f"  - {filename}")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate favicon assets from an SVG source."
    )
    parser.add_argument(
        "--input-svg",
        type=Path,
        default=Path("public/favicon-objective-b-image-add.svg"),
        help="Path to source SVG file.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("public"),
        help="Directory where favicon assets are written.",
    )
    parser.add_argument(
        "--ico-sizes",
        type=parse_sizes,
        default=parse_sizes("16,32,48"),
        help="Comma-separated ICO sizes (default: 16,32,48).",
    )

    args = parser.parse_args()
    build_assets(args.input_svg, args.output_dir, args.ico_sizes)
    return 0


if __name__ == "__main__":
    sys.exit(main())
