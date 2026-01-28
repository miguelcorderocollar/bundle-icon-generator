## Overview

App Icon Generator is a local-first tool for crafting icon bundles for any platform. It streamlines choosing icons from vetted packs, customizing colors and effects, and exporting platform-specific asset sets with correct naming and sizing. Whether you need icons for Zendesk apps, Raycast extensions, PWAs, macOS apps, favicons, or social media, this tool has you covered.

## Features

- **Icon Search & Selection**: Full-text search across icon packs with filtering by pack (Zendesk Garden, Feather, RemixIcon, Emoji, Custom SVG, Custom Image, Canvas, or All)
  - Shuffle icons for random discovery
  - Category-based filtering for RemixIcon
- **Multi-Platform Export Presets**: Built-in presets for various platforms:
  - **Zendesk App**: Complete icon bundle with PNG and SVG files for all Zendesk locations
  - **Raycast Extension**: 512×512 PNG for Raycast extensions
  - **Favicon Bundle**: Complete favicon set (16×16, 32×32, ICO, Apple touch icon, Android icons)
  - **PWA Icons**: Progressive Web App icon set (192×192, 512×512, and more)
  - **macOS App Icon**: Complete macOS application icon set with @2x variants
  - **Social Media**: Open Graph images, Twitter cards, and profile pictures
  - **Single PNG/SVG**: Export individual files at custom sizes
  - **Custom Presets**: Create and save your own export presets
- **Customization Controls**:
  - Customize background and icon colors with color picker
  - Advanced background modes:
    - Solid color backgrounds
    - Linear gradients with customizable stops and angles
    - Radial gradients with customizable stops and positioning
    - Gradient presets for quick selection
  - Adjust icon size with slider (separate controls for PNG and SVG)
  - Color history for quick access to recently used colors
  - Style presets for quick theming (Dark Mode, Light Mode, Ocean Gradient, and more)
- **Canvas Mode**: Create layered icon compositions with multiple icons, text, and shapes
- **Custom SVG & Image Icons**: Upload and customize your own SVG or image icons with full color customization support
- **Real-time Preview**: Live preview of icons with selected customizations, showing all export variants for the selected preset
- **Export to ZIP**: One-click export generating:
  - All required assets for the selected export preset
  - Correct file naming and sizing per platform requirements
  - Export metadata JSON file
- **State Persistence**: Comprehensive localStorage persistence for:
  - Selected icon and all customization settings
  - Favorite icons
  - Recent icons (last 20)
  - Color history (last 5 per color type)
  - Custom SVG icons and images
  - Custom export and style presets
- **Emoji Support**: Add custom emojis that are searchable and exportable alongside icon packs

Explore the product vision in `docs/app-concept.md` and phased roadmap in `docs/development-plan.md`. Platform-specific requirements (including Zendesk) are documented in `docs/zendesk-icon-docs.md`.

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
  - `components/` — Reusable UI components (ColorPicker, ExportModal, BackgroundControls, CustomSvgInput, GradientEditors, CanvasControlsPane, etc.)
  - `hooks/` — React hooks for state management, search, icon generation, presets, and canvas editing
  - `utils/` — Utilities (icon catalog, rendering, export, localStorage, gradients, color history, preset storage, builtin presets)
  - `types/` — TypeScript type definitions
  - `constants/` — App constants and configuration
  - `adapters/` — Icon pack adapters for normalization (Zendesk Garden, Feather, RemixIcon)
  - `contexts/` — React contexts (RestrictionContext for restricted mode)
- `docs/` — Product concept, development plan, and platform-specific icon guidelines
- `public/` — Static assets (including generated `icon-catalog.json`)
- `scripts/` — Build and data processing scripts (icon catalog generation)
- `e2e/` — Playwright end-to-end tests

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
- Use consistent naming for icon variants and maintain a single source of truth for platform-specific size/naming rules.
- Export presets define platform requirements, ensuring consistency across the application.

## License

- **Project code**: MIT License - See [LICENSE](LICENSE) file for details.
- **Bundled icon packs**: Respect original licenses; include copies in the repository and reference them within the app as needed.

If you introduce new third-party assets or libraries, document their licenses here and ensure they are compatible with your target distribution platform.
