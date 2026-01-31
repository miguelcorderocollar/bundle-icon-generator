# AGENTS.md - AI Coding Assistant Guidelines

This document provides essential context and guidelines for AI coding assistants working on this project. It complements the `README.md` which is tailored for human developers.

## Project Overview

**Zendesk App Icon Generator** is a local-first Next.js web application that helps developers create compliant Zendesk app icon bundles. The tool allows users to:

- Search and select icons from multiple icon packs (Zendesk Garden, Feather, RemixIcon, Emoji, Custom SVG)
- Customize colors, backgrounds (solid, linear/radial gradients), and icon sizes
- Export compliant asset sets (PNG and SVG files) matching Zendesk's requirements
- Persist preferences and favorites in localStorage

**Key Architecture Points:**

- **Framework**: Next.js 16 (App Router) with React 19 and TypeScript
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **State Management**: React hooks with localStorage persistence (no backend)
- **Icon Processing**: Client-side SVG/canvas rendering and JSZip for export
- **Testing**: Vitest for unit tests, Playwright for E2E tests

## Critical Development Workflow

### ⚠️ ALWAYS Run These Commands After Making Changes

**Before committing or considering work complete, you MUST run:**

```bash
# 1. Build the application to catch TypeScript and compilation errors
bun run build

# 2. Run the linter to catch code quality issues
bun run lint

# 3. Run unit tests to ensure functionality works
bun run test:run

# 4. Format code (including AGENTS.md) with Prettier
bun run format

# 5. Run E2E tests (if making UI changes)
bun run test:e2e
```

**Why this matters:**

- The build process catches TypeScript errors, missing imports, and compilation issues
- Linting ensures code quality and consistency with project standards
- Tests verify that changes don't break existing functionality
- Formatting ensures consistent code style across the project (including AGENTS.md)
- CI/CD pipeline runs these same checks, so catching issues early prevents failures

### Quick Verification Script

After making changes, verify everything works:

```bash
# Comprehensive verification
bun run verify

# Or manually:
bun run build && bun run lint && bun run test:run
```

## Development Environment Setup

### Prerequisites

- **Bun 1.0+** (recommended) or Node.js 18+ with npm/pnpm/yarn
- Modern browser for testing (Chrome/Chromium recommended for Playwright)

### Initial Setup

```bash
# Install dependencies
bun install

# Generate icon catalog (required after dependency changes)
bun run generate-icons

# Start development server
bun run dev
```

### Important Configuration Files

- `tsconfig.json` - TypeScript configuration (excludes test files from build)
- `vitest.config.ts` - Unit test configuration (uses jsdom environment)
- `playwright.config.ts` - E2E test configuration
- `vitest.setup.ts` - Test setup file (mocks localStorage, matchMedia)
- `next.config.ts` - Next.js configuration
- `eslint.config.mjs` - ESLint configuration

## Project Structure

```
├── app/                    # Next.js App Router pages and layout
├── components/            # Main UI panes and shadcn/ui components
├── src/
│   ├── components/       # Reusable UI components (ColorPicker, ExportModal, etc.)
│   ├── hooks/            # React hooks (use-icon-generator, use-icon-search, etc.)
│   ├── utils/            # Business logic (icon-catalog, renderer, export-controller, etc.)
│   ├── types/            # TypeScript type definitions
│   ├── constants/        # App constants and configuration
│   └── adapters/         # Icon pack adapters (zendesk-garden, feather, remixicon)
├── docs/                  # Product concept, development plan, Zendesk guidelines
├── e2e/                   # Playwright E2E tests
├── public/                # Static assets (including generated icon-catalog.json)
└── scripts/               # Build scripts (generate-icon-catalog.ts)
```

## Code Style and Conventions

### TypeScript

- **Strict mode enabled** - Always use proper types, avoid `any`
- **Type definitions** - Located in `src/types/`
- **Path aliases** - Use `@/` prefix for imports from project root
- **No empty interfaces** - Use type aliases instead (e.g., `type Props = BaseProps`)

### React

