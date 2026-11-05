import { act, renderHook, waitFor } from "@testing-library/react";
import { withNuqsTestingAdapter, type UrlUpdateEvent } from "nuqs/adapters/testing";
import { describe, expect, it } from "vitest";

import { usePagination } from "./use-pagination";

function setup(searchParams = "") {
  const updates: UrlUpdateEvent[] = [];
  const { result } = renderHook(() => usePagination(), {
    wrapper: withNuqsTestingAdapter({
      searchParams,
      hasMemory: true,
      rateLimitFactor: 0,
      onUrlUpdate: (event) => updates.push(event),
    }),
  });
  return { result, lastUrl: () => updates.at(-1)?.queryString ?? searchParams };
}

describe("usePagination", () => {
  it("asks for the API's defaults when the address says nothing", () => {
    const { result } = setup();
    expect(result.current.query).toEqual({ page: 1, pageSize: 20 });
  });

  it("reads the page and size from the address", () => {
    const { result } = setup("?page=3&pageSize=50");
    expect(result.current.query).toEqual({ page: 3, pageSize: 50 });
  });

  it("only takes the sizes on offer, and never a page below 1", () => {
    expect(setup("?pageSize=25").result.current.pageSize).toBe(20);
    expect(setup("?pageSize=500").result.current.pageSize).toBe(20);
    expect(setup("?page=0").result.current.page).toBe(1);
  });

  it("starts again from page 1 at a new size, and keeps defaults out of the address", async () => {
    const { result, lastUrl } = setup("?page=4");
    act(() => result.current.setPageSize(50));
    await waitFor(() => expect(lastUrl()).toBe("?pageSize=50"));
    expect(result.current.query).toEqual({ page: 1, pageSize: 50 });
    act(() => result.current.setPageSize(20));
    await waitFor(() => expect(lastUrl()).toBe(""));
  });

  it("goes to a page, and back to the first for a new search", async () => {
    const { result, lastUrl } = setup();
    act(() => result.current.setPage(2));
    await waitFor(() => expect(lastUrl()).toBe("?page=2"));
    act(() => result.current.resetPage());
    await waitFor(() => expect(lastUrl()).toBe(""));
  });
});
