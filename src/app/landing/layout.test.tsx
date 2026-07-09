import { describe, it, expect } from "vitest";
import { metadata } from "./layout";

describe("landing layout metadata", () => {
  it("title is not the bare word 'Home'", () => {
    expect(metadata.title).not.toBe("Home");
  });

  it("title contains brand context", () => {
    expect(String(metadata.title).toLowerCase()).toContain("livelisten");
  });
});
