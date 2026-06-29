import { vi, describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageNav } from "./PageNav";

const { mockPush, mockPathname, auth } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockPathname: vi.fn(() => "/landing"),
  auth: { user: null as { email?: string } | null, loading: false },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname(),
}));

vi.mock("@/lib/useUser", () => ({
  useUser: () => ({ user: auth.user, loading: auth.loading }),
  useSignOut: () => vi.fn(),
}));

describe("PageNav", () => {
  it("marks the tab matching the current route with aria-current=page", () => {
    mockPathname.mockReturnValue("/artists");
    render(<PageNav />);

    expect(screen.getByRole("button", { name: "Artists" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Discover" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("button", { name: "Performances" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("button", { name: "Venues" })).not.toHaveAttribute("aria-current");
  });

  it("treats /artist/[name] detail pages as the Artists tab", () => {
    mockPathname.mockReturnValue("/artist/some-artist");
    render(<PageNav />);

    expect(screen.getByRole("button", { name: "Artists" })).toHaveAttribute("aria-current", "page");
  });

  it("treats /search as the Performances tab", () => {
    mockPathname.mockReturnValue("/search");
    render(<PageNav />);

    expect(screen.getByRole("button", { name: "Performances" })).toHaveAttribute("aria-current", "page");
  });

  it("falls back to the Discover tab for unmatched routes", () => {
    mockPathname.mockReturnValue("/some-unmatched-route");
    render(<PageNav />);

    expect(screen.getByRole("button", { name: "Discover" })).toHaveAttribute("aria-current", "page");
  });
});
