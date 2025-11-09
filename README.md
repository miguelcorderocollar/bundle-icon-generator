## Overview

ZDK Icon Generator is a local-first tool for crafting compliant Zendesk app icon bundles. It streamlines choosing icons from vetted packs, customizing colors and effects, and exporting the required asset set (`logo.png`, `logo-small.png`, and location-specific SVG files) with correct naming and sizing.

Key goals:
- Centralize Apache-2.0 friendly icon packs (Zendesk Garden, Feather, more to come).
- Provide an intuitive search and selection experience tailored to Zendesk app locations.
- Offer real-time previews, configurable styling presets, and one-click ZIP export.
- Remember recent choices using `localStorage` for a smoother workflow.

Explore the product vision in `docs/app-concept.md` and phased roadmap in `docs/development-plan.md`. Zendesk-specific requirements are summarized in `docs/zendesk-icon-docs.md`.

## Tech Stack
- Next.js (App Router) with React and TypeScript.
- Styling: TBD (evaluate Tailwind, CSS Modules, or a component library).
- Client-side rendering of icons via SVG/canvas and local ZIP generation.

## Prerequisites
- Node.js 18+ (or Bun if preferred).
- Package manager: npm (default) or bun/pnpm/yarn.

## Setup

Install dependencies:

```bash
npm install
# or
bun install
```

Start the development server:

```bash
npm run dev
```

Open http://localhost:3000 to access the app. The server hot-reloads when files change.

Additional scripts (if configured later) should be documented here; run `npm run lint` or `npm run test` once those commands are added.

## Project Structure
- `app/` — Next.js application code.
- `docs/` — Product concept, development plan, and Zendesk icon guidelines.
- `public/` — Static assets.
- `eslint.config.mjs`, `tsconfig.json` — Tooling configuration.

## Icon Sources & Licensing
- Bundled icon packs:
  - [`@zendeskgarden/svg-icons`](https://github.com/zendeskgarden/svg-icons) (Apache-2.0).
  - [`feather-icons`](https://github.com/feathericons/feather) (MIT).
- Maintain upstream LICENSE files in the repo and surface attribution inside the UI.
- Confirm compatibility when adding new icon sources; prefer permissive licenses (Apache-2.0, MIT, CC0/CC BY with attribution).

## Development Guidelines
- Follow the roadmap phases in `docs/development-plan.md`.
- Keep the app local-first and avoid backend dependencies unless requirements change.
- Add unit/integration tests for rendering logic, asset export, and UX flows as they solidify.

## Contributing
1. Create a feature branch.
2. Implement changes with clear commits and update or add documentation/tests as needed.
3. Open a pull request describing the change, linked to relevant docs or issues.

### Code Style
- Adhere to the shared ESLint/TypeScript configuration.
- Prefer functional React components and typed props/state.
- Use consistent naming for icon variants and maintain a single source of truth for Zendesk size/naming rules.

## License

- **Project code**: Add an explicit license (e.g., MIT or Apache-2.0) before release. Until then, all rights reserved.
- **Bundled icon packs**: Respect original licenses; include copies in the repository and reference them within the app as needed.

If you introduce new third-party assets or libraries, document their licenses here and ensure they are compatible with Zendesk marketplace distribution.
