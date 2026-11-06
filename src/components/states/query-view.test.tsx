import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api";

import { QueryView, type QueryLike } from "./query-view";

const notFoundError = new ApiError({ status: 404, code: "NOT_FOUND", messages: ["Not found"] });

function view(query: Partial<QueryLike<{ title: string }>>) {
  const refetch = vi.fn();
  render(
    <QueryView
      query={{ data: undefined, error: null, isPending: false, refetch, ...query }}
      loading={<p>Loading…</p>}
      errorTitle="The film couldn't load"
      notFound={{ title: "We can't find that film" }}
    >
      {(film) => <h1>{film.title}</h1>}
    </QueryView>,
  );
  return refetch;
}

describe("QueryView", () => {
  it("shows the skeleton while the record loads", () => {
    view({ isPending: true });
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("shows the record once it's there, even if a later refetch failed", () => {
    view({ data: { title: "Ember & Ash" }, error: new Error("offline") });
    expect(screen.getByRole("heading", { name: "Ember & Ash" })).toBeInTheDocument();
  });

  it("says it can't find a record the API doesn't have", () => {
    view({ error: notFoundError });
    expect(screen.getByText("We can't find that film")).toBeInTheDocument();
  });

  it("offers a retry for any other failure", () => {
    const refetch = view({ error: new Error("offline") });
    expect(screen.getByRole("alert")).toHaveTextContent("The film couldn't load");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalledOnce();
  });
});
