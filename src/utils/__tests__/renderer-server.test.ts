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

  it("renders rounded background and border", () => {
    const icon = createIcon(
      '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M0 0"/></svg>'
    );

    const output = renderSvgServer({
      icon,
      backgroundColor: "#000000",
      iconColor: "#ffffff",
      size: 320,
      cornerRadius: 15,
      borderEnabled: true,
      borderColor: "#00ff00",
      borderWidth: 12,
    });

    expect(output).toContain('rx="24"');
    expect(output).toContain('stroke="#00ff00"');
    expect(output).toContain('stroke-width="12"');
  });

  it("normalizes zendesk mode output for garden, feather, and remixicon SVG shapes", () => {
    const cases = [
      {
        svg: '<svg viewBox="0 0 24 24"><path fill="#17494D" d="M1 1h22v22H1z"/></svg>',
        mustNotContain: "#17494D",
      },
      {
        svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 1h22v22H1z"/></svg>',
        mustNotContain: "",
      },
      {
        svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M1 1h22v22H1z"/></svg>',
        mustNotContain: "",
      },
    ];

    for (const testCase of cases) {
      const output = renderSvgServer({
        icon: createIcon(testCase.svg),
        backgroundColor: "#000000",
        iconColor: "#ffffff",
        size: 30,
        zendeskLocationMode: true,
      });

      expect(output).toContain("currentColor");
      expect(output).not.toContain('fill="#000000"');
      if (testCase.mustNotContain) {
        expect(output).not.toContain(testCase.mustNotContain);
      }
    }
  });
});
