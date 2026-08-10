import { describe, it, expect } from "vitest";

import LandingLayout, { metadata } from "./layout";
import { render } from "@testing-library/react";

describe("LandingLayout metadata", () => {
  it("title is not the bare word 'Home'", () => {
    expect(metadata.title).not.toBe("Home");
  });

  it("title contains brand context", () => {
    expect(String(metadata.title)).toContain("LiveListen");
  });

  it("description is present", () => {
    expect(metadata.description).toBeTruthy();
  });
});

describe("LandingLayout component", () => {
  it("renders children without throwing", () => {
    expect(() =>
      render(<LandingLayout><div>child</div></LandingLayout>)
    ).not.toThrow();
  });
});