- **Functional components** - Prefer function components over classes
- **Hooks** - Custom hooks in `src/hooks/`, follow naming convention `use-*`
- **Props typing** - Always type component props explicitly
- **Event handlers** - Use proper event types (`React.MouseEvent`, `React.KeyboardEvent`)

### File Organization

- **Component files** - PascalCase (e.g., `ColorPicker.tsx`)
- **Utility files** - kebab-case (e.g., `icon-catalog.ts`)
- **Test files** - Co-located with source files in `__tests__/` directories
- **E2E tests** - In `e2e/` directory, separate from unit tests

### Import Order

1. React and Next.js imports
2. Third-party library imports
3. Internal component imports
4. Utility and type imports
5. Relative imports

## Testing Guidelines

### Unit Tests (Vitest)

- **Location**: Co-located with source files in `__tests__/` directories
- **Pattern**: `*.test.ts` or `*.test.tsx`
- **Environment**: jsdom (configured in `vitest.config.ts`)
- **Setup**: `vitest.setup.ts` provides localStorage and matchMedia mocks
- **Run**: `bun run test:run` (CI mode) or `bun run test` (watch mode)

**Important Notes:**

- Tests use `beforeEach` from Vitest globals (enabled in config)
- localStorage is mocked in setup file
- React components tested with `@testing-library/react`
- Mock modules using `vi.mock()` from Vitest

### E2E Tests (Playwright)

- **Location**: `e2e/` directory
- **Pattern**: `*.spec.ts`
- **Run**: `bun run test:e2e` or `bunx playwright test`
- **UI Mode**: `bun run test:e2e:ui` for interactive debugging

**Important Notes:**

- E2E tests are excluded from Vitest runs (configured in `vitest.config.ts`)
- Tests require a built application (`bun run build` first)
- Use `test.describe()` and `test()` from Playwright, not Vitest

### Test Coverage

- Run coverage: `bun run test:coverage`
- Coverage reports generated in `coverage/` directory
- Excludes: `node_modules`, `.next`, `e2e`, config files, type definitions

## Build and Lint Configuration

### TypeScript Build Exclusions

The following files are excluded from Next.js TypeScript compilation:

- `vitest.setup.ts` - Contains Vitest-specific globals (`beforeEach`, etc.)
- `vitest.config.ts` - Test configuration file
- `e2e/**` - E2E tests use Playwright, not Next.js

**Why**: These files contain test-specific code that would cause build errors if included.

### Linting Rules

- **ESLint** with Next.js configuration
- **Strict rules**: No `any` types, no unused variables, proper React hooks usage
- **Warnings vs Errors**: Fix errors, warnings are non-blocking but should be addressed

## Common Patterns and Utilities

### Icon Catalog

- **Location**: `public/icon-catalog.json` (generated)
- **Generation**: Run `bun run generate-icons` after icon pack updates
- **Usage**: Import from `@/src/utils/icon-catalog`

### LocalStorage Persistence

- **Utilities**: `src/utils/local-storage.ts`
- **Stored data**: Favorites, recent icons, generator state, color history, custom SVGs
- **Testing**: localStorage is mocked in `vitest.setup.ts`

### Icon Rendering

- **Renderer**: `src/utils/renderer.ts`
- **Supports**: Solid colors, linear/radial gradients, SVG color replacement
- **Output**: SVG strings and canvas-rendered PNGs

### Export Controller

- **Location**: `src/utils/export-controller.ts`
- **Validates**: Icon selection, location requirements, color contrast
- **Generates**: ZIP files with PNG and SVG assets

## Zendesk-Specific Requirements

### Icon Sizes

- `logo.png`: 1024×1024px
- `logo-small.png`: 512×512px
- Location SVGs: Various sizes based on location

### Location Mapping

- **Support**: `assets/icon-support.svg`
- **Chat**: `assets/icon-chat.svg`
- **Talk**: `assets/icon-talk.svg`
- **Nav Bar**: `assets/icon-nav-bar.svg`
- **Top Bar**: `assets/icon-top-bar.svg`
- **Ticket Editor**: `assets/icon-ticket-editor.svg`

