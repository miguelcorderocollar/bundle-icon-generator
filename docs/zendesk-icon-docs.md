# Zendesk App Icon Guidelines

## Required Asset Set

### Logo Assets

- `assets/logo-small.png` — Small icon displayed in the header of the app. You can still upload and install the app without it, but a default image will appear in the interface. See Marketing assets for the image specifications. Size: 128×128 PNG-24 with transparency; keep sharp corners.
- `assets/logo.png` — Large icon displayed in the Zendesk admin pages for managing apps. You can still upload and install the app without it but a broken image icon will appear in the interface. See Marketing assets for the image specifications. Size: 320×320 PNG-24 with transparency; no rounded corners.

### Location-Specific Icons

- `assets/icon_*.svg` — An app in the nav_bar, ticket_editor, or top_bar location requires a respective `icon_nav_bar.svg`, `icon_ticket_editor.svg` or `icon_top_bar.svg` file. See SVG app icons and Top bar, nav bar, and ticket editor icon for the image specifications. Sized via viewBox but visually optimized for 18×18 display inside a 30×30 padded box.

#### Critical SVG Requirements for Location Icons

These location-specific SVG icons have strict requirements different from PNG logos:

1. **Transparent Background**: The SVG must NOT contain a background element (no `<rect>` fill). Zendesk applies its own background styling.

2. **No Hardcoded Fill Colors**: Do not specify explicit fill colors in the SVG. Use `currentColor` or omit the fill attribute entirely. Zendesk applies consistent fill colors across all app icons via CSS to maintain visual cohesion and proper hover/active states.

3. **Why This Matters**: Hardcoding colors or backgrounds will:
   - Cause visual inconsistencies with other Zendesk app icons
   - Interfere with hover and active states controlled by Zendesk CSS
   - Appear broken on different Zendesk themes (light/dark)

This generator automatically exports `icon_top_bar.svg`, `icon_ticket_editor.svg`, and `icon_nav_bar.svg` with transparent backgrounds and `currentColor` fills to comply with these requirements.

## File & Naming Conventions

- Store all assets in the app `assets/` directory.
- Keep filenames lowercase with underscores where required; follow Zendesk defaults without introducing additional extensions.
- Avoid baking in localization identifiers unless exporting per-locale variants manually.

## Design Recommendations

- Use simple, high-contrast shapes so details survive at small sizes.
- Design on square artboards; align stroking and padding to avoid blurring.
- Ensure visibility on both light and dark backgrounds (preview against both).
- Leave corners square; Zendesk applies its own rounding mask.
- For location SVGs (top bar, ticket editor, nav bar): rely on `currentColor` for fill/stroke so Zendesk can control the color via CSS.

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
