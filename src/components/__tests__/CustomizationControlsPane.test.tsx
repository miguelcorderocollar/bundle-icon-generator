import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CustomizationControlsPane } from "../../../components/CustomizationControlsPane";
import { usePresets } from "../../hooks/use-presets";
import { useRestriction } from "../../contexts/RestrictionContext";
import type { ExportPreset } from "../../types/preset";

vi.mock("../../hooks/use-presets", () => ({
  usePresets: vi.fn(),
}));

vi.mock("../../contexts/RestrictionContext", () => ({
  useRestriction: vi.fn(),
}));

vi.mock("../StylePresetSelector", () => ({
  StylePresetSelector: () => null,
}));

vi.mock("../StylePresetEditor", () => ({
  StylePresetEditor: () => null,
}));

vi.mock("../PresetSettingsModal", () => ({
  PresetSettingsModal: () => null,
}));

const pngPreset: ExportPreset = {
  id: "png-only",
  name: "PNG Only",
  description: "PNG files only",
  variants: [{ filename: "logo.png", width: 512, height: 512, format: "png" }],
  isBuiltIn: false,
};

const svgPreset: ExportPreset = {
  id: "svg-mixed",
  name: "SVG Mixed",
  description: "PNG and SVG",
  variants: [
    { filename: "logo.png", width: 512, height: 512, format: "png" },
    {
      filename: "icon-nav-bar.svg",
      width: 16,
      height: 16,
      format: "svg",
      location: "nav_bar",
    },
  ],
  isBuiltIn: false,
};

function mockPresets(selectedExportPresetId: string) {
  vi.mocked(usePresets).mockReturnValue({
    exportPresets: [pngPreset, svgPreset],
    selectedExportPresetId,
    selectedExportPreset: undefined,
    selectExportPreset: vi.fn(),
    createExportPreset: vi.fn(),
    updateExportPreset: vi.fn(),
    deleteExportPreset: vi.fn(),
    hasCustomExportPresets: false,
    stylePresets: [],
    selectedStylePresetId: null,
    selectedStylePreset: undefined,
    selectStylePreset: vi.fn(),
    createStylePreset: vi.fn(),
    updateStylePreset: vi.fn(),
    deleteStylePreset: vi.fn(),
    hasCustomStylePresets: false,
    exportAllPresets: vi.fn(),
    importPresets: vi.fn(),
    clearCustomPresets: vi.fn(),
    isLoading: false,
  });
}

describe("CustomizationControlsPane", () => {
  beforeEach(() => {
    vi.mocked(useRestriction).mockReturnValue({
      isRestricted: false,
      allowedStyles: [],
      allowedExportPresets: null,
      allowedIconPacks: [
        "all",
        "garden",
        "feather",
        "remixicon",
        "emoji",
        "custom-svg",
        "custom-image",
        "canvas",
      ],
      defaultIconPack: null,
      isIconPackAllowed: () => true,
      isExportPresetAllowed: () => true,
      getShareableUrl: () => null,
      config: null,
      isLoading: false,
    });
  });

  it("hides SVG size control when selected preset has no SVG variant", () => {
    mockPresets("png-only");

    render(
      <CustomizationControlsPane
        iconSize={120}
        svgIconSize={120}
        onIconSizeChange={vi.fn()}
        onSvgIconSizeChange={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /icon size/i }));

    expect(screen.getByText("Size")).toBeInTheDocument();
    expect(screen.queryByText("PNG Size")).not.toBeInTheDocument();
    expect(screen.queryByText("SVG Size")).not.toBeInTheDocument();
  });

  it("shows SVG size control when selected preset includes SVG variant", () => {
    mockPresets("svg-mixed");

    render(
      <CustomizationControlsPane
        iconSize={120}
        svgIconSize={120}
        onIconSizeChange={vi.fn()}
        onSvgIconSizeChange={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /icon size/i }));

    expect(screen.getByText("PNG Size")).toBeInTheDocument();
    expect(screen.getByText("SVG Size")).toBeInTheDocument();
  });
});
