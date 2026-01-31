/**
 * Tests for CustomImageColorOverride component
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CustomImageColorOverride } from "../CustomImageColorOverride";
import {
  storeColorAnalysis,
  storeColorOverride,
  getColorOverride,
  type ColorAnalysisResult,
} from "@/src/utils/image-color-analysis";

describe("CustomImageColorOverride", () => {
  const mockImageId = "custom-image-123";

  beforeEach(() => {
    sessionStorage.clear();
  });

  it("should not render when no color analysis exists", () => {
    const { container } = render(
      <CustomImageColorOverride imageId={mockImageId} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("should not render when color is not uniform", () => {
    const nonUniformResult: ColorAnalysisResult = {
      dominantColor: "#808080",
      uniformity: 0.4, // Below 0.6 threshold
      hasUniformColor: false,
      pixelCount: 1000,
    };

    storeColorAnalysis(mockImageId, nonUniformResult);

    const { container } = render(
      <CustomImageColorOverride imageId={mockImageId} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("should render when color is uniform", () => {
    const uniformResult: ColorAnalysisResult = {
      dominantColor: "#1a1a1a",
      uniformity: 0.85,
      hasUniformColor: true,
      pixelCount: 1000,
    };

    storeColorAnalysis(mockImageId, uniformResult);

    render(<CustomImageColorOverride imageId={mockImageId} />);

    expect(screen.getByText("Color Override")).toBeInTheDocument();
    expect(screen.getByText("Detected Color")).toBeInTheDocument();
    expect(screen.getByText("#1A1A1A (85% uniform)")).toBeInTheDocument();
  });

  it("should display override toggle switch", () => {
    const uniformResult: ColorAnalysisResult = {
      dominantColor: "#000000",
      uniformity: 0.9,
      hasUniformColor: true,
      pixelCount: 500,
    };

    storeColorAnalysis(mockImageId, uniformResult);

    render(<CustomImageColorOverride imageId={mockImageId} />);

    expect(screen.getByText("Override icon color")).toBeInTheDocument();
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("should not show color picker when override is disabled", () => {
    const uniformResult: ColorAnalysisResult = {
      dominantColor: "#ff0000",
      uniformity: 0.95,
      hasUniformColor: true,
      pixelCount: 800,
    };

    storeColorAnalysis(mockImageId, uniformResult);

    render(<CustomImageColorOverride imageId={mockImageId} />);

    // Color picker should not be visible initially
    expect(screen.queryByText("New Color")).not.toBeInTheDocument();
  });

  it("should show color picker when override is enabled", () => {
    const uniformResult: ColorAnalysisResult = {
      dominantColor: "#00ff00",
      uniformity: 0.88,
      hasUniformColor: true,
      pixelCount: 600,
    };

    storeColorAnalysis(mockImageId, uniformResult);

    render(<CustomImageColorOverride imageId={mockImageId} />);

    // Enable the override
    const toggle = screen.getByRole("switch");
    fireEvent.click(toggle);

    // Color picker should now be visible
    expect(screen.getByText("New Color")).toBeInTheDocument();
    expect(screen.getByText("Reset to original")).toBeInTheDocument();
  });

  it("should call onOverrideChange when override is toggled on", () => {
    const uniformResult: ColorAnalysisResult = {
      dominantColor: "#0000ff",
      uniformity: 0.92,
      hasUniformColor: true,
      pixelCount: 400,
    };

    storeColorAnalysis(mockImageId, uniformResult);

    const handleOverrideChange = vi.fn();

    render(
      <CustomImageColorOverride
        imageId={mockImageId}
        onOverrideChange={handleOverrideChange}
      />
    );

    const toggle = screen.getByRole("switch");
    fireEvent.click(toggle);

    expect(handleOverrideChange).toHaveBeenCalledWith(expect.any(String));
  });

  it("should call onOverrideChange with null when override is toggled off", () => {
    const uniformResult: ColorAnalysisResult = {
      dominantColor: "#ff00ff",
      uniformity: 0.8,
      hasUniformColor: true,
      pixelCount: 300,
    };

    storeColorAnalysis(mockImageId, uniformResult);
    storeColorOverride(mockImageId, "#ffffff"); // Pre-set override

    const handleOverrideChange = vi.fn();

    render(
      <CustomImageColorOverride
        imageId={mockImageId}
        onOverrideChange={handleOverrideChange}
      />
    );

    const toggle = screen.getByRole("switch");
    // Toggle is already on because of pre-set override, so click to turn off
    fireEvent.click(toggle);

    expect(handleOverrideChange).toHaveBeenCalledWith(null);
  });

  it("should store color override in sessionStorage when enabled", () => {
    const uniformResult: ColorAnalysisResult = {
      dominantColor: "#123456",
      uniformity: 0.75,
      hasUniformColor: true,
      pixelCount: 200,
    };

    storeColorAnalysis(mockImageId, uniformResult);

    render(<CustomImageColorOverride imageId={mockImageId} />);

    const toggle = screen.getByRole("switch");
    fireEvent.click(toggle);

    const storedOverride = getColorOverride(mockImageId);
    expect(storedOverride).not.toBeNull();
  });

  it("should remove color override from sessionStorage when disabled", () => {
    const uniformResult: ColorAnalysisResult = {
      dominantColor: "#abcdef",
      uniformity: 0.7,
      hasUniformColor: true,
      pixelCount: 150,
    };

    storeColorAnalysis(mockImageId, uniformResult);
    storeColorOverride(mockImageId, "#ffffff");

    render(<CustomImageColorOverride imageId={mockImageId} />);

    const toggle = screen.getByRole("switch");
    fireEvent.click(toggle); // Turn off

    const storedOverride = getColorOverride(mockImageId);
    expect(storedOverride).toBeNull();
  });

  it("should load existing override on mount", () => {
    const uniformResult: ColorAnalysisResult = {
      dominantColor: "#333333",
      uniformity: 0.85,
      hasUniformColor: true,
      pixelCount: 100,
    };

    storeColorAnalysis(mockImageId, uniformResult);
    storeColorOverride(mockImageId, "#ff0000");

    render(<CustomImageColorOverride imageId={mockImageId} />);

    // Toggle should be on
    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAttribute("data-state", "checked");

    // Color picker should be visible
    expect(screen.getByText("New Color")).toBeInTheDocument();
  });

  it("should re-read analysis when analysisKey changes", () => {
    const { rerender } = render(
      <CustomImageColorOverride imageId={mockImageId} analysisKey={0} />
    );

    // Initially no analysis, should not render
    expect(screen.queryByText("Color Override")).not.toBeInTheDocument();

    // Store analysis
    const uniformResult: ColorAnalysisResult = {
      dominantColor: "#444444",
      uniformity: 0.9,
      hasUniformColor: true,
      pixelCount: 50,
    };
    storeColorAnalysis(mockImageId, uniformResult);

    // Rerender with new key to trigger re-read
    rerender(
      <CustomImageColorOverride imageId={mockImageId} analysisKey={1} />
    );

    // Now should render
    expect(screen.getByText("Color Override")).toBeInTheDocument();
  });

  it("should display detected color swatch", () => {
    const uniformResult: ColorAnalysisResult = {
      dominantColor: "#ff5500",
      uniformity: 0.82,
      hasUniformColor: true,
      pixelCount: 75,
    };

    storeColorAnalysis(mockImageId, uniformResult);

    render(<CustomImageColorOverride imageId={mockImageId} />);

    // Check for the color swatch element with correct background
    const colorSwatch = document.querySelector(
      '[style*="background-color: rgb(255, 85, 0)"]'
    );
    expect(colorSwatch).toBeInTheDocument();
  });

  it("should show explanation text", () => {
    const uniformResult: ColorAnalysisResult = {
      dominantColor: "#00ffff",
      uniformity: 0.78,
      hasUniformColor: true,
      pixelCount: 60,
    };

    storeColorAnalysis(mockImageId, uniformResult);

    render(<CustomImageColorOverride imageId={mockImageId} />);

    expect(
      screen.getByText(/This PNG has a uniform color that can be replaced/)
    ).toBeInTheDocument();
  });

  it("should handle reset to original correctly", () => {
    const uniformResult: ColorAnalysisResult = {
      dominantColor: "#112233",
      uniformity: 0.88,
      hasUniformColor: true,
      pixelCount: 45,
    };

    storeColorAnalysis(mockImageId, uniformResult);
    storeColorOverride(mockImageId, "#ffffff");

    const handleOverrideChange = vi.fn();

    render(
      <CustomImageColorOverride
        imageId={mockImageId}
        onOverrideChange={handleOverrideChange}
      />
    );

    // Click reset button
    const resetButton = screen.getByText("Reset to original");
    fireEvent.click(resetButton);

    // Should call with null
    expect(handleOverrideChange).toHaveBeenCalledWith(null);

    // Toggle should be off
    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAttribute("data-state", "unchecked");

    // Override should be removed from storage
    expect(getColorOverride(mockImageId)).toBeNull();
  });
});
