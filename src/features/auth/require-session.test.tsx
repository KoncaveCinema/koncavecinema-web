import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SignInRedirect } from "./require-session";
import { useSession } from "./session";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/dashboard/tickets/t1",
  useSearchParams: () => new URLSearchParams(),
}));

afterEach(() => {
  replace.mockClear();
  useSession.setState({ status: "loading", user: null, signedOutByChoice: false });
});

describe("the sign-in redirect", () => {
  it("brings someone whose session expired back to the page they were on", () => {
    render(<SignInRedirect />);
    act(() => useSession.getState().setUser(null));
    expect(replace).toHaveBeenCalledWith("/login?next=%2Fdashboard%2Ftickets%2Ft1");
  });

  it("forgets the page after a deliberate sign-out: the next person may be someone else", () => {
    render(<SignInRedirect signInPath="/admin/login" />);
    act(() => useSession.getState().setUser(null, true));
    expect(replace).toHaveBeenCalledWith("/admin/login");
  });
});
