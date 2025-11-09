# Development Plan

## 1. Foundations
- **Tasks**: Confirm tooling (`Next.js`, `TypeScript`, styling system), add linting/formatting rules, configure absolute imports, document license attribution checklist.
- **Dependencies**: Existing Next.js scaffold in `app/`.
- **Deliverables**: Updated `README`, contribution guidelines, Apache-2.0 attribution section.

## 2. Icon Asset Integration
- **Tasks**: Add dependencies (`@zendeskgarden/svg-icons`, `feather-icons`), write asset ingestion scripts that normalize metadata (name, keywords, SVG content), and cache results locally.
- **Dependencies**: License review for redistribution, Node asset pipeline.
- **Deliverables**: Reusable data adapters, icon catalog JSON persisted client-side or via generated static data.

## 2.5 UI Component Library Setup (shadcn/ui)
- **Tasks**: Initialize shadcn/ui, configure for Next.js 16 App Router with Tailwind CSS v4, set up component structure, and establish design tokens.
- **Dependencies**: Tailwind CSS v4 already configured, TypeScript path aliases (`@/*`) in place.
- **Deliverables**: `components.json` configuration, initial component library structure, theme system integration.

### Setup Instructions

1. **Initialize shadcn/ui**:
   ```bash
   npx shadcn@latest init
   ```
   
   Configuration options (tailored for this project):
   - **Style**: `new-york` (modern, clean aesthetic suitable for developer tools)
   - **Base color**: `zinc` (neutral, professional)
   - **CSS variables**: `true` (enables theme customization)
   - **RSC**: `true` (Next.js 16 App Router uses React Server Components)
   - **TSX**: `true` (TypeScript project)
   - **Tailwind config**: Leave empty (Tailwind v4 uses CSS-based config)
   - **CSS file**: `app/globals.css` (already exists)
   - **Component directory**: `components/ui` (standard convention)
   - **Utils directory**: `lib/utils` (create if needed)
   - **Use alias**: `true` (matches existing `@/*` path alias)

2. **Tailwind CSS v4 Compatibility**:
   - shadcn/ui components work with Tailwind v4, but ensure CSS variables are properly defined in `app/globals.css`
   - The `@theme inline` block should include shadcn's CSS variable tokens
   - Components will use Tailwind's new `@import "tailwindcss"` syntax automatically

3. **Initial Components to Add**:
   ```bash
   npx shadcn@latest add button
   npx shadcn@latest add input
   npx shadcn@latest add card
   npx shadcn@latest add dialog
   npx shadcn@latest add select
   npx shadcn@latest add slider
   npx shadcn@latest add tabs
   npx shadcn@latest add separator
   ```

4. **Design Token Integration**:
   - Extend `app/globals.css` with shadcn's CSS variable system for colors, spacing, typography
   - Ensure dark mode support aligns with existing `prefers-color-scheme` setup
   - Customize tokens to match Zendesk design language where applicable

5. **Component Structure**:
   - Place all shadcn components in `components/ui/`
   - Create custom composed components in `components/` (e.g., `IconSearchBar`, `ColorPicker`)
   - Use `lib/utils.ts` for shared utilities (cn helper, etc.)

### Best Practices
- **Copy-Paste Model**: All components are copied into the project, allowing full customization
- **Composition**: Build complex UI from shadcn primitives (built on Radix UI for accessibility)
- **Customization**: Modify components directly in `components/ui/` as needed for project-specific requirements
- **Accessibility**: Leverage Radix UI primitives' built-in ARIA attributes and keyboard navigation

## 3. Core UI Shell
- **Tasks**: Build layout with three panes (icon search, customization controls, preview), implement theme tokens, add responsive design system using shadcn/ui components.
- **Dependencies**: shadcn/ui setup from Phase 2.5, finalized UX wireframes derived from `docs/app-concept.md`.
- **Deliverables**: Navigable interface skeleton with placeholder data built on shadcn/ui primitives.

## 4. Icon Search & Selection
- **Tasks**: Implement full-text search, filters (pack, tags), sorting, and recent/favorite tracking stored in `localStorage`.
- **Dependencies**: Icon catalog from Phase 2.
- **Deliverables**: Search-first UX with keyboard support and quick preview interactions.

## 5. Customization Engine
- **Tasks**: Create controls for app locations, background/icon colors (with color picker and recent swatches), and toggle-based effects (corner darkening, outlines, shadows).
- **Dependencies**: Completed UI shell.
- **Deliverables**: State management layer that ties selections to preview rendering; effect presets encoded in reusable configuration objects.

## 6. Rendering & Export Pipeline
- **Tasks**: Generate canvas/SVG renders sized for `logo.png`, `logo-small.png`, and location-specific SVG exports; wrap assets into client-side ZIP download; enforce naming conventions.
- **Dependencies**: Customization state from Phase 5, compliance rules from `docs/app-concept.md`.
- **Deliverables**: Deterministic renderer, preview modal, download button producing correct file set.

## 7. Persistence & Presets
- **Tasks**: Implement `localStorage` persistence for recent colors/icons and optional user-defined presets with import/export.
- **Dependencies**: Stable state schema from previous phases.
- **Deliverables**: Persistence utilities with versioning and namespace safeguards.

## 8. Quality & Compliance
- **Tasks**: Automated tests (unit for rendering logic, integration for icon selection flow), manual checklist for Zendesk size naming compliance, accessibility audit (keyboard navigation, contrast).
- **Dependencies**: Functional end-to-end flow.
- **Deliverables**: Test coverage reports, accessibility fixes, updated documentation.

## 9. Future Enhancements Backlog
- Canvas-based multi-icon editor.
- Batch exports for multiple app definitions.
- Git/Zendesk manifest sync workflows.
- AI-assisted icon and color suggestions.
- Collaborative preset sharing via tokens or cloud sync.


