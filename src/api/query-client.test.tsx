import { QueryClientProvider, useMutation, useQuery } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { getQueryClient } from "./query-client";

describe("the refetch rule", () => {
  it("refetches what a successful write changed, and nothing else", async () => {
    const queryClient = getQueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const films = vi.fn(async () => "films");
    const profile = vi.fn(async () => "me");

    const { result } = renderHook(
      () => ({
        films: useQuery({ queryKey: ["/admin/movies", { page: 1 }], queryFn: films }),
        profile: useQuery({ queryKey: ["/auth/me"], queryFn: profile }),
        publish: useMutation({ mutationKey: ["publishMovie"], mutationFn: async () => "ok" }),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.films.isSuccess).toBe(true));
    await waitFor(() => expect(result.current.profile.isSuccess).toBe(true));

    await act(() => result.current.publish.mutateAsync());

    await waitFor(() => expect(films).toHaveBeenCalledTimes(2));
    expect(profile).toHaveBeenCalledTimes(1);
  });
});
