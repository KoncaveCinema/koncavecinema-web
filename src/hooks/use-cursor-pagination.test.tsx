import { act, renderHook, waitFor } from "@testing-library/react";
import { withNuqsTestingAdapter, type UrlUpdateEvent } from "nuqs/adapters/testing";
import { describe, expect, it } from "vitest";

import { useCursorPagination } from "./use-cursor-pagination";

function setup(searchParams = "") {
  const updates: UrlUpdateEvent[] = [];
  const { result } = renderHook(() => useCursorPagination(50), {
    wrapper: withNuqsTestingAdapter({
      searchParams,
      hasMemory: true,
      rateLimitFactor: 0,
      onUrlUpdate: (event) => updates.push(event),
    }),
  });
  return { result, lastUrl: () => updates.at(-1)?.queryString ?? searchParams };
}

describe("useCursorPagination", () => {
  it("starts on the newest page at the list's own size", () => {
    const { result } = setup();
    expect(result.current.pageIndex).toBe(1);
    expect(result.current.query).toEqual({ cursor: undefined, limit: 50 });
  });

  it("goes on from the API's cursor, and back the way it came", async () => {
    const { result, lastUrl } = setup();
    act(() => result.current.next("c1"));
    await waitFor(() => expect(result.current.query.cursor).toBe("c1"));
    act(() => result.current.next("c2"));
    await waitFor(() => expect(result.current.pageIndex).toBe(3));
    expect(result.current.query.cursor).toBe("c2");

    act(() => result.current.previous());
    await waitFor(() => expect(result.current.query.cursor).toBe("c1"));
    act(() => result.current.first());
    await waitFor(() => expect(lastUrl()).toBe(""));
    expect(result.current.pageIndex).toBe(1);
  });

  it("starts again from the newest at a new size", async () => {
    const { result, lastUrl } = setup("?after=c1,c2");
    expect(result.current.pageIndex).toBe(3);
    act(() => result.current.setPageSize(20));
    await waitFor(() => expect(lastUrl()).toBe("?pageSize=20"));
    expect(result.current.query).toEqual({ cursor: undefined, limit: 20 });
  });
});
