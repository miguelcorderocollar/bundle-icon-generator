import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PreviewPane } from "../../../components/PreviewPane";
import type { IconGeneratorState } from "../../hooks/use-icon-generator";

// Mock the child components
vi.mock("../PngPreview", () => ({
  PngPreview: ({ iconId }: { iconId?: string }) => (
    <div data-testid="png-preview">PNG Preview: {iconId}</div>
  ),
}));

vi.mock("../SvgPreview", () => ({
  SvgPreview: ({ svgFiles }: { svgFiles: string[] }) => (
    <div data-testid="svg-preview">SVG Preview: {svgFiles.join(", ")}</div>
  ),
}));

vi.mock("../ExportModal", () => ({
  ExportModal: ({ open }: { open: boolean }) => (
    open ? <div data-testid="export-modal">Export Modal</div> : null
  ),
}));

vi.mock("../../hooks/use-icon-metadata", () => ({
  useIconMetadata: vi.fn().mockReturnValue(null),
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
    expect(screen.getByText("Preview")).toBeInTheDocument();
  });

  it("shows empty state when no icon selected", () => {
    render(<PreviewPane selectedIconId={undefined} />);
    expect(screen.getByText("No icon selected")).toBeInTheDocument();
  });

  it("shows Export ZIP button", () => {
    render(<PreviewPane selectedIconId="test-icon" />);
    expect(screen.getByRole("button", { name: /export zip/i })).toBeInTheDocument();
  });

  it("disables export button when no icon selected", () => {
    render(<PreviewPane selectedIconId={undefined} />);
    expect(screen.getByRole("button", { name: /export zip/i })).toBeDisabled();
  });

  it("enables export button when icon is selected", () => {
    const state = createMockState({ selectedIconId: "test-icon" });
    render(
      <PreviewPane
        selectedIconId="test-icon"
        state={state}
      />
    );
    expect(screen.getByRole("button", { name: /export zip/i })).toBeEnabled();
  });

  it("shows PNG preview when icon is selected", () => {
    const state = createMockState({ selectedIconId: "test-icon" });
    render(
      <PreviewPane
        selectedIconId="test-icon"
        selectedLocations={[]}
        state={state}
      />
    );
    expect(screen.getByTestId("png-preview")).toBeInTheDocument();
  });

  it("shows tabs when locations require SVG files", () => {
    const state = createMockState({ selectedIconId: "test-icon" });
    render(
      <PreviewPane
        selectedIconId="test-icon"
        selectedLocations={["top_bar"]}
        state={state}
      />
    );
    // Should have PNG and SVG tabs
    expect(screen.getByRole("tab", { name: /png/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /svg/i })).toBeInTheDocument();
  });

  it("shows file count in export section", () => {
    const state = createMockState({ selectedIconId: "test-icon" });
    render(
      <PreviewPane
        selectedIconId="test-icon"
        selectedLocations={["top_bar"]}
        state={state}
      />
    );
    // Should mention export files
    expect(screen.getByText(/will export/i)).toBeInTheDocument();
  });
});

