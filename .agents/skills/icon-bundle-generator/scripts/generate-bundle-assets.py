#!/usr/bin/env python3
# pyright: reportMissingImports=false
"""
Generate preset-aligned icon bundles from a source SVG.

Supported presets (aligned with app export presets where SVG-to-raster applies):
- favicon-bundle
- pwa-icons
- macos-app-icon
- raycast-extension
- social-media
- zendesk-png-only
- single-png
- single-svg
"""

from __future__ import annotations

import argparse
import io
import shutil
import subprocess
import sys
from pathlib import Path


PNG_PRESET_SPECS: dict[str, dict[str, tuple[int, int]]] = {
    "favicon-bundle": {
        "favicon-16x16.png": (16, 16),
        "favicon-32x32.png": (32, 32),
        "apple-touch-icon.png": (180, 180),
        "android-chrome-192x192.png": (192, 192),
        "android-chrome-512x512.png": (512, 512),
    },
    "pwa-icons": {
        "icon-192x192.png": (192, 192),
        "icon-512x512.png": (512, 512),
        "icon-144x144.png": (144, 144),
        "icon-384x384.png": (384, 384),
    },
    "macos-app-icon": {
        "icon_16x16.png": (16, 16),
        "icon_16x16@2x.png": (32, 32),
        "icon_32x32.png": (32, 32),
        "icon_32x32@2x.png": (64, 64),
        "icon_128x128.png": (128, 128),
        "icon_128x128@2x.png": (256, 256),
        "icon_256x256.png": (256, 256),
        "icon_256x256@2x.png": (512, 512),
        "icon_512x512.png": (512, 512),
        "icon_512x512@2x.png": (1024, 1024),
    },
    "raycast-extension": {
        "icon.png": (512, 512),
    },
    "social-media": {
        "og-image.png": (1200, 630),
        "twitter-card.png": (1200, 600),
        "profile-400.png": (400, 400),
        "profile-200.png": (200, 200),
    },
    "zendesk-png-only": {
        "logo.png": (320, 320),
        "logo-small.png": (128, 128),
    },
    "single-png": {
        "icon.png": (512, 512),
    },
}

ALL_PRESETS: tuple[str, ...] = (
    "favicon-bundle",
    "pwa-icons",
    "macos-app-icon",
    "raycast-extension",
    "social-media",
    "zendesk-png-only",
    "single-png",
    "single-svg",
)


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

    return sorted(set(sizes))


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


def render_png(
    cairosvg: object, svg_bytes: bytes, width: int, height: int, output_path: Path
) -> bytes:
    png_bytes = cairosvg.svg2png(
        bytestring=svg_bytes,
        output_width=width,
        output_height=height,
    )
    output_path.write_bytes(png_bytes)
    return png_bytes


def write_ico(
    Image: object,
    cairosvg: object,
    svg_bytes: bytes,
    ico_path: Path,
    ico_sizes: list[int],
    rendered: dict[int, bytes],
) -> None:
    largest_size = max(max(ico_sizes), 512)
    largest_png = rendered.get(largest_size)
    if largest_png is None:
        largest_png = cairosvg.svg2png(
            bytestring=svg_bytes,
            output_width=largest_size,
            output_height=largest_size,
        )

    source_image = Image.open(io.BytesIO(largest_png)).convert("RGBA")
    source_image.save(
        ico_path,
        format="ICO",
        sizes=[(size, size) for size in ico_sizes],
    )


