import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { AdminMember } from "@/api/admin/members-schemas";

import { TwoFactorSignIn } from "./member-details-page";

const mutateAsync = vi.fn(() => Promise.resolve({ id: "u1", twoFactorEnabled: false }));
vi.mock(import("@/api/admin/members-api"), async (original) => ({
  ...(await original()),
  // Only what the control uses of the mutation
  useResetMemberTwoFactor: () => ({ mutateAsync }) as never,
}));

const member = (twoFactorEnabled: boolean) =>
  ({
    id: "u1",
    email: "ada@example.com",
    publicScreenAlias: "Ada",
    twoFactorEnabled,
  }) as AdminMember;

describe("resetting a member's two-factor sign-in", () => {
  it("offers the reset only while two-factor sign-in is on", () => {
    const { rerender } = render(<TwoFactorSignIn member={member(false)} />);
    expect(screen.getByText("Off")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reset two-factor" })).not.toBeInTheDocument();

    rerender(<TwoFactorSignIn member={member(true)} />);
    expect(screen.getByText("On")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset two-factor" })).toBeInTheDocument();
  });

  it("asks for a reason before turning it off, and sends it", async () => {
    const user = userEvent.setup();
    render(<TwoFactorSignIn member={member(true)} />);
    await user.click(screen.getByRole("button", { name: "Reset two-factor" }));

    const confirm = screen.getByRole("button", { name: "Turn off two-factor" });
    expect(confirm).toBeDisabled();
    await user.type(screen.getByLabelText("Reason (audit log only)"), "Lost phone, ID checked");
    await user.click(confirm);
    expect(mutateAsync).toHaveBeenCalledWith({ id: "u1", reason: "Lost phone, ID checked" });
  });
});
