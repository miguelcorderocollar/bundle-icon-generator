# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Start dev server:**

```bash
bun run dev
```

Open http://localhost:3000. Hot-reload enabled.

**Build and verify:**

```bash
bun run build      # Build production bundle
bun run verify     # Build + lint + tests (full check)
bun run lint       # Run ESLint
bun run lint:fix   # Fix ESLint errors
```

**Testing:**

```bash
bun run test           # Run tests in watch mode
bun run test:run       # Run tests once
bun run test:ui        # Open Vitest UI
bun run test:coverage  # Generate coverage report
bun run test:e2e       # Run Playwright E2E tests
bun run test:e2e:ui    # Open Playwright UI
```

**Icon generation:**

```bash
bun run generate-icons  # Rebuild icon-catalog.json from installed icon packs
```

Run this after installing/updating icon pack dependencies (`@zendeskgarden/svg-icons`, `feather-icons`, `remixicon`).

**Code quality:**

```bash
bun run format         # Format all files with Prettier
bun run format:check   # Check formatting without modifying
```

## Project Structure

- **`app/`** — Next.js App Router pages and layout
- **`src/components/`** — Reusable UI components (ColorPicker, GradientEditors, ExportModal, CustomImageInput, etc.)
- **`src/hooks/`** — React hooks for state management and business logic
  - `use-icon-generator.ts` — Main state hook, persists to localStorage
  - `use-icon-search.ts` — Search/filtering logic across icon catalog
  - `use-icon-metadata.ts` — Loads and caches the icon catalog
  - `use-keyboard-shortcuts.ts` — Global keyboard handler
- **`src/utils/`** — Core utilities
  - `export-controller.ts` — ZIP generation and validation
  - `renderer.ts` — SVG/PNG rendering engine (complex: handles color transforms, gradients, visual bounding boxes, Zendesk-specific rendering)
  - `icon-catalog.ts` — Loads/caches `public/icon-catalog.json`
  - `gradients.ts` — Linear/radial gradient utilities and SVG/canvas gradient conversion
  - `emoji-catalog.ts` — Custom emoji management
  - `local-storage.ts` — State persistence
  - `locations.ts` — Zendesk app location metadata and requirements
- **`src/adapters/`** — Icon pack normalizers (zendesk-garden.ts, feather.ts, remixicon.ts)
- **`src/types/`** — TypeScript definitions (icon.ts, app-location.ts, export.ts)
- **`src/constants/`** — App constants (SVG specs, icon pack definitions, size/naming rules)
- **`scripts/`** — Build scripts (generate-icon-catalog.ts)
- **`docs/`** — Product and Zendesk-specific documentation

## Architecture Overview

### Icon Catalog & Adapters

Icon packs (Zendesk Garden, Feather, RemixIcon) are normalized into a unified `IconMetadata` format and compiled into `public/icon-catalog.json` via `generate-icons` script. Adapters handle pack-specific quirks (e.g., Feather's stroke-based icons). Custom SVGs and images are stored in localStorage.

### State Management

`useIconGenerator` hook maintains selected icon, colors, sizes, locations, and search state. All state (except search query) is persisted to localStorage on change. On mount, if no icon is selected, a random icon is loaded.

### Rendering Pipeline

The core rendering logic (`renderer.ts`) handles:

- **SVG rendering:** Parses icon SVG, applies color transforms, renders background (solid/gradient), calculates visual bounding box for centering, applies SVG transforms
- **PNG rendering:** Uses Canvas API with SVG-to-image conversion for high-quality rasterization
- **Zendesk location SVGs:** Special mode (transparent bg, `currentColor` fills) for `icon_top_bar.svg`, `icon_ticket_editor.svg`, `icon_nav_bar.svg`
- **Custom images:** Stored in sessionStorage, renders as PNG only (no SVG support)

Key considerations:

- Some icon libraries (Zendesk Garden) have off-center content; visual bounding box detection compensates
- Feather and RemixIcon icons may use inherited stroke/fill attributes on root `<svg>` element
- Rasterized icons (emojis) are embedded as `<image>` elements, not colored
- Gradient background handling differs between SVG (defs + url reference) and Canvas (CanvasGradient API)

### Export Flow

`generateExportZip` orchestrates:

1. Validates state and selected locations
2. Determines required export variants (PNG + location-specific SVGs)
3. For custom images: skips SVG variants, renders PNGs only
4. For standard icons: generates all variants using `generateExportAssets`
5. Packs assets into ZIP with metadata JSON

See `src/types/export.ts` for Zendesk-compliant sizing and naming (logo.png: 1024×1024, logo-small.png: 512×512, location SVGs: 30×30 viewBox).

## Key Development Patterns

### Color Transforms

`applySvgColor` preserves special directives (`none`, `transparent`, `url(...)` gradients) while replacing fill/stroke attributes and inline styles. Handles both attribute-based and style-based colors.

### Gradient Support

Both linear and radial gradients with customizable stops, angles, and positioning. Exported as metadata and re-rendered on import.

### localStorage Persistence

- **Icon state:** Generator state (locations, colors, sizes, selected icon)
- **Favorites/recents:** Icon IDs (last 20 recent)
- **Color history:** Last 5 per color type (background/icon)
- **Custom SVGs/emojis:** Full SVG/emoji data
- **Custom images:** sessionStorage only (not persisted, ephemeral during session)

### Testing

Unit tests cover icon search, state management, rendering, export validation, and locale/gradient utilities. Tests use Vitest + Testing Library for React components.

## TypeScript Configuration

Strict mode enabled. Path alias `@/*` maps to repository root.

## Code Style

- ESLint with Next.js defaults + Prettier integration
- Unused variables prefixed with `_` (e.g., `_props`)
- Prefer functional React components, typed props
- Use shadcn/ui for consistent UI patterns
- Single source of truth for Zendesk sizing/naming rules (see `src/constants/app.ts`)
