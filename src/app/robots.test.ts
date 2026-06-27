import { describe, it, expect } from "vitest";

import robots from "./robots";

describe("robots", () => {
  it("disallows /profile, /developer, and /api", () => {
    const result = robots();

    expect(result.rules).toEqual(
      expect.objectContaining({
        userAgent: "*",
        allow: "/",
        disallow: ["/profile", "/developer", "/api"],
      })
    );
  });
});
