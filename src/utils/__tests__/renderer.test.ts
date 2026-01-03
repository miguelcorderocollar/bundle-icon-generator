import { describe, it, expect } from "vitest";
import { applySvgColor, renderSvg, type SvgRenderOptions } from "../renderer";
import type { IconMetadata } from "../../types/icon";

describe("renderer", () => {
  describe("applySvgColor", () => {
    it("replaces fill attributes with new color", () => {
      const input = '<path fill="#000000" d="M0 0"/>';
      const result = applySvgColor(input, "#ff0000");
      expect(result).toBe('<path fill="#ff0000" d="M0 0"/>');
    });

    it("replaces stroke attributes with new color", () => {
      const input = '<path stroke="#000000" d="M0 0"/>';
      const result = applySvgColor(input, "#ff0000");
      expect(result).toBe('<path stroke="#ff0000" d="M0 0"/>');
    });

    it("replaces currentColor with new color", () => {
      const input = '<path fill="currentColor" stroke="currentColor" d="M0 0"/>';
      const result = applySvgColor(input, "#00ff00");
      expect(result).toBe('<path fill="#00ff00" stroke="#00ff00" d="M0 0"/>');
    });

    it('preserves fill="none"', () => {
      const input = '<path fill="none" stroke="#000" d="M0 0"/>';
      const result = applySvgColor(input, "#ff0000");
      expect(result).toContain('fill="none"');
      expect(result).toContain('stroke="#ff0000"');
    });

    it('preserves stroke="none"', () => {
      const input = '<path fill="#000" stroke="none" d="M0 0"/>';
      const result = applySvgColor(input, "#ff0000");
      expect(result).toContain('stroke="none"');
      expect(result).toContain('fill="#ff0000"');
    });

    it("preserves transparent fill", () => {
      const input = '<rect fill="transparent"/>';
      const result = applySvgColor(input, "#ff0000");
      expect(result).toContain('fill="transparent"');
    });

    it("preserves url() references", () => {
      const input = '<rect fill="url(#gradient1)"/>';
      const result = applySvgColor(input, "#ff0000");
      expect(result).toContain('fill="url(#gradient1)"');
    });

    it("handles inline style fill", () => {
      const input = '<path style="fill: #000000;"/>';
      const result = applySvgColor(input, "#ff0000");
      expect(result).toContain("fill: #ff0000;");
    });

    it("handles inline style stroke", () => {
      const input = '<path style="stroke: #000000;"/>';
      const result = applySvgColor(input, "#ff0000");
      expect(result).toContain("stroke: #ff0000;");
    });

    it("preserves inline style fill: none", () => {
      const input = '<path style="fill: none;"/>';
      const result = applySvgColor(input, "#ff0000");
      expect(result).toContain("fill: none;");
    });

    it("handles multiple elements", () => {
      const input = `
        <path fill="#111" d="M0 0"/>
        <circle fill="#222" cx="10" cy="10" r="5"/>
        <rect stroke="#333" x="0" y="0"/>
      `;
      const result = applySvgColor(input, "#abcdef");
      expect(result).not.toContain("#111");
      expect(result).not.toContain("#222");
      expect(result).not.toContain("#333");
      expect(result.match(/#abcdef/g)?.length).toBe(3);
    });
  });

  describe("renderSvg", () => {
    const createMockIcon = (svg: string): IconMetadata => ({
      id: "test-icon",
      name: "Test Icon",
      pack: "test",
      tags: [],
      svg,
    });

    it("renders SVG with solid background", () => {
      const icon = createMockIcon('<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>');
      const options: SvgRenderOptions = {
        icon,
        backgroundColor: "#ff0000",
        iconColor: "#ffffff",
        size: 100,
      };

      const result = renderSvg(options);

      expect(result).toContain("<svg");
      expect(result).toContain("</svg>");
      expect(result).toContain('width="100"');
      expect(result).toContain('height="100"');
      expect(result).toContain('viewBox="0 0 100 100"');
      expect(result).toContain('fill="#ff0000"');
    });

    it("renders SVG with gradient background", () => {
      const icon = createMockIcon('<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>');
      const options: SvgRenderOptions = {
        icon,
        backgroundColor: {
          type: "linear",
          angle: 90,
          stops: [
            { color: "#ff0000", offset: 0 },
            { color: "#0000ff", offset: 100 },
          ],
        },
        iconColor: "#ffffff",
        size: 100,
      };

      const result = renderSvg(options);

      expect(result).toContain("<defs>");
      expect(result).toContain("<linearGradient");
      expect(result).toContain("url(#");
    });

    it("applies icon color to paths", () => {
      const icon = createMockIcon(
        '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M0 0"/></svg>'
      );
      const options: SvgRenderOptions = {
        icon,
        backgroundColor: "#000000",
        iconColor: "#00ff00",
        size: 100,
      };

      const result = renderSvg(options);

      expect(result).toContain('fill="#00ff00"');
    });

    it("respects padding option", () => {
      const icon = createMockIcon('<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>');
      const withPadding: SvgRenderOptions = {
        icon,
        backgroundColor: "#000000",
        iconColor: "#ffffff",
        size: 100,
        padding: 10,
      };

      const result = renderSvg(withPadding);

      // Check that transform includes proper centering with padding
      expect(result).toContain("transform=");
    });

    it("respects outputSize option", () => {
      const icon = createMockIcon('<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>');
      const options: SvgRenderOptions = {
        icon,
        backgroundColor: "#000000",
        iconColor: "#ffffff",
        size: 100,
        outputSize: 50,
      };

      const result = renderSvg(options);

      expect(result).toContain('width="50"');
      expect(result).toContain('height="50"');
      expect(result).toContain('viewBox="0 0 100 100"');
    });

    it("handles zendeskLocationMode (no background)", () => {
      const icon = createMockIcon(
        '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M0 0"/></svg>'
      );
      const options: SvgRenderOptions = {
        icon,
        backgroundColor: "#ff0000",
        iconColor: "#ffffff",
        size: 24,
        zendeskLocationMode: true,
      };

      const result = renderSvg(options);

      // Should NOT contain background rect
      expect(result).not.toContain('fill="#ff0000"');
      // Should preserve currentColor
      expect(result).toContain("currentColor");
    });

    it("preserves stroke attributes from Feather-style icons", () => {
      const icon = createMockIcon(
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M0 0"/></svg>'
      );
      const options: SvgRenderOptions = {
        icon,
        backgroundColor: "#000000",
        iconColor: "#ffffff",
        size: 100,
      };

      const result = renderSvg(options);

      expect(result).toContain('fill="none"');
      expect(result).toContain('stroke="#ffffff"');
      expect(result).toContain('stroke-width="2"');
      expect(result).toContain('stroke-linecap="round"');
      expect(result).toContain('stroke-linejoin="round"');
    });

    it("handles non-zero viewBox origin", () => {
      const icon = createMockIcon(
        '<svg viewBox="10 10 24 24"><path d="M0 0"/></svg>'
      );
      const options: SvgRenderOptions = {
        icon,
        backgroundColor: "#000000",
        iconColor: "#ffffff",
        size: 100,
      };

      const result = renderSvg(options);

      // Should include translate to handle viewBox offset
      expect(result).toContain("translate(-10, -10)");
    });

    it("handles SVG without explicit viewBox (uses width/height)", () => {
      const icon = createMockIcon(
        '<svg width="32" height="32"><path d="M0 0"/></svg>'
      );
      const options: SvgRenderOptions = {
        icon,
        backgroundColor: "#000000",
        iconColor: "#ffffff",
        size: 100,
      };

      const result = renderSvg(options);

      expect(result).toContain("<svg");
      expect(result).toContain("transform=");
    });

    it("skips color transform for rasterized icons", () => {
      const icon = createMockIcon(
        '<svg viewBox="0 0 24 24"><image href="data:image/png;base64,..." width="24" height="24"/></svg>'
      );
      (icon as IconMetadata & { isRasterized: boolean }).isRasterized = true;

      const options: SvgRenderOptions = {
        icon,
        backgroundColor: "#000000",
        iconColor: "#ffffff",
        size: 100,
      };

      const result = renderSvg(options);

      // Should include image element
      expect(result).toContain("<image");
    });

    it("skips color transform when allowColorOverride is false", () => {
      const icon = createMockIcon(
        '<svg viewBox="0 0 24 24"><path fill="#ff5500" d="M0 0"/></svg>'
      );
      (icon as IconMetadata & { allowColorOverride: boolean }).allowColorOverride = false;

      const options: SvgRenderOptions = {
        icon,
        backgroundColor: "#000000",
        iconColor: "#ffffff",
        size: 100,
      };

      const result = renderSvg(options);

      // Original color should be preserved
      expect(result).toContain("#ff5500");
    });
  });
});

