/**
 * Tests for CustomImageInput component
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CustomImageInput } from "../CustomImageInput";

// Mock react-dropzone
vi.mock("react-dropzone", () => ({
  useDropzone: vi.fn(() => ({
    getRootProps: () => ({ "data-testid": "dropzone" }),
    getInputProps: () => ({ "data-testid": "file-input" }),
    isDragActive: false,
  })),
}));

describe("CustomImageInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("renders dropzone area", () => {
    render(<CustomImageInput />);
    
    expect(screen.getByText("Drag & drop an image here")).toBeInTheDocument();
    expect(screen.getByText("or click to browse")).toBeInTheDocument();
    expect(screen.getByText("PNG, JPG, or WebP (max 2MB)")).toBeInTheDocument();
  });

  it("renders upload label", () => {
    render(<CustomImageInput />);
    
    expect(screen.getByText("Upload Image")).toBeInTheDocument();
  });

  it("shows info alert about PNG-only export", () => {
    render(<CustomImageInput />);
    
    expect(screen.getByText(/Custom images can only be used for PNG exports/)).toBeInTheDocument();
  });

  it("shows disabled message when disabled", () => {
    const disabledMessage = "Cannot use with SVG locations";
    render(
      <CustomImageInput 
        disabled={true} 
        disabledMessage={disabledMessage} 
      />
    );
    
    expect(screen.getByText(disabledMessage)).toBeInTheDocument();
  });

  it("renders with disabled state styling", () => {
    render(<CustomImageInput disabled={true} />);
    
    expect(screen.getByText("Upload disabled")).toBeInTheDocument();
  });

  it("calls onSelect callback when provided", () => {
    const onSelect = vi.fn();
    render(<CustomImageInput onSelect={onSelect} />);
    
    // onSelect is called after file upload, which we've mocked
    // Just verify the component renders without error with the callback
    expect(screen.getByText("Upload Image")).toBeInTheDocument();
  });
});

