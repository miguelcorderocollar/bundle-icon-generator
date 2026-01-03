import { describe, it, expect } from "vitest";
import {
  isGradient,
  isLinearGradient,
  isRadialGradient,
  isSolidColor,
  linearGradientToCss,
  radialGradientToCss,
  gradientToCss,
  linearGradientToSvgDef,
  radialGradientToSvgDef,
  gradientToSvgDef,
  getGradientPreset,
  getGradientPresetNames,
  backgroundValueToString,
  createDefaultLinearGradient,
  createDefaultRadialGradient,
  GRADIENT_PRESETS,
  KALE_COLORS,
  type LinearGradient,
  type RadialGradient,
} from "../gradients";

describe("gradients", () => {
  describe("type guards", () => {
    const linearGradient: LinearGradient = {
      type: "linear",
      angle: 45,
      stops: [
        { color: "#ff0000", offset: 0 },
        { color: "#0000ff", offset: 100 },
      ],
    };

    const radialGradient: RadialGradient = {
      type: "radial",
      centerX: 50,
      centerY: 50,
      radius: 70,
      stops: [
        { color: "#ff0000", offset: 0 },
        { color: "#0000ff", offset: 100 },
      ],
    };

    const solidColor = "#ff0000";

    describe("isGradient", () => {
      it("returns true for linear gradient", () => {
        expect(isGradient(linearGradient)).toBe(true);
      });

      it("returns true for radial gradient", () => {
        expect(isGradient(radialGradient)).toBe(true);
      });

      it("returns false for solid color", () => {
        expect(isGradient(solidColor)).toBe(false);
      });

      it("returns false for null", () => {
        expect(isGradient(null as unknown as string)).toBe(false);
      });
    });

    describe("isLinearGradient", () => {
      it("returns true for linear gradient", () => {
        expect(isLinearGradient(linearGradient)).toBe(true);
      });

      it("returns false for radial gradient", () => {
        expect(isLinearGradient(radialGradient)).toBe(false);
      });

      it("returns false for solid color", () => {
        expect(isLinearGradient(solidColor)).toBe(false);
      });
    });

    describe("isRadialGradient", () => {
      it("returns true for radial gradient", () => {
        expect(isRadialGradient(radialGradient)).toBe(true);
      });

      it("returns false for linear gradient", () => {
        expect(isRadialGradient(linearGradient)).toBe(false);
      });

      it("returns false for solid color", () => {
        expect(isRadialGradient(solidColor)).toBe(false);
      });
    });

    describe("isSolidColor", () => {
      it("returns true for hex string", () => {
        expect(isSolidColor(solidColor)).toBe(true);
      });

      it("returns false for linear gradient", () => {
        expect(isSolidColor(linearGradient)).toBe(false);
      });

      it("returns false for radial gradient", () => {
        expect(isSolidColor(radialGradient)).toBe(false);
      });
    });
  });

  describe("CSS conversion", () => {
    describe("linearGradientToCss", () => {
      it("converts simple linear gradient", () => {
        const gradient: LinearGradient = {
          type: "linear",
          angle: 90,
          stops: [
            { color: "#ff0000", offset: 0 },
            { color: "#0000ff", offset: 100 },
          ],
        };
        expect(linearGradientToCss(gradient)).toBe(
          "linear-gradient(90deg, #ff0000 0%, #0000ff 100%)"
        );
      });

      it("handles multiple stops", () => {
        const gradient: LinearGradient = {
          type: "linear",
          angle: 45,
          stops: [
            { color: "#ff0000", offset: 0 },
            { color: "#00ff00", offset: 50 },
            { color: "#0000ff", offset: 100 },
          ],
        };
        expect(linearGradientToCss(gradient)).toBe(
          "linear-gradient(45deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)"
        );
      });
    });

    describe("radialGradientToCss", () => {
      it("converts simple radial gradient", () => {
        const gradient: RadialGradient = {
          type: "radial",
          centerX: 50,
          centerY: 50,
          radius: 70,
          stops: [
            { color: "#ff0000", offset: 0 },
            { color: "#0000ff", offset: 100 },
          ],
        };
        expect(radialGradientToCss(gradient)).toBe(
          "radial-gradient(circle 70% at 50% 50%, #ff0000 0%, #0000ff 100%)"
        );
      });

      it("handles off-center radial gradient", () => {
        const gradient: RadialGradient = {
          type: "radial",
          centerX: 30,
          centerY: 30,
          radius: 60,
          stops: [
            { color: "#ffffff", offset: 0 },
            { color: "#000000", offset: 100 },
          ],
        };
        expect(radialGradientToCss(gradient)).toBe(
          "radial-gradient(circle 60% at 30% 30%, #ffffff 0%, #000000 100%)"
        );
      });
    });

    describe("gradientToCss", () => {
      it("handles linear gradient", () => {
        const gradient: LinearGradient = {
          type: "linear",
          angle: 0,
          stops: [
            { color: "#000", offset: 0 },
            { color: "#fff", offset: 100 },
          ],
        };
        expect(gradientToCss(gradient)).toContain("linear-gradient");
      });

      it("handles radial gradient", () => {
        const gradient: RadialGradient = {
          type: "radial",
          centerX: 50,
          centerY: 50,
          radius: 50,
          stops: [
            { color: "#000", offset: 0 },
            { color: "#fff", offset: 100 },
          ],
        };
        expect(gradientToCss(gradient)).toContain("radial-gradient");
      });
    });
  });

  describe("SVG conversion", () => {
    describe("linearGradientToSvgDef", () => {
      it("creates valid SVG linear gradient definition", () => {
        const gradient: LinearGradient = {
          type: "linear",
          angle: 90,
          stops: [
            { color: "#ff0000", offset: 0 },
            { color: "#0000ff", offset: 100 },
          ],
        };
        const result = linearGradientToSvgDef(gradient, "test-gradient", 100);

        expect(result).toContain("<defs>");
        expect(result).toContain('id="test-gradient"');
        expect(result).toContain("<linearGradient");
        expect(result).toContain('offset="0%"');
        expect(result).toContain('stop-color="#ff0000"');
        expect(result).toContain('offset="100%"');
        expect(result).toContain('stop-color="#0000ff"');
        expect(result).toContain("</defs>");
      });
    });

    describe("radialGradientToSvgDef", () => {
      it("creates valid SVG radial gradient definition", () => {
        const gradient: RadialGradient = {
          type: "radial",
          centerX: 50,
          centerY: 50,
          radius: 70,
          stops: [
            { color: "#ff0000", offset: 0 },
            { color: "#0000ff", offset: 100 },
          ],
        };
        const result = radialGradientToSvgDef(gradient, "test-radial", 100);

        expect(result).toContain("<defs>");
        expect(result).toContain('id="test-radial"');
        expect(result).toContain("<radialGradient");
        expect(result).toContain('cx="0.5"');
        expect(result).toContain('cy="0.5"');
        expect(result).toContain('r="0.7"');
        expect(result).toContain("</defs>");
      });
    });

    describe("gradientToSvgDef", () => {
      it("dispatches to linear gradient", () => {
        const gradient: LinearGradient = {
          type: "linear",
          angle: 0,
          stops: [{ color: "#000", offset: 0 }],
        };
        const result = gradientToSvgDef(gradient, "id", 100);
        expect(result).toContain("<linearGradient");
      });

      it("dispatches to radial gradient", () => {
        const gradient: RadialGradient = {
          type: "radial",
          centerX: 50,
          centerY: 50,
          radius: 50,
          stops: [{ color: "#000", offset: 0 }],
        };
        const result = gradientToSvgDef(gradient, "id", 100);
        expect(result).toContain("<radialGradient");
      });
    });
  });

  describe("presets", () => {
    describe("getGradientPreset", () => {
      it("returns preset by name", () => {
        const preset = getGradientPreset("ocean-blue");
        expect(preset).toBeDefined();
        expect(preset?.type).toBe("linear");
      });

      it("returns undefined for unknown preset", () => {
        const preset = getGradientPreset("nonexistent");
        expect(preset).toBeUndefined();
      });
    });

    describe("getGradientPresetNames", () => {
      it("returns array of preset names", () => {
        const names = getGradientPresetNames();
        expect(Array.isArray(names)).toBe(true);
        expect(names.length).toBeGreaterThan(0);
        expect(names).toContain("ocean-blue");
        expect(names).toContain("sunset");
      });
    });

    describe("GRADIENT_PRESETS", () => {
      it("contains valid gradient definitions", () => {
        Object.entries(GRADIENT_PRESETS).forEach(([name, gradient]) => {
          expect(isGradient(gradient)).toBe(true);
          expect(gradient.stops.length).toBeGreaterThanOrEqual(2);
          gradient.stops.forEach((stop) => {
            expect(stop.color).toMatch(/^#[0-9a-fA-F]{6}$/);
            expect(stop.offset).toBeGreaterThanOrEqual(0);
            expect(stop.offset).toBeLessThanOrEqual(100);
          });
        });
      });
    });
  });

  describe("helpers", () => {
    describe("backgroundValueToString", () => {
      it("returns solid color as-is", () => {
        expect(backgroundValueToString("#ff0000")).toBe("#ff0000");
      });

      it("converts gradient to CSS", () => {
        const gradient: LinearGradient = {
          type: "linear",
          angle: 90,
          stops: [
            { color: "#ff0000", offset: 0 },
            { color: "#0000ff", offset: 100 },
          ],
        };
        const result = backgroundValueToString(gradient);
        expect(result).toContain("linear-gradient");
      });
    });

    describe("createDefaultLinearGradient", () => {
      it("creates valid linear gradient with Kale colors", () => {
        const gradient = createDefaultLinearGradient();
        expect(gradient.type).toBe("linear");
        expect(gradient.angle).toBe(135);
        expect(gradient.stops).toHaveLength(2);
        expect(gradient.stops[0].color).toBe(KALE_COLORS["900"]);
        expect(gradient.stops[1].color).toBe(KALE_COLORS["500"]);
      });
    });

    describe("createDefaultRadialGradient", () => {
      it("creates valid radial gradient with Kale colors", () => {
        const gradient = createDefaultRadialGradient();
        expect(gradient.type).toBe("radial");
        expect(gradient.centerX).toBe(50);
        expect(gradient.centerY).toBe(50);
        expect(gradient.stops).toHaveLength(2);
        expect(gradient.stops[0].color).toBe(KALE_COLORS["800"]);
        expect(gradient.stops[1].color).toBe(KALE_COLORS["500"]);
      });
    });
  });

  describe("KALE_COLORS", () => {
    it("contains valid hex colors", () => {
      Object.values(KALE_COLORS).forEach((color) => {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it("has expected color keys", () => {
      expect(KALE_COLORS["100"]).toBeDefined();
      expect(KALE_COLORS["900"]).toBeDefined();
      expect(KALE_COLORS["1200"]).toBeDefined();
    });
  });
});

