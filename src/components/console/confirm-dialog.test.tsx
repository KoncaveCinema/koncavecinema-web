import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ConfirmDialog } from "./confirm-dialog";

describe("ConfirmDialog", () => {
  it("keeps the confirm button disabled until the reason is valid", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn(() => Promise.resolve());
    render(
      <ConfirmDialog
        open
        onOpenChange={() => {}}
        title="Cancel the screening?"
        confirmLabel="Cancel screening"
        reason={{ label: "Reason", min: 5, max: 500 }}
        onConfirm={onConfirm}
      />,
    );
    const confirm = screen.getByRole("button", { name: "Cancel screening" });

    // Disabled from the moment it opens, with no error shown before the field is touched
    expect(confirm).toBeDisabled();
    expect(screen.queryByText("Write at least 5 characters.")).toBeNull();

    await user.type(screen.getByLabelText("Reason"), "Too");
    expect(confirm).toBeDisabled();

    await user.type(screen.getByLabelText("Reason"), " short a notice");
    expect(confirm).toBeEnabled();
    await user.click(confirm);
    expect(onConfirm).toHaveBeenCalledWith("Too short a notice");
  });
});
