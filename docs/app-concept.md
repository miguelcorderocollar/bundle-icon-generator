# ZDK Icon Generator Concept

## Vision
Create a focused web application that helps Zendesk app builders generate compliant icon sets quickly. The tool should feel approachable, stay entirely local-first, and streamline the workflow from icon discovery to exportable assets that match Zendesk’s naming and sizing requirements.

## Problem Statement
- Zendesk custom apps require multiple icon variants (PNG and SVG) with strict naming and sizing rules.
- Designers and developers often juggle multiple icon sources, remember licensing obligations, and manually perform resizing/styling tasks.
- Existing tools rarely tailor the workflow to Zendesk-specific requirements or keep track of frequently used options.

## Target Users
- Zendesk app developers and designers who need compliant brand assets.
- Support teams customizing internal tooling without dedicated design support.

## Icon Sources & Licensing
- Preload Apache-2.0 licensed packs:
  - [Zendesk Garden SVG Icons](https://github.com/zendeskgarden/svg-icons)
  - [Feather Icons](https://github.com/feathericons/feather)
- Clearly surface license details in-app, attribute sources, and allow future packs to be added under compatible licenses.

## Core Experience
1. **App Location Intake**  
   - Guided questionnaire or tag selector covering Zendesk app locations (top bar, nav bar, ticket editor, etc.).
   - Locations determine which icon variants (SVG vs PNG, specific filenames) the app must output.
2. **Icon Discovery & Selection**  
   - Unified search across packs with filters (style, keywords, recently used, favorites).
   - Inline preview with hover states and metadata (pack name, original size).
3. **Customization Workspace**  
   - Controls for background color, icon color, gradient/solid options.
   - Optional effects: corner darkening for faux depth, outlines, drop shadows, or grid overlays that mimic 3D bevels.
   - Real-time preview panel showing each required asset size.
4. **Output Generation**  
   - “Create” action triggers local export pipeline.
   - Preview modal presents rendered assets, download button offers a ZIP containing `logo.png`, `logo-small.png`, and location-specific SVGs.
   - Allow iterative adjustments with editable parameters.

## Data & Persistence
- No server components; all processing and storage stay client-side.
- Cache recent colors and icons in `localStorage` for quick reuse, namespaced per installation.
- Consider optional JSON export/import of saved presets.

## Compliance with Zendesk Guidelines
- Enforce default export sizes: 320×320 PNG (`logo.png`), 128×128 PNG (`logo-small.png`), plus SVG files named per location (e.g., `icon_nav_bar.svg`).
- Ensure PNG renders avoid baked-in rounded corners; preview should overlay Zendesk-style masks to validate appearance.
- Offer guidance on legibility for light/dark backgrounds.

## UX Principles
- Minimalistic dashboard with progressive disclosure: ask for app locations first, then expand into customization panes.
- Responsive layout that keeps icon search, controls, and preview visible.
- Keyboard-accessible search, focus states, and screen-reader friendly labels.
- Document recent actions so users can step back without losing progress.

## Future Features
- Canvas-like editor for composing multiple icons or badges per export set.
- Batch processing for multiple apps or colorways at once.
- Integration hooks for syncing assets to Git repositories or Zendesk app manifests.
- Optional AI-assisted recoloring or icon suggestions based on app metadata.
- Collaboration mode allowing shared presets via exportable tokens.

## Success Metrics
- Reduce time-to-export for compliant icons.
- Increase reuse of favorite icons/colors across sessions.
- Positive qualitative feedback on search experience and visual polish of generated assets.


