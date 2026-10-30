import { describe, expect, it } from "vitest";

import { demoRoleFor, isStaff, isSuperAdmin } from "./roles";

describe("roles", () => {
  it("lets only staff into the admin console", () => {
    expect(isStaff("ADMIN")).toBe(true);
    expect(isStaff("SUPER_ADMIN")).toBe(true);
    expect(isStaff("PRODUCER")).toBe(false);
    expect(isStaff("VIEWER")).toBe(false);
    expect(isStaff(undefined)).toBe(false);
  });
  it("keeps super admin powers to the super admin", () => {
    expect(isSuperAdmin("SUPER_ADMIN")).toBe(true);
    expect(isSuperAdmin("ADMIN")).toBe(false);
  });
  it("picks the demo role from the email", () => {
    expect(demoRoleFor("admin@koncavecinema.com")).toBe("SUPER_ADMIN");
    expect(demoRoleFor(" Staff@Example.com ")).toBe("ADMIN");
    expect(demoRoleFor("producer@studio.ng")).toBe("PRODUCER");
    expect(demoRoleFor("ada@example.com")).toBe("VIEWER");
    expect(demoRoleFor("administrator@example.com")).toBe("VIEWER");
  });
});
