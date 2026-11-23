import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api";
import type { UserProfile } from "@/api/auth/auth-schemas";
import { signIn, signInWithCode } from "@/api/auth/auth-api";
import { StaffSignInForm } from "@/features/admin/staff-sign-in";

import { SignInForm } from "./auth-forms";
import { useSession } from "./session";

/*
 * Every way through sign-in, as a person goes through it: what they see after each step, and
 * where they end up. Only the API and the browser's navigation are stand-ins.
 */

vi.mock("@/api/auth/auth-api", () => ({
  signIn: vi.fn(),
  signInWithCode: vi.fn(),
  register: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
}));

const replace = vi.fn();
const prefetch = vi.fn();
const router = { replace, prefetch, push: vi.fn() };
let search = "";
vi.mock("next/navigation", () => ({
  // One router for the page's life, as Next gives: a new one each render would re-run every effect
  useRouter: () => router,
  usePathname: () => "/login",
  useSearchParams: () => new URLSearchParams(search),
}));

const person = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  id: "u1",
  email: "ada@example.com",
  publicScreenAlias: "Ada",
  isPhoneVerified: false,
  role: "VIEWER",
  emailVerified: true,
  twoFactorEnabled: false,
  createdAt: "2026-09-22T18:00:00.000Z",
  aliasChangeableAt: null,
  ...overrides,
});
const challenge = { twoFactorRequired: true as const, challengeToken: "c1", expiresIn: 300 };

/** The address bar's `?step=`, as the page sets it */
let urlStep: string | null = null;
let history: string | undefined;
function renderAt(form: ReactNode) {
  return render(
    <NuqsTestingAdapter
      hasMemory
      onUrlUpdate={({ searchParams }) => {
        urlStep = searchParams.get("step");
      }}
    >
      {form}
    </NuqsTestingAdapter>,
  );
}

