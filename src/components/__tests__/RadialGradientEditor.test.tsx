import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RadialGradientEditor } from "../RadialGradientEditor";
import type { RadialGradient } from "@/src/utils/gradients";

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

describe("RadialGradientEditor", () => {
  const baseGradient: RadialGradient = {
    type: "radial",
    centerX: 50,
    centerY: 50,
    radius: 50,
    stops: [
      { color: "#112233", position: 0 },
      { color: "#445566", position: 100 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    getRecentColorsMock.mockReturnValue(["#ff0000", "#00ff00", "#0000ff"]);
  });

  it("renders stop labels", () => {
    render(
      <RadialGradientEditor
        gradient={baseGradient}
        onGradientChange={vi.fn()}
      />
    );

    expect(screen.getByText("Center")).toBeInTheDocument();
    expect(screen.getByText("Edge")).toBeInTheDocument();
  });

  it("keeps only one swatch tray open at a time", async () => {
    const user = userEvent.setup();
    render(
      <RadialGradientEditor
        gradient={baseGradient}
        onGradientChange={vi.fn()}
      />
    );

    const showButtons = screen.getAllByRole("button", {
      name: "Show color swatches",
    });
    expect(showButtons).toHaveLength(2);

    await user.click(showButtons[0]);
    expect(
      screen.getAllByRole("button", { name: "Select color #ff0000" })
    ).toHaveLength(1);

    await user.click(
      screen.getByRole("button", { name: "Show color swatches" })
    );
    expect(
      screen.getAllByRole("button", { name: "Select color #ff0000" })
    ).toHaveLength(1);
  });

  it("propagates stop color changes", async () => {
    const user = userEvent.setup();
    const onGradientChange = vi.fn();
    render(
      <RadialGradientEditor
        gradient={baseGradient}
        onGradientChange={onGradientChange}
      />
    );

    const textboxes = screen.getAllByRole("textbox");
    await user.clear(textboxes[0]);
    await user.type(textboxes[0], "#abcdef");

    expect(onGradientChange).toHaveBeenCalled();
    const lastCallArg = onGradientChange.mock.calls.at(
      -1
    )?.[0] as RadialGradient;
    expect(lastCallArg.stops[0].color).toBe("#abcdef");
  });
});
