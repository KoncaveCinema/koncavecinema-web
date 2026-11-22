import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api";
import type { UserProfile } from "@/api/auth/auth-schemas";
import { resendEmailCode, signInWithCode, verifyEmail } from "@/api/auth/auth-api";
import { RequireStaff } from "@/features/admin/require-staff";

import { ConfirmEmailRedirect } from "./confirm-email-redirect";
import { useSession } from "./session";
import { TwoFactorStep } from "./two-factor-step";
import { VerifyEmailForm } from "./verify-email-form";

vi.mock("@/api/auth/auth-api", () => ({
  signInWithCode: vi.fn(),
  verifyEmail: vi.fn(),
  resendEmailCode: vi.fn(),
  beginTwoFactorSetup: vi.fn(),
  enableTwoFactor: vi.fn(),
  disableTwoFactor: vi.fn(),
  getProfile: vi.fn(),
}));

let pathname = "/movies";
let search = "email=ada%40example.com&next=%2Fcheckout%2Ft1";
const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams(search),
}));

const person = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  id: "u1",
  email: "ada@example.com",
  publicScreenAlias: null,
  isPhoneVerified: false,
  role: "VIEWER",
  emailVerified: true,
  twoFactorEnabled: false,
  createdAt: "2026-09-22T18:00:00.000Z",
  aliasChangeableAt: null,
  ...overrides,
});
const refusal = (code: string, status = 400) => new ApiError({ status, code, messages: [code] });
const challenge = { twoFactorRequired: true as const, challengeToken: "c1", expiresIn: 300 };

afterEach(() => {
  vi.clearAllMocks();
  pathname = "/movies";
  search = "email=ada%40example.com&next=%2Fcheckout%2Ft1";
  useSession.setState({ status: "loading", user: null, signedOutByChoice: false });
});

/** Types six digits into the code boxes */
const typeCode = (code: string) =>
  fireEvent.change(screen.getByRole("textbox"), { target: { value: code } });

describe("the two-factor step", () => {
  it("signs in with the app's code", async () => {
    vi.mocked(signInWithCode).mockResolvedValue(person({ twoFactorEnabled: true }));
    const onSignedIn = vi.fn();
    render(<TwoFactorStep challenge={challenge} onSignedIn={onSignedIn} onRestart={vi.fn()} />);
    typeCode("482913");
    await waitFor(() => expect(onSignedIn).toHaveBeenCalled());
    expect(signInWithCode).toHaveBeenCalledWith("c1", "482913");
  });

  it("says a wrong code is wrong, and sends an expired challenge back to the password", async () => {
    vi.mocked(signInWithCode).mockRejectedValueOnce(refusal("TWO_FACTOR_CODE_INVALID", 401));
    const onRestart = vi.fn();
    render(<TwoFactorStep challenge={challenge} onSignedIn={vi.fn()} onRestart={onRestart} />);
    typeCode("111111");
    expect(await screen.findByText(/That code isn't right/)).toBeInTheDocument();

    vi.mocked(signInWithCode).mockRejectedValueOnce(refusal("TWO_FACTOR_CHALLENGE_INVALID", 401));
    typeCode("222222");
    await waitFor(() => expect(onRestart).toHaveBeenCalledWith(expect.stringMatching(/5 minutes/)));
  });

  it("takes a recovery code instead", async () => {
    vi.mocked(signInWithCode).mockResolvedValue(person());
    render(<TwoFactorStep challenge={challenge} onSignedIn={vi.fn()} onRestart={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Use a recovery code instead" }));
    fireEvent.change(screen.getByLabelText("Recovery code"), { target: { value: "K7M2P-X9Q4R" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(signInWithCode).toHaveBeenCalledWith("c1", "K7M2P-X9Q4R"));
  });
});

describe("confirming the email address", () => {
  it("signs the member in with the emailed code and goes on to where they were going", async () => {
    vi.mocked(verifyEmail).mockResolvedValue({ signedIn: true, user: person() });
    render(<VerifyEmailForm />);
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    typeCode("482913");
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/checkout/t1"));
    expect(verifyEmail).toHaveBeenCalledWith("ada@example.com", "482913");
  });

  it("sends a fresh code once on arrival from sign-in, then stops asking", async () => {
    search = "email=ada%40example.com&next=%2Fdashboard&send=1";
    vi.mocked(resendEmailCode).mockResolvedValue({
      message: "A new code is on its way.",
      retryAfterSeconds: 60,
    });
    render(<VerifyEmailForm />);
    expect(await screen.findByText("A new code is on its way.")).toBeInTheDocument();
    expect(resendEmailCode).toHaveBeenCalledOnce();
    expect(replace).toHaveBeenCalledWith("/verify-email?email=ada%40example.com&next=%2Fdashboard");
  });

  it("offers a new code when this one has expired", async () => {
    vi.mocked(verifyEmail).mockRejectedValue(refusal("OTP_EXPIRED"));
    render(<VerifyEmailForm />);
    typeCode("482913");
    expect(await screen.findByText(/This code has expired/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send a new code" })).toBeEnabled();
  });

  it("sends a member who hasn't confirmed to the code step, coming back to the page", () => {
    pathname = "/dashboard";
    act(() => useSession.getState().setUser(person({ emailVerified: false })));
    render(<ConfirmEmailRedirect />);
    expect(replace).toHaveBeenCalledWith(
      "/verify-email?email=ada%40example.com&next=%2Fdashboard%3Femail%3Dada%2540example.com%26next%3D%252Fcheckout%252Ft1&send=1",
    );
  });

  it("leaves a confirmed member where they are", () => {
    act(() => useSession.getState().setUser(person()));
    render(<ConfirmEmailRedirect />);
    expect(replace).not.toHaveBeenCalled();
  });
});

describe("the staff console", () => {
  it("asks staff without two-factor sign-in to set it up before anything else", () => {
    act(() => useSession.getState().setUser(person({ role: "ADMIN" })));
    render(
      <RequireStaff>
        <p>Overview</p>
      </RequireStaff>,
    );
    expect(
      screen.getByText(/Set up two-factor sign-in to use the admin tools/),
    ).toBeInTheDocument();
    expect(screen.queryByText("Overview")).not.toBeInTheDocument();
  });

  it("opens for staff with it on", () => {
    act(() => useSession.getState().setUser(person({ role: "ADMIN", twoFactorEnabled: true })));
    render(
      <RequireStaff>
        <p>Overview</p>
      </RequireStaff>,
    );
    expect(screen.getByText("Overview")).toBeInTheDocument();
  });
});
