import { describe, it, expect } from "vitest";
import { safeNext } from "./safeNext";

describe("safeNext", () => {
  it("returns the path when it is a safe same-site path", () => {
    expect(safeNext("/profile/settings")).toBe("/profile/settings");
  });

  it("falls back when next is missing", () => {
    expect(safeNext(null)).toBe("/profile");
    expect(safeNext(undefined)).toBe("/profile");
    expect(safeNext("")).toBe("/profile");
  });

  it("falls back for protocol-relative URLs", () => {
    expect(safeNext("//evil.com")).toBe("/profile");
  });

  it("falls back for backslash-smuggled URLs", () => {
    expect(safeNext("/\\evil.com")).toBe("/profile");
  });

  it("falls back for paths not starting with /", () => {
    expect(safeNext("evil.com")).toBe("/profile");
  });

  it("supports a custom fallback", () => {
    expect(safeNext(null, "/login")).toBe("/login");
  });
});
