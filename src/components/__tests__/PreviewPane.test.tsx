import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PreviewPane } from "../../../components/PreviewPane";
import type { IconGeneratorState } from "../../hooks/use-icon-generator";

// Mock the child components
vi.mock("../PresetPreview", () => ({
  PresetPreview: ({ preset }: { preset: { name: string } }) => (
    <div data-testid="preset-preview">Preset Preview: {preset?.name}</div>
  ),
}));

vi.mock("../ExportModal", () => ({
  ExportModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="export-modal">Export Modal</div> : null,
}));

vi.mock("../../hooks/use-icon-metadata", () => ({
  useIconMetadata: vi.fn().mockReturnValue(null),
}));

// Mock the usePresets hook
vi.mock("../../hooks/use-presets", () => ({
  usePresets: vi.fn().mockReturnValue({
    selectedExportPresetId: "zendesk-png",
    selectedExportPreset: {
      id: "zendesk-png",
      name: "Zendesk PNG",
      description: "PNG files for Zendesk apps",
      variants: [
        { filename: "logo.png", width: 320, height: 320, format: "png" },
        { filename: "logo-small.png", width: 128, height: 128, format: "png" },
      ],
      isBuiltIn: true,
    },
    exportPresets: [
      {
        id: "zendesk-png",
        name: "Zendesk PNG",
        description: "PNG files for Zendesk apps",
        variants: [
          { filename: "logo.png", width: 320, height: 320, format: "png" },
          { filename: "logo-small.png", width: 128, height: 128, format: "png" },
        ],
        isBuiltIn: true,
      },
    ],
    stylePresets: [],
    selectExportPreset: vi.fn(),
    selectStylePreset: vi.fn(),
  }),
}));

// Mock the useRestriction hook
vi.mock("../../contexts/RestrictionContext", () => ({
  useRestriction: vi.fn().mockReturnValue({
    isRestricted: false,
    allowedStyles: [],
    allowedExportPresets: null,
    allowedIconPacks: ["all", "garden", "feather", "remixicon", "emoji", "custom-svg", "custom-image", "canvas"],
    isIconPackAllowed: () => true,
    isExportPresetAllowed: () => true,
    getShareableUrl: () => null,
    isLoading: false,
    config: null,
  }),
}));

describe("PreviewPane", () => {
  const createMockState = (
    overrides: Partial<IconGeneratorState> = {}
  ): IconGeneratorState => ({
    selectedLocations: [],
    selectedIconId: "test-icon",
    backgroundColor: "#063940",
    iconColor: "#ffffff",
    searchQuery: "",
    selectedPack: "all",
    iconSize: 123,
    svgIconSize: 123,
    ...overrides,
  });

  it("renders Preview title", () => {
    render(<PreviewPane />);
    // Check for the CardTitle which is a heading
    expect(
      screen.getByRole("heading", { name: /preview/i })
    ).toBeInTheDocument();
  });

  it("shows empty state when no icon selected", () => {
    render(<PreviewPane selectedIconId={undefined} />);
    expect(screen.getByText("No icon selected")).toBeInTheDocument();
  });

  it("shows Export ZIP button", () => {
    render(<PreviewPane selectedIconId="test-icon" />);
    expect(
      screen.getByRole("button", { name: /export zip/i })
    ).toBeInTheDocument();
  });

  it("disables export button when no icon selected", () => {
    render(<PreviewPane selectedIconId={undefined} />);
    expect(screen.getByRole("button", { name: /export zip/i })).toBeDisabled();
  });

  it("enables export button when icon is selected", () => {
    const state = createMockState({ selectedIconId: "test-icon" });
    render(<PreviewPane selectedIconId="test-icon" state={state} />);
    expect(screen.getByRole("button", { name: /export zip/i })).toBeEnabled();
  });

  it("shows Edit and Preview tabs when icon is selected", () => {
    const state = createMockState({ selectedIconId: "test-icon" });
    render(
      <PreviewPane
        selectedIconId="test-icon"
        selectedLocations={[]}
        state={state}
      />
    );
    expect(screen.getByRole("tab", { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /preview/i })).toBeInTheDocument();
  });

  it("shows file count in export section", () => {
    const state = createMockState({ selectedIconId: "test-icon" });
    render(
      <PreviewPane
        selectedIconId="test-icon"
        selectedLocations={[]}
        state={state}
      />
    );
    // Should mention export files
    expect(screen.getByText(/will export/i)).toBeInTheDocument();
  });
});
