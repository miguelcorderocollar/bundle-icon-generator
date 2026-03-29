import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExportSecondaryActions } from "../ExportSecondaryActions";
import type { IconGeneratorState } from "../../hooks/use-icon-generator";
import type { ExportPreset } from "../../types/preset";

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuItem: ({
    children,
    disabled,
    onSelect,
  }: {
    children: React.ReactNode;
    disabled?: boolean;
    onSelect?: (event: Event) => void;
  }) => (
    <button
      type="button"
      role="menuitem"
      data-disabled={disabled ? "" : undefined}
      disabled={disabled}
      onClick={() => onSelect?.({ preventDefault() {} } as never)}
    >
      {children}
    </button>
  ),
  DropdownMenuSeparator: () => <hr />,
}));

vi.mock("../../utils/export-controller", () => ({
  getSecondaryExportCapabilities: vi.fn(),
  generateStyledSvgDownload: vi.fn(),
  generateSourceSvgDownload: vi.fn(),
  generateClipboardPng: vi.fn(),
  downloadFile: vi.fn(),
}));

vi.mock("../../utils/clipboard", () => ({
  isImageClipboardSupported: vi.fn(),
  writeImageToClipboard: vi.fn(),
}));

describe("ExportSecondaryActions", () => {
  const state: IconGeneratorState = {
    selectedLocations: [],
    selectedIconId: "test-icon",
    backgroundColor: "#063940",
    iconColor: "#ffffff",
    searchQuery: "",
    selectedPack: "all",
    iconSize: 123,
    svgIconSize: 123,
  };

  const preset: ExportPreset = {
    id: "single-png",
    name: "Single PNG",
    description: "Single PNG export",
    isBuiltIn: true,
    variants: [
      {
        filename: "icon.png",
        width: 512,
        height: 512,
        format: "png",
      },
    ],
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const exportController = await import("../../utils/export-controller");
    const clipboard = await import("../../utils/clipboard");

    vi.mocked(exportController.getSecondaryExportCapabilities).mockReturnValue({
      canDownloadStyledSvg: true,
      canDownloadSourceSvg: true,
      canCopyPng: true,
    });
    vi.mocked(exportController.generateStyledSvgDownload).mockResolvedValue({
      blob: new Blob(["styled"], { type: "image/svg+xml" }),
      filename: "icon.svg",
    });
    vi.mocked(exportController.generateSourceSvgDownload).mockResolvedValue({
      blob: new Blob(["source"], { type: "image/svg+xml" }),
      filename: "test-icon.svg",
    });
    vi.mocked(exportController.generateClipboardPng).mockResolvedValue(
      new Blob(["png"], { type: "image/png" })
    );
    vi.mocked(clipboard.isImageClipboardSupported).mockReturnValue(true);
  });

  it("renders the secondary actions trigger", () => {
    render(
      <ExportSecondaryActions
        state={state}
        selectedLocations={[]}
        selectedExportPreset={preset}
      />
    );

    expect(
      screen.getByRole("button", { name: /export secondary actions/i })
    ).toBeInTheDocument();
  });

  it("downloads styled and source SVG actions", async () => {
    const exportController = await import("../../utils/export-controller");

    render(
      <ExportSecondaryActions
        state={state}
        selectedLocations={[]}
        selectedExportPreset={preset}
      />
    );

    fireEvent.click(screen.getByText("Download styled SVG"));

    await waitFor(() => {
      expect(exportController.downloadFile).toHaveBeenCalledWith(
        expect.any(Blob),
        "icon.svg"
      );
    });

    fireEvent.click(screen.getByText("Download source SVG"));

    await waitFor(() => {
      expect(exportController.downloadFile).toHaveBeenCalledWith(
        expect.any(Blob),
        "test-icon.svg"
      );
    });
  });

  it("copies PNG to clipboard as image/png", async () => {
    const clipboard = await import("../../utils/clipboard");

    render(
      <ExportSecondaryActions
        state={state}
        selectedLocations={[]}
        selectedExportPreset={preset}
      />
    );

    fireEvent.click(screen.getByText("Copy PNG to clipboard"));

    await waitFor(() => {
      expect(clipboard.writeImageToClipboard).toHaveBeenCalledWith(
        expect.objectContaining({ type: "image/png" })
      );
    });
  });

  it("disables copy action when clipboard support is unavailable", async () => {
    const clipboard = await import("../../utils/clipboard");
    vi.mocked(clipboard.isImageClipboardSupported).mockReturnValue(false);

    render(
      <ExportSecondaryActions
        state={state}
        selectedLocations={[]}
        selectedExportPreset={preset}
      />
    );

    expect(
      screen.getByRole("menuitem", { name: /clipboard unavailable/i })
    ).toHaveAttribute("data-disabled");
  });

  it("disables SVG actions for canvas mode", async () => {
    const exportController = await import("../../utils/export-controller");
    vi.mocked(exportController.getSecondaryExportCapabilities).mockReturnValue({
      canDownloadStyledSvg: false,
      canDownloadSourceSvg: false,
      canCopyPng: true,
    });

    render(
      <ExportSecondaryActions
        state={{ ...state, selectedPack: "canvas", selectedIconId: "canvas" }}
        selectedLocations={[]}
        selectedExportPreset={preset}
        canvasState={{ layers: [{ id: "1" }] } as never}
      />
    );

    expect(
      screen.getByRole("menuitem", { name: /download styled svg/i })
    ).toHaveAttribute("data-disabled");
    expect(
      screen.getByRole("menuitem", { name: /download source svg/i })
    ).toHaveAttribute("data-disabled");
  });
});
