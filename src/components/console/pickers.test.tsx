import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SearchSelect } from "./pickers";

// The test browser lacks what the searchable list measures and scrolls with
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Element.prototype.scrollIntoView ??= vi.fn();

const films = [
  { value: "f1", label: "Zara's Diary" },
  { value: "f2", label: "Ember & Ash" },
];

describe("SearchSelect", () => {
  it("shows placeholder rows while its options load, never an empty list", () => {
    render(
      <SearchSelect value="" onChange={vi.fn()} options={[]} loading emptyText="No film found." />,
    );
    fireEvent.click(screen.getByRole("combobox"));
    expect(screen.getByLabelText("Loading")).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText("No film found.")).not.toBeInTheDocument();
  });

  it("lists the options once they arrive", () => {
    render(<SearchSelect value="" onChange={vi.fn()} options={films} />);
    fireEvent.click(screen.getByRole("combobox"));
    expect(screen.getByText("Zara's Diary")).toBeInTheDocument();
    expect(screen.queryByLabelText("Loading")).not.toBeInTheDocument();
  });

  it("holds a choice from the link as a placeholder until its name is known", () => {
    const { rerender } = render(
      <SearchSelect value="f2" onChange={vi.fn()} options={[]} loading anyLabel="All films" />,
    );
    // Not "All films": that would claim no film is chosen
    expect(screen.queryByText("All films")).not.toBeInTheDocument();
    rerender(<SearchSelect value="f2" onChange={vi.fn()} options={films} anyLabel="All films" />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Ember & Ash");
  });
});
