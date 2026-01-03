import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "../EmptyState";

describe("EmptyState", () => {
  it("renders title", () => {
    render(<EmptyState title="No results" />);
    expect(screen.getByText("No results")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <EmptyState
        title="No results"
        description="Try a different search query"
      />
    );
    expect(screen.getByText("Try a different search query")).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    render(<EmptyState title="No results" />);
    expect(screen.queryByText("Try a different search query")).not.toBeInTheDocument();
  });

  it("renders icon when provided", () => {
    render(
      <EmptyState
        title="No results"
        icon={<span data-testid="custom-icon">Icon</span>}
      />
    );
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <EmptyState title="No results" className="my-custom-class" />
    );
    expect(container.firstChild).toHaveClass("my-custom-class");
  });

  it("has correct semantic structure", () => {
    render(
      <EmptyState
        title="Empty Title"
        description="Empty description text"
      />
    );
    // Title should be in an h3
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Empty Title");
  });
});

