import { describe, it, expect } from "vitest";

import robots from "./robots";

describe("robots", () => {
  it("disallows /profile, /developer, /api, and /login", () => {
    const result = robots();

    expect(result.rules).toEqual(
      expect.objectContaining({
        userAgent: "*",
        allow: "/",
        disallow: expect.arrayContaining(["/profile", "/developer", "/api", "/login"]),
      })
    );
  });
});