def write_icns_if_requested(
    bundle_dir: Path, rendered_files: dict[str, Path], create_icns: bool
) -> None:
    if not create_icns:
        return

    iconset_dir = bundle_dir / "icon.iconset"
    iconset_dir.mkdir(parents=True, exist_ok=True)

    for filename, src_path in rendered_files.items():
        shutil.copyfile(src_path, iconset_dir / filename)

    icns_path = bundle_dir / "icon.icns"

    try:
        subprocess.run(
            [
                "iconutil",
                "-c",
                "icns",
                str(iconset_dir),
                "-o",
                str(icns_path),
            ],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        return
    except (FileNotFoundError, subprocess.CalledProcessError):
        pass

    # Fallback for non-macOS environments: try Pillow ICNS writer.
    try:
        from PIL import Image

        source = Image.open(rendered_files["icon_512x512@2x.png"]).convert("RGBA")
        source.save(icns_path, format="ICNS")
    except Exception as exc:  # pragma: no cover - best-effort conversion
        print(
            "Warning: unable to generate icon.icns automatically. "
            f"Generated icon.iconset only. ({exc})"
        )


def generate_bundle(
    input_svg: Path,
    output_dir: Path,
    preset: str,
    ico_sizes: list[int],
    create_icns: bool,
) -> None:
    if not input_svg.exists():
        raise SystemExit(f"Input SVG not found: {input_svg}")

    output_dir.mkdir(parents=True, exist_ok=True)
    bundle_dir = output_dir / preset
    bundle_dir.mkdir(parents=True, exist_ok=True)

    if preset == "single-svg":
        shutil.copyfile(input_svg, bundle_dir / "icon.svg")
        print(f"Generated preset bundle: {preset}")
        print(f"- Source: {input_svg}")
        print(f"- Output: {bundle_dir}")
        return

    cairosvg, Image = ensure_dependencies()
    svg_bytes = input_svg.read_bytes()

    rendered_bytes: dict[int, bytes] = {}
    rendered_paths: dict[str, Path] = {}

    for filename, (width, height) in PNG_PRESET_SPECS[preset].items():
        output_path = bundle_dir / filename
        rendered_bytes[max(width, height)] = render_png(
            cairosvg, svg_bytes, width, height, output_path
        )
        rendered_paths[filename] = output_path

    if preset == "favicon-bundle":
        shutil.copyfile(input_svg, bundle_dir / "favicon.svg")
        write_ico(
            Image=Image,
            cairosvg=cairosvg,
            svg_bytes=svg_bytes,
            ico_path=bundle_dir / "favicon.ico",
            ico_sizes=ico_sizes,
            rendered=rendered_bytes,
        )

    if preset == "macos-app-icon":
        write_icns_if_requested(
            bundle_dir=bundle_dir,
            rendered_files=rendered_paths,
            create_icns=create_icns,
        )

    print(f"Generated preset bundle: {preset}")
    print(f"- Source: {input_svg}")
    print(f"- Output: {bundle_dir}")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate preset-aligned icon bundles from an SVG source."
    )
    parser.add_argument(
        "--input-svg",
        type=Path,
        required=True,
        help="Path to source SVG file.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("output/bundles"),
        help="Directory where bundle folders are written.",
    )
    parser.add_argument(
        "--preset",
        action="append",
        choices=ALL_PRESETS,
        help="Preset to generate. Can be provided multiple times.",
    )
    parser.add_argument(
        "--all-presets",
        action="store_true",
        help="Generate all supported presets.",
    )
    parser.add_argument(
        "--ico-sizes",
        type=parse_sizes,
        default=parse_sizes("16,32,48"),
        help="Comma-separated ICO sizes for favicon bundle.",
    )
    parser.add_argument(
        "--create-icns",
        action="store_true",
        help="For macOS preset, also create icon.icns (best effort on non-macOS).",
    )

    args = parser.parse_args()

    selected_presets: list[str]
    if args.all_presets:
        selected_presets = list(ALL_PRESETS)
    elif args.preset:
        selected_presets = args.preset
    else:
        raise SystemExit("Provide --preset or --all-presets.")

    for preset in selected_presets:
        generate_bundle(
            input_svg=args.input_svg,
            output_dir=args.output_dir,
            preset=preset,
            ico_sizes=args.ico_sizes,
            create_icns=args.create_icns,
        )

    return 0


if __name__ == "__main__":
    sys.exit(main())
