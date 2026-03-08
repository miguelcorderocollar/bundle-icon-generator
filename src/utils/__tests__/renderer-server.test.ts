import { describe, expect, it } from "vitest";
import { renderSvgServer } from "../renderer-server";
import type { IconMetadata } from "@/src/types/icon";

function createIcon(svg: string): IconMetadata {
  return {
    id: "feather-star",
    name: "Star",
    pack: "feather",
    svg,
    keywords: ["star"],
  };
}

describe("renderer-server", () => {
  it("renders SVG with solid background and icon color", () => {
    const icon = createIcon(
      '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M0 0"/></svg>'
    );

    const output = renderSvgServer({
      icon,
      backgroundColor: "#000000",
      iconColor: "#ffffff",
      size: 120,
    });

    expect(output).toContain('viewBox="0 0 120 120"');
    expect(output).toContain('fill="#000000"');
    expect(output).toContain('fill="#ffffff"');
  });

  it("supports zendesk location mode with transparent background", () => {
    const icon = createIcon(
      '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M0 0"/></svg>'
    );

    const output = renderSvgServer({
      icon,
      backgroundColor: "#ff0000",
      iconColor: "#00ff00",
      size: 30,
      zendeskLocationMode: true,
    });

    expect(output).toContain("currentColor");
    expect(output).not.toContain('fill="#ff0000"');
  });
});
