import { describe, it, expect } from "vitest";

import robots from "./robots";

describe("robots", () => {
  it("disallows /profile, /developer, /api, and /login", () => {
    const result = robots();

    expect(result.rules).toEqual(
      expect.objectContaining({
        userAgent: "*",
        allow: "/",
        disallow: ["/profile", "/developer", "/api", "/login"],
      })
    );
  });

  it("includes /login in the disallowed paths", () => {
    const result = robots();
    const disallow = (result.rules as { disallow: string[] }).disallow;
    expect(disallow).toContain("/login");
  });
});
