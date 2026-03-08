---
name: icon-bundle-generator
description: Generate SVG icons with Bundle Icon Generator and produce platform icon bundles from SVG input. Use when users ask for icon bundle exports like favicon, macOS app icons, PWA icons, social assets, or preset-aligned generation.
---

# Icon Bundle Generator

Use this skill to generate icon assets from the service and convert generated SVG output into preset-aligned platform bundles.

## When to Use

- User asks to generate icons using API endpoints.
- User references `docs/api-reference.md` or endpoint names like `/api/icons` or `/api/generate`.
- User asks for asset bundles (favicon, macOS app icon, PWA, social media, Raycast, Zendesk PNG-only).

## Required Inputs

- Default API host: `https://bundle-icon-generator.vercel.app`
- Icon/style inputs:
  - `iconId` or icon search query.
  - `backgroundColor` (hex or gradient object).
  - `iconColor` (hex).
  - Optional sizing: `size`, `padding`, `outputSize`.

## Workflow

1. Discover icon candidates with `GET /api/icons`.
2. Confirm the chosen icon with `GET /api/icons/[id]`.
3. Generate SVG via `POST /api/generate`.
4. Save SVG to disk (for example `output/icon.svg`).
5. If bundle assets are requested, run `scripts/generate-bundle-assets.py`.

Detailed endpoint formats and payloads are in [references/api-reference.md](references/api-reference.md).

## Auto-Run Rules

When users request bundle exports from SVG, run:

```bash
python3 scripts/generate-bundle-assets.py --input-svg <svg-path> --output-dir <output-dir> --preset <preset-id>
```

Supported preset IDs (parity with app export presets where SVG-to-raster conversion applies):

- `favicon-bundle`
- `pwa-icons`
- `macos-app-icon`
- `raycast-extension`
- `social-media`
- `zendesk-png-only`
- `single-png`
- `single-svg`

For macOS, generate `.icns` in addition to icon PNGs:

```bash
python3 scripts/generate-bundle-assets.py --input-svg <svg-path> --preset macos-app-icon --create-icns
```

For favicon/browser app assets, use the `favicon-bundle` preset.

If dependencies are missing, install:

```bash
python3 -m pip install cairosvg pillow
```

## Error Handling

- API errors return:
  - `error` (machine code)
  - `message` (human description)
- Validation failures from `POST /api/generate` can include `details`; surface these fields directly to the user and suggest corrected payload values.

## Examples

Generate SVG:

```bash
curl -X POST "https://bundle-icon-generator.vercel.app/api/generate?format=svg" \
  -H "Content-Type: application/json" \
  -d '{
    "iconId":"feather-star",
    "backgroundColor":"#1a1a2e",
    "iconColor":"#eaf6ff",
    "size":128
  }'
```

Generate macOS bundle from saved SVG:

```bash
python3 scripts/generate-bundle-assets.py \
  --input-svg output/icon.svg \
  --output-dir output/bundles \
  --preset macos-app-icon \
  --create-icns
```
