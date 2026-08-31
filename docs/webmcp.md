# WebMCP demo

The /webmcp route demonstrates how the icon generator can expose narrow, read-only tools to a browser agent.

The page registers these tools on the top-level document when document.modelContext.registerTool is available:

- search_icons finds icons by text and pack.
- get_icon returns metadata and source SVG for one icon.
- generate_icon_svg validates customization settings and returns a generated SVG.

The handlers use the existing client-side catalog and renderer. They do not read React state, trigger downloads, or upload files. SVG-bearing results are marked with WebMCP's untrustedContentHint annotation.

## Try it with ChatGPT

1. Open the deployed /webmcp route in the ChatGPT desktop app's built-in browser.
2. Use a model with site tools enabled, such as GPT-5.6 Sol or GPT-5.6 Terra.
3. Ask ChatGPT to search for an icon or generate an SVG with a specific color.
4. Inspect the available site tools and the recent tool call in the browser UI.

ChatGPT currently discovers JavaScript-registered tools in the top-level page. It does not discover declarative tools or tools registered inside iframes. WebMCP support is rollout-dependent, so the page also shows a clear unsupported state and keeps the normal app behavior separate.

The demo is intentionally not an MCP server. A remote MCP server would be useful when the app does not have an open page. WebMCP is a better fit for this local-first workflow because the agent and user can work with the same live tab.
