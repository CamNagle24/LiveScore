import { describe, it, expect } from "vitest";
import { metadata } from "./layout";

describe("LandingLayout metadata", () => {
  it("has a descriptive title (not bare 'Home')", () => {
    expect(metadata.title).not.toBe("Home");
    expect(metadata.title).toBe("LiveListen — Discover Live Performances");
  });
});
