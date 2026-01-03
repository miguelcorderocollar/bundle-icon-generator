import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ColorPicker } from "../ColorPicker";

// Mock the color-history module
vi.mock("../../utils/color-history", () => ({
  getRecentColors: vi.fn().mockReturnValue(["#ff0000", "#00ff00", "#0000ff"]),
  addColorToHistory: vi.fn(),
}));

// Mock the debounce hook to return value immediately for testing
vi.mock("../../hooks/use-debounced-value", () => ({
  useDebouncedValue: vi.fn((value: string) => value),
}));

describe("ColorPicker", () => {
  const defaultProps = {
    id: "test-color",
    label: "Test Color",
    value: "#ffffff",
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders label", () => {
    render(<ColorPicker {...defaultProps} />);
    expect(screen.getByText("Test Color")).toBeInTheDocument();
  });

  it("renders color input with correct value", () => {
    render(<ColorPicker {...defaultProps} value="#ff0000" />);
    const colorInput = screen.getByRole("textbox");
    expect(colorInput).toHaveValue("#ff0000");
  });

  it("renders native color picker", () => {
    const { container } = render(<ColorPicker {...defaultProps} />);
    const colorPicker = container.querySelector('input[type="color"]');
    expect(colorPicker).toBeInTheDocument();
    expect(colorPicker).toHaveValue("#ffffff");
  });

  it("calls onChange when hex input changes", async () => {
    const onChange = vi.fn();
    render(<ColorPicker {...defaultProps} onChange={onChange} />);

    const hexInput = screen.getByRole("textbox");
    await userEvent.clear(hexInput);
    await userEvent.type(hexInput, "#abcdef");

    // onChange is called for each character
    expect(onChange).toHaveBeenCalled();
  });

  it("calls onChange when color picker changes", () => {
    const onChange = vi.fn();
    const { container } = render(<ColorPicker {...defaultProps} onChange={onChange} />);

    const colorPicker = container.querySelector('input[type="color"]') as HTMLInputElement;
    fireEvent.change(colorPicker, { target: { value: "#00ff00" } });

    expect(onChange).toHaveBeenCalledWith("#00ff00");
  });

  it("renders recent colors when colorType is provided", () => {
    render(<ColorPicker {...defaultProps} colorType="background" />);
    expect(screen.getByText("Recent colors")).toBeInTheDocument();
  });

  it("does not render recent colors when colorType is not provided", () => {
    render(<ColorPicker {...defaultProps} />);
    expect(screen.queryByText("Recent colors")).not.toBeInTheDocument();
  });

  it("renders recent color buttons", () => {
    render(<ColorPicker {...defaultProps} colorType="background" />);
    
    // Should have buttons for the mocked recent colors
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(3); // 3 mocked recent colors
  });

  it("calls onChange when recent color is clicked", async () => {
    const onChange = vi.fn();
    render(<ColorPicker {...defaultProps} onChange={onChange} colorType="background" />);

    const recentColorButtons = screen.getAllByRole("button");
    await userEvent.click(recentColorButtons[0]);

    expect(onChange).toHaveBeenCalledWith("#ff0000");
  });

  it("shows info tooltip when isCustomSvg is true", () => {
    render(<ColorPicker {...defaultProps} isCustomSvg />);
    // The Info icon should be rendered
    const infoIcon = document.querySelector(".lucide-info");
    expect(infoIcon).toBeInTheDocument();
  });

  it("does not show info tooltip when isCustomSvg is false", () => {
    render(<ColorPicker {...defaultProps} isCustomSvg={false} />);
    const infoIcon = document.querySelector(".lucide-info");
    expect(infoIcon).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <ColorPicker {...defaultProps} className="my-custom-class" />
    );
    expect(container.firstChild).toHaveClass("my-custom-class");
  });

  it("validates hex input - rejects invalid characters", async () => {
    const onChange = vi.fn();
    render(<ColorPicker {...defaultProps} onChange={onChange} value="" />);

    const hexInput = screen.getByRole("textbox");
    await userEvent.type(hexInput, "xyz");

    // onChange should not be called for invalid characters
    expect(onChange).not.toHaveBeenCalledWith("xyz");
  });

  it("allows valid hex input", async () => {
    const onChange = vi.fn();
    render(<ColorPicker {...defaultProps} onChange={onChange} value="" />);

    const hexInput = screen.getByRole("textbox");
    await userEvent.type(hexInput, "#");

    expect(onChange).toHaveBeenCalledWith("#");
  });

  it("has proper accessibility labels for recent colors", () => {
    render(<ColorPicker {...defaultProps} colorType="background" />);

    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button).toHaveAttribute("aria-label");
    });
  });
});

