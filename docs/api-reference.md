# Icon Generator API Reference

This API is designed for AI agents and automation scripts.

- Base URL: `{{BASE_URL}}`
- Output focus: SVG generation
- Suggested flow:
  1. Search icon
  2. Read icon metadata
  3. Generate SVG
  4. Convert SVG to PNG/ICO externally (Python/ImageMagick/etc.)

## Endpoints

### `GET /api/icons`

Search and filter icons.

Query params:

- `q` (optional): search text
- `pack` (optional): `all`, `garden`, `zendesk-garden`, `feather`, `remixicon`, `emoji`, `custom-svg`, `custom-image`
- `category` (optional): category name (mainly for RemixIcon)
- `limit` (optional, default `50`, max `250`)
- `offset` (optional, default `0`)

Example:

```bash
curl "{{BASE_URL}}/api/icons?q=star&pack=feather&limit=5"
```

### `GET /api/icons/[id]`

Get a single icon metadata payload including SVG source.

Example:

```bash
curl "{{BASE_URL}}/api/icons/feather-star"
```

### `GET /api/icons/packs`

List packs, counts, and license metadata.

```bash
curl "{{BASE_URL}}/api/icons/packs"
```

### `GET /api/icons/categories`

List RemixIcon categories.

```bash
curl "{{BASE_URL}}/api/icons/categories"
```

### `GET /api/config/gradients`

List named gradient presets and values.

```bash
curl "{{BASE_URL}}/api/config/gradients"
```

### `GET /api/config/locations`

List Zendesk app locations and which ones require icon SVGs.

```bash
curl "{{BASE_URL}}/api/config/locations"
```

### `POST /api/generate`

Generate an SVG icon from an icon id and style options.

Request body:

```json
{
  "iconId": "feather-star",
  "backgroundColor": "#063940",
  "iconColor": "#ffffff",
  "size": 128,
  "padding": 8,
  "cornerRadius": 0,
  "borderEnabled": false,
  "borderColor": "#ffffff",
  "borderWidth": 6,
  "outputSize": 128,
  "zendeskLocationMode": false,
  "filename": "logo.svg"
}
```

Rules:

- `iconId`: required string
- `backgroundColor`: `#RRGGBB` or a gradient object
- `iconColor`: `#RRGGBB`
- `size`: integer `48..300`
- `padding`: optional `-200..200` (default `8`)
- `cornerRadius`: optional number `0..100` (default `0`)
- `borderEnabled`: optional boolean (default `false`)
- `borderColor`: optional `#RRGGBB` (default `#ffffff`)
- `borderWidth`: optional number `0..64` (default `6`)
- `outputSize`: optional integer `16..4096`
- `zendeskLocationMode`: optional boolean

Notes:

- Border and corner radius apply to opaque assets/backgrounds.
- `zendeskLocationMode=true` keeps location SVGs transparent, ignoring background shape and border.

Linear gradient background:

```json
{
  "type": "linear",
  "angle": 135,
  "stops": [
    { "color": "#667eea", "offset": 0 },
    { "color": "#764ba2", "offset": 100 }
  ]
}
```

Radial gradient background:

```json
{
  "type": "radial",
  "centerX": 50,
  "centerY": 50,
  "radius": 70,
  "stops": [
    { "color": "#ff0080", "offset": 0 },
    { "color": "#7928ca", "offset": 100 }
  ]
}
```

Generate JSON response:

```bash
curl -X POST "{{BASE_URL}}/api/generate" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "iconId":"feather-star",
    "backgroundColor":"#1a1a2e",
    "iconColor":"#eaf6ff",
    "size":128
  }'
```

Generate raw SVG response:

```bash
curl -X POST "{{BASE_URL}}/api/generate?format=svg" \
  -H "Content-Type: application/json" \
  -d '{
    "iconId":"feather-star",
    "backgroundColor":"#1a1a2e",
    "iconColor":"#eaf6ff",
    "size":128
  }'
```

## Error format

Error responses follow:

```json
{
  "error": "error_code",
  "message": "Human readable message"
}
```

Validation errors from `POST /api/generate` also include `details`.
