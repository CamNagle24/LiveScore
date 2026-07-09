import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PageNav } from "./PageNav";

const { mockPush, mockPathname, auth, mockSignOut } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockPathname: vi.fn(() => "/landing"),
  auth: { user: null as { email?: string; user_metadata?: { avatar_url?: string } } | null, loading: false },
  mockSignOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname(),
}));

vi.mock("@/lib/useUser", () => ({
  useUser: () => ({ user: auth.user, loading: auth.loading }),
  useSignOut: () => mockSignOut,
}));

beforeEach(() => {
  mockPush.mockReset();
  mockSignOut.mockReset();
  mockPathname.mockReturnValue("/landing");
  auth.user = null;
  auth.loading = false;
});

describe("PageNav — tab highlighting", () => {
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

  it("treats / (root) as the Discover tab", () => {
    mockPathname.mockReturnValue("/");
    render(<PageNav />);

    expect(screen.getByRole("button", { name: "Discover" })).toHaveAttribute("aria-current", "page");
  });

  it("falls back to the Discover tab for unmatched routes", () => {
    mockPathname.mockReturnValue("/some-unmatched-route");
    render(<PageNav />);

    expect(screen.getByRole("button", { name: "Discover" })).toHaveAttribute("aria-current", "page");
  });
});

describe("PageNav — unauthenticated state", () => {
  it("renders 'Sign up free' button when user is null", () => {
    auth.user = null;
    render(<PageNav />);

    expect(screen.getByRole("button", { name: /sign up free/i })).toBeInTheDocument();
  });

  it("'Sign up free' button navigates to /login", () => {
    auth.user = null;
    render(<PageNav />);

    fireEvent.click(screen.getByRole("button", { name: /sign up free/i }));

    expect(mockPush).toHaveBeenCalledWith("/login");
  });
});

describe("PageNav — authenticated state (account menu)", () => {
  beforeEach(() => {
    auth.user = { email: "test@example.com" };
  });

  it("renders the avatar button (not 'Sign up free') when user is authenticated", () => {
    render(<PageNav />);

    expect(screen.getByRole("button", { name: /account menu/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /sign up free/i })).not.toBeInTheDocument();
  });

  it("clicking the avatar button opens the account menu", () => {
    render(<PageNav />);

    expect(screen.queryByRole("button", { name: /sign out/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /account menu/i }));

    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });

  it("clicking the backdrop closes the account menu", () => {
    render(<PageNav />);

    fireEvent.click(screen.getByRole("button", { name: /account menu/i }));
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();

    // The overlay backdrop div is rendered as a fixed overlay; clicking it calls setMenuOpen(false)
    const backdrop = document.querySelector('div[style*="fixed"]') as HTMLElement;
    fireEvent.click(backdrop);

    expect(screen.queryByRole("button", { name: /sign out/i })).not.toBeInTheDocument();
  });

  it("clicking 'Sign out' calls the signOut function", () => {
    render(<PageNav />);

    fireEvent.click(screen.getByRole("button", { name: /account menu/i }));
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

    expect(mockSignOut).toHaveBeenCalledOnce();
  });
});

describe("PageNav — account menu focus trap", () => {
  beforeEach(() => {
    auth.user = { email: "test@example.com" };
  });

  it("Escape closes the account menu", () => {
    render(<PageNav />);
    fireEvent.click(screen.getByRole("button", { name: /account menu/i }));
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();

    const profileBtn = screen.getByRole("button", { name: /^profile$/i });
    fireEvent.keyDown(profileBtn, { key: "Escape" });

    expect(screen.queryByRole("button", { name: /sign out/i })).not.toBeInTheDocument();
  });

  it("Tab from the last menu item wraps focus to the first", () => {
    render(<PageNav />);
    fireEvent.click(screen.getByRole("button", { name: /account menu/i }));

    const profileBtn = screen.getByRole("button", { name: /^profile$/i });
    const signOutBtn = screen.getByRole("button", { name: /sign out/i });

    signOutBtn.focus();
    fireEvent.keyDown(signOutBtn, { key: "Tab" });

    expect(profileBtn).toHaveFocus();
  });

  it("Shift+Tab from the first menu item wraps focus to the last", () => {
    render(<PageNav />);
    fireEvent.click(screen.getByRole("button", { name: /account menu/i }));

    const profileBtn = screen.getByRole("button", { name: /^profile$/i });
    const signOutBtn = screen.getByRole("button", { name: /sign out/i });

    profileBtn.focus();
    fireEvent.keyDown(profileBtn, { key: "Tab", shiftKey: true });

    expect(signOutBtn).toHaveFocus();
  });
});