async function submitPassword(emailLabel = "Email") {
  fireEvent.change(screen.getByLabelText(emailLabel), { target: { value: "ada@example.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "S3cure!pass" } });
  fireEvent.click(screen.getByRole("button", { name: /^Sign in/ }));
}

const typeCode = (code: string) =>
  fireEvent.change(screen.getByRole("textbox"), { target: { value: code } });

// Every test starts signed out, as a visitor to the page would: none relies on another's cleanup
beforeEach(() => {
  useSession.setState({ status: "signed-out", user: null, signedOutByChoice: false });
});

afterEach(() => {
  vi.clearAllMocks();
  search = "";
  urlStep = null;
  useSession.setState({ status: "signed-out", user: null, signedOutByChoice: false });
});

describe("member sign-in", () => {
  it("goes straight to the dashboard, with no screen in between", async () => {
    vi.mocked(signIn).mockResolvedValue({ signedIn: true, user: person() });
    renderAt(<SignInForm />);
    await submitPassword();
    await waitFor(() => expect(replace).toHaveBeenLastCalledWith("/dashboard"));
    // Nothing replaced the form while the dashboard loads
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.queryByText(/Signing you in/)).not.toBeInTheDocument();
  });

  it("loads the dashboard ahead, so it opens at once", () => {
    renderAt(<SignInForm />);
    expect(prefetch).toHaveBeenCalledWith("/dashboard");
  });

  it("returns to where the member was going", async () => {
    search = "next=%2Fmovies%2Fsade";
    vi.mocked(signIn).mockResolvedValue({ signedIn: true, user: person() });
    renderAt(<SignInForm />);
    await submitPassword();
    await waitFor(() => expect(replace).toHaveBeenLastCalledWith("/movies/sade"));
  });

  it("sends an unconfirmed member to the code step with a fresh code, never the dashboard", async () => {
    vi.mocked(signIn).mockResolvedValue({
      signedIn: true,
      user: person({ emailVerified: false }),
    });
    renderAt(<SignInForm />);
    await submitPassword();
    await waitFor(() => expect(replace).toHaveBeenCalled());
    for (const [to] of replace.mock.calls) {
      expect(to).toBe("/verify-email?email=ada%40example.com&next=%2Fdashboard&send=1");
    }
  });

  it("asks for the app's code at ?step=code, then signs in without the form coming back", async () => {
    vi.mocked(signIn).mockResolvedValue({ signedIn: false, challenge });
    vi.mocked(signInWithCode).mockResolvedValue(person({ twoFactorEnabled: true }));
    renderAt(<SignInForm />);
    await submitPassword();

    expect(await screen.findByText("One more step")).toBeInTheDocument();
    expect(urlStep).toBe("code");
    expect(replace).not.toHaveBeenCalled();

    typeCode("482913");
    await waitFor(() => expect(replace).toHaveBeenLastCalledWith("/dashboard"));
    // The code step stays, working, until the dashboard is up: never the password form again
    expect(screen.getByText("One more step")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Checking…" })).toBeDisabled();
    // The accepted code stays in its boxes while the dashboard loads
    expect(screen.getByRole("textbox")).toHaveValue("482913");
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
  });

  it("goes back to the password when the code step has expired", async () => {
    vi.mocked(signIn).mockResolvedValue({ signedIn: false, challenge });
    vi.mocked(signInWithCode).mockRejectedValue(
      new ApiError({ status: 401, code: "TWO_FACTOR_CHALLENGE_INVALID", messages: ["expired"] }),
    );
    renderAt(<SignInForm />);
    await submitPassword();
    expect(await screen.findByText("One more step")).toBeInTheDocument();
    typeCode("482913");
    expect(await screen.findByText(/That took more than 5 minutes/)).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(urlStep).toBeNull();
  });

  it("shows the password form when opened again later, never a spent code step", async () => {
    vi.mocked(signIn).mockResolvedValue({ signedIn: false, challenge });
    const view = renderAt(<SignInForm />);
    await submitPassword();
    expect(await screen.findByText("One more step")).toBeInTheDocument();
    view.unmount();

    // A later visit: signed out, no ?step in the address
    renderAt(<SignInForm />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.queryByText("One more step")).not.toBeInTheDocument();
  });
});

describe("a reload at the code step", () => {
  it("starts again from the password, and the address drops ?step=code", async () => {
    render(
      <NuqsTestingAdapter
        searchParams="?step=code"
        onUrlUpdate={({ searchParams, options }) => {
          urlStep = searchParams.get("step");
          history = options.history;
        }}
      >
        <SignInForm />
      </NuqsTestingAdapter>,
    );
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    await waitFor(() => expect(history).toBe("replace"));
    expect(urlStep).toBeNull();
  });
});

describe("staff sign-in", () => {
  it("opens the console after the code, with the code step on screen until it does", async () => {
    vi.mocked(signIn).mockResolvedValue({ signedIn: false, challenge });
    vi.mocked(signInWithCode).mockResolvedValue(person({ role: "ADMIN", twoFactorEnabled: true }));
    renderAt(<StaffSignInForm />);
    await submitPassword("Work email");

    expect(await screen.findByText("One more step")).toBeInTheDocument();
    typeCode("482913");
    await waitFor(() => expect(replace).toHaveBeenLastCalledWith("/admin"));
    expect(screen.getByText("One more step")).toBeInTheDocument();
    expect(screen.queryByLabelText("Work email")).not.toBeInTheDocument();
  });

  it("tells a member account it isn't a staff one", async () => {
    vi.mocked(signIn).mockResolvedValue({ signedIn: true, user: person() });
    renderAt(<StaffSignInForm />);
    await submitPassword("Work email");
    expect(await screen.findByText("This isn’t a staff account")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("opens the console at once for staff already signed in, and loads it ahead", () => {
    act(() => useSession.getState().setUser(person({ role: "ADMIN", twoFactorEnabled: true })));
    renderAt(<StaffSignInForm />);
    expect(prefetch).toHaveBeenCalledWith("/admin");
    expect(replace).toHaveBeenCalledWith("/admin");
  });
});
