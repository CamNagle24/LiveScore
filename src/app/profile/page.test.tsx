import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

const {
  mockPush,
  mockToggleSaved,
  mockEnsureSavedLoaded,
  auth,
  mockFrom,
  mockGetBestSource,
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockToggleSaved: vi.fn(),
  mockEnsureSavedLoaded: vi.fn(),
  auth: {
    user: null as {
      id: string;
      email: string;
      created_at?: string;
      user_metadata?: Record<string, unknown>;
    } | null,
    loading: false,
  },
  mockFrom: vi.fn(),
  mockGetBestSource: vi.fn(() => null as ReturnType<typeof import("@/lib/youtube").getBestSource>),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/lib/useUser", () => ({
  useUser: () => ({ user: auth.user, loading: auth.loading }),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

vi.mock("@/lib/savedStore", () => ({
  ensureSavedLoaded: mockEnsureSavedLoaded,
  toggleSaved: mockToggleSaved,
}));

vi.mock("@/lib/youtube", () => ({
  getYouTubeThumbnail: vi.fn(() => null),
  getBestSource: mockGetBestSource,
}));

vi.mock("@/components/PageNav", () => ({ PageNav: () => null }));
vi.mock("@/components/SuggestFooter", () => ({ SuggestFooter: () => null }));
vi.mock("@/components/PlatformBadge", () => ({ PlatformBadge: () => null }));

import ProfilePage from "./page";

function makeBuilder(result: { data: unknown; error: unknown }) {
  const b: PromiseLike<typeof result> & Record<string, unknown> = {
    select: () => b,
    eq: () => b,
    order: () => b,
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return b;
}

function makePerf(
  id: string,
  overrides: Record<string, unknown> = {}
) {
  return {
    performance: {
      id,
      artist_name: `Artist ${id}`,
      event_name: `Concert ${id}`,
      venue_name: null,
      performance_date: null,
      performance_type: null,
      duration_minutes: null,
      watch_sources: [],
      ...overrides,
    },
  };
}

beforeEach(() => {
  auth.user = null;
  auth.loading = false;
  mockPush.mockReset();
  mockToggleSaved.mockReset();
  mockEnsureSavedLoaded.mockReset();
  mockFrom.mockReset();
  mockGetBestSource.mockReturnValue(null);
});

describe("ProfilePage", () => {
  it("(a) shows loading spinner while userLoading=true", () => {
    auth.loading = true;
    render(<ProfilePage />);
    expect(
      screen.getByText(/loading saved performances/i)
    ).toBeInTheDocument();
  });

  it("(b) shows Browse Performances CTA when saved list is empty", async () => {
    render(<ProfilePage />);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /browse performances/i })
      ).toBeInTheDocument()
    );
  });

  it("(c) renders a card for each saved performance", async () => {
    auth.user = { id: "u1", email: "user@test.com" };
    mockFrom.mockReturnValue(
      makeBuilder({
        data: [makePerf("p1"), makePerf("p2"), makePerf("p3")],
        error: null,
      })
    );
    render(<ProfilePage />);
    // event_name appears in both the Top4 section and the saved grid
    await waitFor(() =>
      expect(screen.getAllByText("Concert p1").length).toBeGreaterThan(0)
    );
    expect(screen.getAllByText("Concert p2").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Concert p3").length).toBeGreaterThan(0);
  });

  it("(d) remove button calls toggleSaved with the correct performance ID", async () => {
    auth.user = { id: "u1", email: "user@test.com" };
    mockFrom.mockReturnValue(
      makeBuilder({ data: [makePerf("p1")], error: null })
    );
    mockToggleSaved.mockResolvedValue(undefined);
    render(<ProfilePage />);
    await waitFor(() =>
      expect(screen.getAllByText("Concert p1").length).toBeGreaterThan(0)
    );
    fireEvent.click(screen.getByRole("button", { name: /remove/i }));
    await waitFor(() =>
      expect(mockToggleSaved).toHaveBeenCalledWith("p1", "u1")
    );
  });

  it("(e) shows error state with retry button when Supabase load fails", async () => {
    auth.user = { id: "u1", email: "user@test.com" };
    mockFrom.mockReturnValue(
      makeBuilder({ data: null, error: { message: "db error" } })
    );
    render(<ProfilePage />);
    await waitFor(() =>
      expect(
        screen.getByText(/couldn.t load saved performances/i)
      ).toBeInTheDocument()
    );
    expect(
      screen.getByRole("button", { name: /try again/i })
    ).toBeInTheDocument();
  });

  it("(f) stats tab renders platform breakdown when saved list is non-empty", async () => {
    auth.user = { id: "u1", email: "user@test.com" };
    mockGetBestSource.mockReturnValue({
      url: "https://youtube.com/watch?v=abc123xyz",
      isYouTube: true,
      platform: "YouTube",
    });
    mockFrom.mockReturnValue(
      makeBuilder({ data: [makePerf("p1"), makePerf("p2")], error: null })
    );
    render(<ProfilePage />);
    await waitFor(() =>
      expect(screen.getAllByText("Concert p1").length).toBeGreaterThan(0)
    );
    fireEvent.click(screen.getByRole("button", { name: "Stats" }));
    expect(screen.getByText("PLATFORM BREAKDOWN")).toBeInTheDocument();
    expect(screen.getByText("YouTube")).toBeInTheDocument();
  });

  it("(g) optimistic remove rolls back the list on toggleSaved rejection", async () => {
    auth.user = { id: "u1", email: "user@test.com" };
    mockFrom.mockReturnValue(
      makeBuilder({ data: [makePerf("p1"), makePerf("p2")], error: null })
    );
    mockToggleSaved.mockRejectedValue(new Error("network error"));
    render(<ProfilePage />);
    await waitFor(() =>
      expect(screen.getAllByText("Concert p1").length).toBeGreaterThan(0)
    );
    const removeBtns = screen.getAllByRole("button", { name: /remove/i });
    fireEvent.click(removeBtns[0]);
    // After rejection the error toast appears and the card is restored
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/couldn.t remove/i)
    );
    expect(screen.getAllByText("Concert p1").length).toBeGreaterThan(0);
  });
});
