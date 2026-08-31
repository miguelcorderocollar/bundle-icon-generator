# WebMCP demo

The main generator page exposes a complete, stateful WebMCP workflow. The /webmcp route remains a small test bench for inspecting the underlying read-only API.

The page registers these tools on the top-level document when document.modelContext.registerTool is available:

- search_icons finds icons by text and pack.
- get_icon returns metadata and source SVG for one icon.
- generate_icon_svg validates customization settings and returns a generated SVG.

The handlers use the existing client-side catalog and renderer. They do not read React state, trigger downloads, or upload files. SVG-bearing results are marked with WebMCP's untrustedContentHint annotation.

## Main generator tools

When the main page is open in a compatible browser, it additionally registers:

- inspect_generator_state reads the selected icon, current customization, available locations, and export presets.
- configure_generator selects an icon and applies colors, gradients, sizes, borders, locations, style presets, and export presets.
- render_current_icon renders the current visible configuration without downloading anything.
- export_icon_bundle generates and downloads the configured bundle. This is the only tool with a download side effect.

The tools call the same React state actions, export validation, renderer, and preset data used by the visible UI. This keeps the agent contract aligned with the product instead of creating a parallel mock workflow.

## Try it with ChatGPT

1. Open the deployed main route in the ChatGPT desktop app's built-in browser.
2. Use a model with site tools enabled, such as GPT-5.6 Sol or GPT-5.6 Terra.
3. Ask ChatGPT to inspect the generator, choose an icon and customization, render it, and export it.
4. Approve the download when the browser asks for confirmation.

Example request:

> Use the site tools to find a Feather star icon, select it, set a teal background and white icon, choose the Zendesk App preset, render the current icon, then export the bundle.

ChatGPT currently discovers JavaScript-registered tools in the top-level page. It does not discover declarative tools or tools registered inside iframes. WebMCP support is rollout-dependent, so the page also shows a clear unsupported state and keeps the normal app behavior separate.

The demo is intentionally not an MCP server. A remote MCP server would be useful when the app does not have an open page. WebMCP is a better fit for this local-first workflow because the agent and user can work with the same live tab.
