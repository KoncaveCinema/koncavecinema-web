import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, ErrorCode } from "@/api";
import { updateScreenAlias } from "@/api/auth/auth-api";
import type { UserProfile } from "@/api/auth/auth-schemas";

import { IdentityCheck } from "./identity-check";
import { ScreenAliasForm } from "./screen-alias-form";
import { useSession } from "./session";

vi.mock("@/api/auth/auth-api", () => ({
  updateScreenAlias: vi.fn(),
  sendIdentityCode: vi.fn(),
  verifyIdentity: vi.fn(),
}));

const save = vi.mocked(updateScreenAlias);

const member = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  id: "u1",
  email: "ada@example.com",
  publicScreenAlias: null,
  isPhoneVerified: false,
  role: "VIEWER",
  createdAt: "2026-09-22T18:00:00.000Z",
  aliasChangeableAt: null,
  ...overrides,
});

function renderForm(onSaved = vi.fn()) {
  render(
    <ScreenAliasForm
      id="alias"
      submitLabel="Take my seat"
      help="Shown to your host."
      onSaved={onSaved}
    />,
  );
  return {
    onSaved,
    field: screen.getByLabelText("Screen alias"),
    button: screen.getByRole("button"),
  };
}

describe("the screen alias form", () => {
  beforeEach(() => useSession.setState({ status: "signed-in", user: member() }));
  afterEach(() => save.mockReset());

  it("lets a member without the identity check choose a first alias", async () => {
    const saved = member({ publicScreenAlias: "Ada_Watches" });
    save.mockResolvedValue(saved);
    const { onSaved, field, button } = renderForm();

    await userEvent.type(field, "Ada_Watches");
    await userEvent.click(button);

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(saved));
    expect(save).toHaveBeenCalledWith("Ada_Watches");
    expect(useSession.getState().user?.publicScreenAlias).toBe("Ada_Watches");
  });

  it("can be edited again straight after a first alias is saved", async () => {
    save.mockImplementation(async (alias) => member({ publicScreenAlias: alias }));
    const { field, button } = renderForm();

    await userEvent.type(field, "Ada_Watches");
    await userEvent.click(button);
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    await waitFor(() => expect(button).toBeDisabled());

    await userEvent.type(field, "_01");
    expect(button).toBeEnabled();
  });

  it("refuses a malformed alias before asking the API", async () => {
    const { field, button } = renderForm();

    await userEvent.type(field, "ada lovelace");
    await userEvent.click(button);

    expect(await screen.findByText("Letters, numbers, underscores and hyphens only")).toBeVisible();
    expect(save).not.toHaveBeenCalled();
  });

  it("explains an alias someone else uses, and one changed too soon", async () => {
    const { field, button } = renderForm();
    save.mockRejectedValueOnce(
      new ApiError({ status: 409, code: ErrorCode.ALIAS_TAKEN, messages: ["taken"] }),
    );
    await userEvent.type(field, "Ada_Watches");
    await userEvent.click(button);
    expect(await screen.findByText("Someone already uses that alias. Try another.")).toBeVisible();

    save.mockRejectedValueOnce(
      new ApiError({
        status: 409,
        code: ErrorCode.ALIAS_CHANGE_TOO_SOON,
        messages: ["too soon"],
        details: { nextChangeAt: "2026-12-11T09:00:00.000Z" },
      }),
    );
    await userEvent.type(field, "2");
    await userEvent.click(button);
    expect(await screen.findByText(/change it again on 11 Dec 2026/)).toBeVisible();
  });

  it("is locked until the API's date after a change", () => {
    useSession.setState({
      user: member({ publicScreenAlias: "Ada", aliasChangeableAt: "2099-01-01T00:00:00.000Z" }),
    });
    const { field } = renderForm();
    expect(field).toBeDisabled();
  });
});

describe("the identity check", () => {
  it("keeps a member's alias instead of asking for it again", () => {
    useSession.setState({
      status: "signed-in",
      user: member({ publicScreenAlias: "Ada_Watches" }),
    });
    render(<IdentityCheck onVerified={vi.fn()} />);
    expect(screen.getByText(/You’ll appear as Ada_Watches/)).toBeVisible();
    expect(screen.queryByLabelText("Screen alias")).toBeNull();
  });

  it("asks a member without an alias to choose one", () => {
    useSession.setState({ status: "signed-in", user: member() });
    render(<IdentityCheck onVerified={vi.fn()} />);
    expect(screen.getByLabelText("Screen alias")).toBeInTheDocument();
  });
});
