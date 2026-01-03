import { describe, it, expect } from "vitest";
import {
  calculateRequiredSvgFiles,
  hasSvgRequirements,
  getLocationCountText,
} from "../locations";
import type { AppLocation } from "../../types/app-location";

describe("locations", () => {
  describe("calculateRequiredSvgFiles", () => {
    it("returns empty array for no locations", () => {
      const result = calculateRequiredSvgFiles([]);
      expect(result).toEqual([]);
    });

    it("returns empty array for locations that do not require icons", () => {
      const locations: AppLocation[] = [
        "ticket_sidebar",
        "new_ticket_sidebar",
        "background",
        "modal",
      ];
      const result = calculateRequiredSvgFiles(locations);
      expect(result).toEqual([]);
    });

    it("returns icon file for top_bar", () => {
      const locations: AppLocation[] = ["top_bar"];
      const result = calculateRequiredSvgFiles(locations);
      expect(result).toContain("icon_top_bar.svg");
    });

    it("returns icon file for nav_bar", () => {
      const locations: AppLocation[] = ["nav_bar"];
      const result = calculateRequiredSvgFiles(locations);
      expect(result).toContain("icon_nav_bar.svg");
    });

    it("returns icon file for ticket_editor", () => {
      const locations: AppLocation[] = ["ticket_editor"];
      const result = calculateRequiredSvgFiles(locations);
      expect(result).toContain("icon_ticket_editor.svg");
    });

    it("returns multiple icon files for multiple icon-requiring locations", () => {
      const locations: AppLocation[] = ["top_bar", "nav_bar", "ticket_editor"];
      const result = calculateRequiredSvgFiles(locations);
      expect(result).toHaveLength(3);
      expect(result).toContain("icon_top_bar.svg");
      expect(result).toContain("icon_nav_bar.svg");
      expect(result).toContain("icon_ticket_editor.svg");
    });

    it("does not duplicate icon files", () => {
      const locations: AppLocation[] = ["top_bar", "top_bar"];
      const result = calculateRequiredSvgFiles(locations);
      expect(result).toHaveLength(1);
      expect(result).toContain("icon_top_bar.svg");
    });

    it("returns all icon files for all_locations", () => {
      const locations: AppLocation[] = ["all_locations"];
      const result = calculateRequiredSvgFiles(locations);
      expect(result).toContain("icon_top_bar.svg");
      expect(result).toContain("icon_nav_bar.svg");
      expect(result).toContain("icon_ticket_editor.svg");
      expect(result).toHaveLength(3);
    });

    it("returns sorted array", () => {
      const locations: AppLocation[] = ["top_bar", "nav_bar", "ticket_editor"];
      const result = calculateRequiredSvgFiles(locations);
      const sorted = [...result].sort();
      expect(result).toEqual(sorted);
    });

    it("handles mix of icon-requiring and non-requiring locations", () => {
      const locations: AppLocation[] = [
        "ticket_sidebar",
        "top_bar",
        "background",
        "nav_bar",
      ];
      const result = calculateRequiredSvgFiles(locations);
      expect(result).toHaveLength(2);
      expect(result).toContain("icon_top_bar.svg");
      expect(result).toContain("icon_nav_bar.svg");
    });
  });

  describe("hasSvgRequirements", () => {
    it("returns false for empty locations", () => {
      expect(hasSvgRequirements([])).toBe(false);
    });

    it("returns false for locations that do not require icons", () => {
      const locations: AppLocation[] = ["ticket_sidebar", "background"];
      expect(hasSvgRequirements(locations)).toBe(false);
    });

    it("returns true for top_bar", () => {
      const locations: AppLocation[] = ["top_bar"];
      expect(hasSvgRequirements(locations)).toBe(true);
    });

    it("returns true for nav_bar", () => {
      const locations: AppLocation[] = ["nav_bar"];
      expect(hasSvgRequirements(locations)).toBe(true);
    });

    it("returns true for ticket_editor", () => {
      const locations: AppLocation[] = ["ticket_editor"];
      expect(hasSvgRequirements(locations)).toBe(true);
    });

    it("returns true for all_locations", () => {
      const locations: AppLocation[] = ["all_locations"];
      expect(hasSvgRequirements(locations)).toBe(true);
    });

    it("returns true for mixed locations with at least one requiring icons", () => {
      const locations: AppLocation[] = ["ticket_sidebar", "top_bar"];
      expect(hasSvgRequirements(locations)).toBe(true);
    });
  });

  describe("getLocationCountText", () => {
    it("returns singular for count of 1", () => {
      expect(getLocationCountText(1)).toBe("1 location selected");
    });

    it("returns plural for count of 0", () => {
      expect(getLocationCountText(0)).toBe("0 locations selected");
    });

    it("returns plural for count of 2", () => {
      expect(getLocationCountText(2)).toBe("2 locations selected");
    });

    it("returns plural for large counts", () => {
      expect(getLocationCountText(10)).toBe("10 locations selected");
    });
  });
});

