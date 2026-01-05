## Overview

Zendesk App Icon Generator is a local-first tool for crafting compliant Zendesk app icon bundles. It streamlines choosing icons from vetted packs, customizing colors and effects, and exporting the required asset set (`logo.png`, `logo-small.png`, and location-specific SVG files) with correct naming and sizing.

## Features

- **Icon Search & Selection**: Full-text search across icon packs with filtering by pack (Zendesk Garden, Feather, RemixIcon, Emoji, Custom SVG, or All)
  - Shuffle icons for random discovery
  - Category-based filtering for RemixIcon
- **Customization Controls**:
  - Select Zendesk app locations (Support, Chat, Talk, etc.)
  - Customize background and icon colors with color picker
  - Advanced background modes:
    - Solid color backgrounds
    - Linear gradients with customizable stops and angles
    - Radial gradients with customizable stops and positioning
    - Gradient presets for quick selection
  - Adjust icon size with slider
  - Color history for quick access to recently used colors
- **Custom SVG Icons**: Upload and customize your own SVG icons with full color customization support
- **Real-time Preview**: Live preview of icons with selected customizations across all app locations, showing the currently selected icon
- **Export to ZIP**: One-click export generating:
  - `logo.png` (1024x1024px)
  - `logo-small.png` (512x512px)
  - Location-specific SVG files (e.g., `assets/icon-support.svg`)
  - Export metadata JSON file
- **State Persistence**: Comprehensive localStorage persistence for:
  - Selected icon and all customization settings
  - Favorite icons
  - Recent icons (last 20)
  - Color history (last 5 per color type)
  - Custom SVG icons
- **Emoji Support**: Add custom emojis that are searchable and exportable alongside icon packs

Explore the product vision in `docs/app-concept.md` and phased roadmap in `docs/development-plan.md`. Zendesk-specific requirements are summarized in `docs/zendesk-icon-docs.md`.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19 and TypeScript
- **Styling**: Tailwind CSS v4 with shadcn/ui component library
- **Icons**: Client-side rendering via SVG/canvas and local ZIP generation using JSZip
- **State Management**: React hooks with localStorage for persistence

## Prerequisites

- Bun 1.0+ (recommended) or Node.js 18+ with npm/pnpm/yarn

## Setup

Install dependencies:

```bash
bun install
```

Start the development server:

```bash
bun run dev
```

Open http://localhost:3000 to access the app. The server hot-reloads when files change.

Additional scripts:

```bash
bun run generate-icons  # Generate icon catalog from icon packs
bun run lint            # Run ESLint
```

The `generate-icons` script processes icons from installed icon packs and generates a unified catalog at `public/icon-catalog.json`. Run this after installing or updating icon pack dependencies.

## Project Structure

- `app/` — Next.js App Router pages and layout
- `components/` — React components (main UI panes and shadcn/ui components)
- `src/` — Core application code:
  - `components/` — Reusable UI components (ColorPicker, ExportModal, BackgroundControls, CustomSvgInput, GradientEditors, etc.)
  - `hooks/` — React hooks for state management, search, and icon generation
  - `utils/` — Utilities (icon catalog, rendering, export, localStorage, gradients, color history)
  - `types/` — TypeScript type definitions
  - `constants/` — App constants and configuration
  - `adapters/` — Icon pack adapters for normalization (Zendesk Garden, Feather, RemixIcon)
- `docs/` — Product concept, development plan, and Zendesk icon guidelines
- `public/` — Static assets (including generated `icon-catalog.json`)
- `scripts/` — Build and data processing scripts (icon catalog generation)

## Icon Sources & Licensing

- **Bundled icon packs**:
  - [`@zendeskgarden/svg-icons`](https://github.com/zendeskgarden/svg-icons) (Apache-2.0)
  - [`feather-icons`](https://github.com/feathericons/feather) (MIT)
  - [`remixicon`](https://github.com/Remix-Design/RemixIcon) (Apache-2.0)
- **Custom icons**: User-uploaded SVG icons and emojis stored in localStorage
- All icon packs maintain their original licenses. Attribution is displayed in the app's About dialog.

## Development Guidelines

- Keep the app local-first and avoid backend dependencies
- Follow TypeScript best practices with strict typing
- Use shadcn/ui components for consistent UI patterns
- Maintain separation of concerns: hooks for state, utils for business logic, components for UI

## Contributing

1. Create a feature branch.
2. Implement changes with clear commits and update or add documentation/tests as needed.
3. Open a pull request describing the change, linked to relevant docs or issues.

### Code Style

- Adhere to the shared ESLint/TypeScript configuration.
- Prefer functional React components and typed props/state.
- Use consistent naming for icon variants and maintain a single source of truth for Zendesk size/naming rules.

## License

- **Project code**: MIT License - See [LICENSE](LICENSE) file for details.
- **Bundled icon packs**: Respect original licenses; include copies in the repository and reference them within the app as needed.

If you introduce new third-party assets or libraries, document their licenses here and ensure they are compatible with Zendesk marketplace distribution.
