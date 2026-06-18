import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mockRedirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  })
);
vi.mock("next/navigation", () => ({ redirect: mockRedirect }));

const mockGetUser = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mockGetUser } }),
}));

import DeveloperLayout from "./layout";

describe("DeveloperLayout", () => {
  beforeEach(() => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    mockRedirect.mockClear();
    mockGetUser.mockReset();
  });

  it("redirects an unauthenticated user to /login?next=/developer", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    await expect(
      DeveloperLayout({ children: <div>secret</div> })
    ).rejects.toThrow("REDIRECT:/login?next=/developer");
  });

  it("redirects a non-admin user to /landing", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { email: "user@example.com" } },
    });

    await expect(
      DeveloperLayout({ children: <div>secret</div> })
    ).rejects.toThrow("REDIRECT:/landing");
  });

  it("renders children for an admin user", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { email: "admin@example.com" } },
    });

    const result = await DeveloperLayout({
      children: <div data-testid="child">dashboard</div>,
    });
    render(result);

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
