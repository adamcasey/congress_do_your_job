import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SearchBar } from "@/components/ui/SearchBar";

describe("SearchBar", () => {
  it("renders the input with placeholder", () => {
    render(<SearchBar value="" onChange={vi.fn()} placeholder="Search here…" />);
    expect(screen.getByPlaceholderText("Search here…")).toBeInTheDocument();
  });

  it("renders a visible label when provided", () => {
    render(<SearchBar value="" onChange={vi.fn()} label="Search legislation" id="leg-search" />);
    expect(screen.getByLabelText("Search legislation")).toBeInTheDocument();
  });

  it("renders sr-only label when labelClassName includes sr-only", () => {
    render(
      <SearchBar
        value=""
        onChange={vi.fn()}
        label="Hidden label"
        labelClassName="sr-only"
        id="hidden-label-input"
      />
    );
    const label = screen.getByText("Hidden label");
    expect(label).toHaveClass("sr-only");
  });

  it("calls onChange with the new value when user types", () => {
    const handleChange = vi.fn();
    render(<SearchBar value="" onChange={handleChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "climate" } });
    expect(handleChange).toHaveBeenCalledWith("climate");
  });

  it("shows the clear button when value is non-empty", () => {
    render(<SearchBar value="foo" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Clear search" })).toBeInTheDocument();
  });

  it("hides the clear button when value is empty", () => {
    render(<SearchBar value="" onChange={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument();
  });

  it("calls onChange with empty string when clear button is clicked", () => {
    const handleChange = vi.fn();
    render(<SearchBar value="foo" onChange={handleChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(handleChange).toHaveBeenCalledWith("");
  });

  it("shows loading spinner and hides clear button when isLoading is true", () => {
    render(<SearchBar value="foo" onChange={vi.fn()} isLoading={true} />);
    expect(screen.getByLabelText("Loading")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument();
  });

  it("hides loading spinner when isLoading is false", () => {
    render(<SearchBar value="" onChange={vi.fn()} isLoading={false} />);
    expect(screen.queryByLabelText("Loading")).not.toBeInTheDocument();
  });

  it("disables the input when disabled prop is true", () => {
    render(<SearchBar value="" onChange={vi.fn()} disabled={true} />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("calls onFocus when input is focused", () => {
    const handleFocus = vi.fn();
    render(<SearchBar value="" onChange={vi.fn()} onFocus={handleFocus} />);
    fireEvent.focus(screen.getByRole("textbox"));
    expect(handleFocus).toHaveBeenCalledTimes(1);
  });

  it("uses a stable generated id when id prop is omitted", () => {
    render(<SearchBar value="" onChange={vi.fn()} label="Auto id" />);
    const label = screen.getByText("Auto id");
    const inputId = label.getAttribute("for");
    expect(inputId).toBeTruthy();
    const input = document.getElementById(inputId!);
    expect(input).not.toBeNull();
  });
});
