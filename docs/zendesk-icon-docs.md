# Zendesk App Icon Guidelines

## Required Asset Set
- `logo.png` — 320×320 PNG-24 with transparency; no rounded corners.
- `logo-small.png` — 128×128 PNG-24 with transparency; also keep sharp corners.
- Location-specific SVG icons (e.g., `icon_nav_bar.svg`, `icon_top_bar.svg`, `icon_ticket_editor.svg`) sized via viewBox but visually optimized for 18×18 display inside a 30×30 padded box.

## File & Naming Conventions
- Store all assets in the app `assets/` directory.
- Keep filenames lowercase with underscores where required; follow Zendesk defaults without introducing additional extensions.
- Avoid baking in localization identifiers unless exporting per-locale variants manually.

## Design Recommendations
- Use simple, high-contrast shapes so details survive at small sizes.
- Design on square artboards; align stroking and padding to avoid blurring.
- Ensure visibility on both light and dark backgrounds (preview against both).
- Leave corners square; Zendesk applies its own rounding mask.

## License Considerations
- Only bundle icon packs under compatible licenses (e.g., Apache-2.0).
- Retain attribution records for each source pack and surface them in documentation or UI.
- When remixing icons, note derivative work terms and include LICENSE files in distribution.

## Dynamic Icon Behavior
- Top bar apps can change SVG icons programmatically via ZAF `iconSymbol`; navigation and ticket editor support may lag behind.
- For location-driven variation, pre-generate multiple SVG symbols and switch references rather than editing files at runtime.

## Storage & Persistence Tips
- Namespace `localStorage` keys per app installation to avoid collisions.
- Cache frequently used icons or color presets in client storage to reduce fetches.
- Remember Zendesk asset URLs are unique per install; re-upload packaged assets after app updates.

## Localization Notes
- Icons generally remain static across locales; prefer universal metaphors.
- If unique icons are required per locale, manage them as separate asset bundles and switch references in code based on locale settings.

## References
- Zendesk App Assets: https://developer.zendesk.com/documentation/marketplace/building-a-marketplace-app/create-app-brand-assets/
- Styling Guide: https://developer.zendesk.com/documentation/apps/app-developer-guide/styling/
- Dynamic Icons: https://developer.zendesk.com/documentation/apps/build-an-app/dynamically-changing-app-icons/


