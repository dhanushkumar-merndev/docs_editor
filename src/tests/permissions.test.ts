import { describe, expect, it } from "vitest";
import { can } from "@/lib/permissions";

describe("document permission rules", () => {
  it("allows owner to edit and share", () => {
    expect(can("owner", "read")).toBe(true);
    expect(can("owner", "edit")).toBe(true);
    expect(can("owner", "share")).toBe(true);
    expect(can("owner", "transferOwnership")).toBe(true);
  });

  it("allows editor to edit but not share", () => {
    expect(can("editor", "read")).toBe(true);
    expect(can("editor", "edit")).toBe(true);
    expect(can("editor", "share")).toBe(false);
  });

  it("allows viewer to read only", () => {
    expect(can("viewer", "read")).toBe(true);
    expect(can("viewer", "edit")).toBe(false);
  });

  it("blocks non-members", () => {
    expect(can(null, "read")).toBe(false);
    expect(can(undefined, "edit")).toBe(false);
  });
});
