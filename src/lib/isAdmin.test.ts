import { describe, it, expect, afterEach } from "vitest";
import { isAdmin } from "./isAdmin";

describe("isAdmin", () => {
  const originalAdminEmails = process.env.ADMIN_EMAILS;

  afterEach(() => {
    if (originalAdminEmails === undefined) {
      delete process.env.ADMIN_EMAILS;
    } else {
      process.env.ADMIN_EMAILS = originalAdminEmails;
    }
  });

  it("matches case-insensitively", () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    expect(isAdmin("ADMIN@EXAMPLE.COM")).toBe(true);
  });

  it("trims whitespace from both the list entries and the candidate email", () => {
    process.env.ADMIN_EMAILS = "  admin@example.com  ,other@example.com";
    expect(isAdmin("  admin@example.com  ")).toBe(true);
  });

  it("parses a comma-separated list and matches any entry", () => {
    process.env.ADMIN_EMAILS = "a@example.com, admin@example.com, b@example.com";
    expect(isAdmin("admin@example.com")).toBe(true);
    expect(isAdmin("a@example.com")).toBe(true);
    expect(isAdmin("b@example.com")).toBe(true);
  });

  it("returns false when ADMIN_EMAILS is empty", () => {
    process.env.ADMIN_EMAILS = "";
    expect(isAdmin("admin@example.com")).toBe(false);
  });

  it("returns false when ADMIN_EMAILS is unset", () => {
    delete process.env.ADMIN_EMAILS;
    expect(isAdmin("admin@example.com")).toBe(false);
  });

  it("returns false for a non-admin email", () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    expect(isAdmin("user@example.com")).toBe(false);
  });

  it("returns false for null/undefined/empty input", () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
    expect(isAdmin("")).toBe(false);
  });
});