See `docs/zendesk-icon-docs.md` for complete requirements.

## Security Considerations

- **No backend** - All processing is client-side
- **No external API calls** - Icons are bundled locally
- **localStorage only** - No sensitive data storage
- **License compliance** - Icon packs maintain original licenses; see `THIRD-PARTY-LICENSES.md`

## Third-Party Icon Licenses

This project bundles icons from external libraries. Proper license compliance is documented in `THIRD-PARTY-LICENSES.md`.

| Library                  | Version | License      | Date Added        |
| ------------------------ | ------- | ------------ | ----------------- |
| Feather Icons            | 4.29.2  | MIT          | November 9, 2025  |
| Zendesk Garden SVG Icons | 8.0.0   | Apache 2.0   | November 9, 2025  |
| RemixIcon                | 4.7.0   | Apache 2.0\* | November 14, 2025 |

\*RemixIcon changed to "Remix Icon License v1.0" effective January 2026. This project uses v4.7.0 (released October 2024), which was licensed under Apache 2.0 at the time of integration.

**When updating icon dependencies:**

1. Document the version, license, and date in `THIRD-PARTY-LICENSES.md`
2. Verify the license is compatible with the project's MIT license
3. Include any required attribution notices

## CI/CD Pipeline

The project uses GitHub Actions (`.github/workflows/test.yml`) with two jobs:

1. **Unit & Component Tests**
   - Runs linter (`bun run lint`)
   - Runs unit tests (`bun run test:run`)
   - Generates coverage report

2. **E2E Tests**
   - Builds application (`bun run build`)
   - Runs Playwright tests
   - Uploads test artifacts

**Important**: Always ensure your changes pass both jobs before merging.

## Common Pitfalls to Avoid

1. **Including test files in build** - Test files are excluded from `tsconfig.json` for a reason
2. **Using `any` types** - TypeScript strict mode requires proper typing
3. **Forgetting to run tests** - Always verify with `build`, `lint`, and `test:run`
4. **Mixing Vitest and Playwright** - Use correct test framework for each test type
5. **Breaking localStorage API** - Changes to localStorage utilities affect persistence
6. **Icon catalog not regenerated** - Run `generate-icons` after icon pack changes

## Debugging Tips

### Build Failures

- Check TypeScript errors first
- Verify all imports are correct
- Ensure test files are excluded from build

### Test Failures

- Unit tests: Check if `vitest.setup.ts` is loaded (localStorage mock)
- E2E tests: Ensure app is built first (`bun run build`)
- Check for missing mocks or incorrect test environment

### Lint Errors

- Fix errors (blocking)
- Address warnings when possible (non-blocking but improve code quality)

## Additional Resources

- **Product Vision**: `docs/app-concept.md`
- **Development Plan**: `docs/development-plan.md`
- **Icon Integration**: `docs/icon-integration.md`
- **Zendesk Guidelines**: `docs/zendesk-icon-docs.md`
- **Third-Party Licenses**: `THIRD-PARTY-LICENSES.md`
- **README**: `README.md` (human-focused documentation)

## Quick Reference: Essential Commands

```bash
# Development
bun run dev              # Start dev server
bun run build            # Build for production
bun run lint             # Run linter
bun run lint:fix         # Auto-fix linting issues

# Code Formatting
bun run format           # Format all code with Prettier (including AGENTS.md)
bun run format:check     # Check code formatting

# Testing
bun run test             # Run unit tests (watch mode)
bun run test:run         # Run unit tests (CI mode)
bun run test:coverage    # Generate coverage report
bun run test:e2e         # Run E2E tests

# Icon Management
bun run generate-icons   # Regenerate icon catalog

# Verification (run after changes)
bun run verify           # Comprehensive verification (build + lint + test)
# Or manually:
bun run build && bun run lint && bun run test:run
```

---

**Remember**: Always run `bun run verify` (or `bun run format` for formatting) after making changes to ensure code quality and prevent CI failures.
