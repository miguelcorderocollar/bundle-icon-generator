import * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ColorPicker } from "../ColorPicker";

const { getRecentColorsMock, addColorToHistoryMock } = vi.hoisted(() => ({
  getRecentColorsMock: vi
    .fn()
    .mockReturnValue(["#ff0000", "#00ff00", "#0000ff"]),
  addColorToHistoryMock: vi.fn(),
}));

vi.mock("@/src/utils/color-history", () => ({
  getRecentColors: getRecentColorsMock,
  addColorToHistory: addColorToHistoryMock,
}));

vi.mock("@/src/hooks/use-debounced-value", () => ({
  useDebouncedValue: vi.fn((value: string) => value),
}));

describe("ColorPicker", () => {
  const defaultProps = {
    id: "test-color",
    label: "Test Color",
    value: "#ffffff",
    onChange: vi.fn(),
  };

  const paletteColors = [
    { id: "color-1", name: "Primary", color: "#ff0000" },
    { id: "color-2", name: "Secondary", color: "#00ff00" },
    { id: "color-3", name: "Tertiary", color: "#0000ff" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    getRecentColorsMock.mockReturnValue(["#ff0000", "#00ff00", "#0000ff"]);
  });

  it("renders label when provided", () => {
    render(<ColorPicker {...defaultProps} />);
    expect(screen.getByText("Test Color")).toBeInTheDocument();
  });

  it("does not render label when omitted", () => {
    render(
      <ColorPicker id="no-label-color" value="#ffffff" onChange={vi.fn()} />
    );
    expect(screen.queryByText("Test Color")).not.toBeInTheDocument();
  });

  it("renders hex input with current value", () => {
    render(<ColorPicker {...defaultProps} value="#ff0000" />);
    expect(screen.getByRole("textbox")).toHaveValue("#ff0000");
  });

  it("renders native color input", () => {
    const { container } = render(<ColorPicker {...defaultProps} />);
    const colorInput = container.querySelector('input[type="color"]');
    expect(colorInput).toBeInTheDocument();
    expect(colorInput).toHaveValue("#ffffff");
  });

  it("shows expand button when tray content exists", () => {
    render(<ColorPicker {...defaultProps} colorType="background" />);
    expect(
      screen.getByRole("button", { name: "Show color swatches" })
    ).toBeInTheDocument();
  });

  it("does not show expand button when no tray content exists", () => {
    render(<ColorPicker {...defaultProps} />);
    expect(
      screen.queryByRole("button", { name: "Show color swatches" })
    ).not.toBeInTheDocument();
  });

  it("keeps tray collapsed by default", () => {
    render(<ColorPicker {...defaultProps} colorType="background" />);
    expect(screen.queryByText("Recent colors")).not.toBeInTheDocument();
  });

  it("expands tray and renders recent colors on toggle", async () => {
    const user = userEvent.setup();
    render(<ColorPicker {...defaultProps} colorType="background" />);

    await user.click(
      screen.getByRole("button", { name: "Show color swatches" })
    );

    expect(
      screen.getByRole("button", { name: "Select color #ff0000" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Hide color swatches" })
    ).toBeInTheDocument();
  });

  it("renders both section labels when both preset and recent groups exist", async () => {
    const user = userEvent.setup();
    render(
      <ColorPicker
        {...defaultProps}
        colorType="background"
        paletteColors={paletteColors}
      />
    );

    await user.click(
      screen.getByRole("button", { name: "Show color swatches" })
    );

    expect(screen.getByText("Preset colors")).toBeInTheDocument();
    expect(screen.getByText("Recent colors")).toBeInTheDocument();
  });

  it("hides section label when only one swatch group exists", async () => {
    const user = userEvent.setup();
    render(<ColorPicker {...defaultProps} colorType="background" />);

    await user.click(
      screen.getByRole("button", { name: "Show color swatches" })
    );

    expect(screen.queryByText("Recent colors")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Select color #ff0000" })
    ).toBeInTheDocument();
  });

  it("calls onChange when hex input changes", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ColorPicker {...defaultProps} onChange={onChange} />);

    const hexInput = screen.getByRole("textbox");
    await user.clear(hexInput);
    await user.type(hexInput, "#abcdef");

    expect(onChange).toHaveBeenCalled();
  });

  it("calls onChange when color picker changes", () => {
    const onChange = vi.fn();
    const { container } = render(
      <ColorPicker {...defaultProps} onChange={onChange} />
    );

    const colorPicker = container.querySelector(
      'input[type="color"]'
    ) as HTMLInputElement;
    fireEvent.change(colorPicker, { target: { value: "#00ff00" } });

    expect(onChange).toHaveBeenCalledWith("#00ff00");
  });

  it("keeps tray open after swatch click in uncontrolled mode", async () => {
    const user = userEvent.setup();
    render(<ColorPicker {...defaultProps} colorType="background" />);

    await user.click(
      screen.getByRole("button", { name: "Show color swatches" })
    );
    await user.click(
      screen.getByRole("button", { name: "Select color #ff0000" })
    );

    expect(
      screen.getByRole("button", { name: "Hide color swatches" })
    ).toBeInTheDocument();
  });

  it("supports controlled tray state with external expansion callback", async () => {
    const onExpandedChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ColorPicker
        {...defaultProps}
        colorType="background"
        expanded={false}
        onExpandedChange={onExpandedChange}
      />
    );

    await user.click(
      screen.getByRole("button", { name: "Show color swatches" })
    );

    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(
      screen.queryByRole("button", { name: "Select color #ff0000" })
    ).not.toBeInTheDocument();
  });

  it("lets parent close tray after swatch selection in controlled mode", async () => {
    const user = userEvent.setup();

    function ControlledPicker() {
      const [expanded, setExpanded] = React.useState(true);
      return (
        <ColorPicker
          {...defaultProps}
          colorType="background"
          expanded={expanded}
          onExpandedChange={setExpanded}
          onChange={() => setExpanded(false)}
        />
      );
    }

    render(<ControlledPicker />);

    await user.click(
      screen.getByRole("button", { name: "Select color #ff0000" })
    );

    expect(
      screen.queryByRole("button", { name: "Hide color swatches" })
    ).not.toBeInTheDocument();
  });

  it("shows info tooltip icon when isCustomSvg is true", () => {
    render(<ColorPicker {...defaultProps} isCustomSvg />);
    const infoIcon = document.querySelector(".lucide-info");
    expect(infoIcon).toBeInTheDocument();
  });

  it("does not show info tooltip icon when isCustomSvg is false", () => {
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

  it("validates hex input and rejects invalid characters", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ColorPicker {...defaultProps} onChange={onChange} value="" />);

    const hexInput = screen.getByRole("textbox");
    await user.type(hexInput, "xyz");

    expect(onChange).not.toHaveBeenCalledWith("xyz");
  });

  it("allows valid partial hex input", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ColorPicker {...defaultProps} onChange={onChange} value="" />);

    const hexInput = screen.getByRole("textbox");
    await user.type(hexInput, "#");

    expect(onChange).toHaveBeenCalledWith("#");
  });

  it("records valid full hex colors in history", async () => {
    const user = userEvent.setup();
    render(<ColorPicker {...defaultProps} colorType="background" />);

    const hexInput = screen.getByRole("textbox");
    await user.clear(hexInput);
    await user.type(hexInput, "#abcdef");

    expect(addColorToHistoryMock).toHaveBeenCalledWith("background", "#abcdef");
  });

  it("does not record non-full-hex values in history", async () => {
    const user = userEvent.setup();
    render(<ColorPicker {...defaultProps} colorType="background" />);

    const hexInput = screen.getByRole("textbox");
    await user.clear(hexInput);
    await user.type(hexInput, "#abc");

    expect(addColorToHistoryMock).not.toHaveBeenCalledWith(
      "background",
      "#abc"
    );
  });

  it("renders restricted mode with palette swatches only", () => {
    render(
      <ColorPicker
        {...defaultProps}
        paletteColors={paletteColors}
        restrictedMode
      />
    );

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Select Primary (#ff0000)" })
    ).toBeInTheDocument();
  });
});
