import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/search",
  useSearchParams: () => new URLSearchParams(),
}));

const mockGetUser = vi.hoisted(() => vi.fn());
const mockOnAuthStateChange = vi.hoisted(() =>
  vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
);
const mockFrom = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
    auth: { getUser: mockGetUser, onAuthStateChange: mockOnAuthStateChange },
  },
}));

import SearchPage from "./page";

function makeBuilder(result: { data: unknown; error: unknown }) {
  const builder: PromiseLike<typeof result> & Record<string, unknown> = {
    select: () => builder,
    order: () => builder,
    limit: () => builder,
    or: () => builder,
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return builder;
}

beforeEach(() => {
  mockGetUser.mockResolvedValue({ data: { user: null } });
});

describe("SearchPage — fetchPerformances error handling", () => {
  it("shows an inline error banner when the Supabase query fails", async () => {
    mockFrom.mockReturnValue(
      makeBuilder({ data: null, error: { message: "db down" } })
    );

    render(<SearchPage />);

    await waitFor(() =>
      expect(
        screen.getByText(/something went wrong loading performances/i)
      ).toBeInTheDocument()
    );
  });

  it("shows no error banner when the query succeeds", async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: [], error: null }));

    render(<SearchPage />);

    await waitFor(() => expect(mockFrom).toHaveBeenCalled());
    expect(
      screen.queryByText(/something went wrong loading performances/i)
    ).not.toBeInTheDocument();
  });
});

describe("SearchPage — performance card accessibility", () => {
  const performance = {
    id: "1",
    artist_name: "Radiohead",
    event_name: "Glastonbury 2003",
    venue_name: "Glastonbury",
    performance_date: "2003-06-27",
    performance_type: "festival",
    duration_minutes: 90,
    watch_sources: [
      {
        id: 1,
        url: "https://youtube.com/watch?v=abc",
        source_status: "verified",
        subscription_service: null,
      },
    ],
  };

  it("exposes a role=button + aria-label and opens the source on Enter", async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: [performance], error: null }));
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(<SearchPage />);

    const card = await screen.findByRole("button", {
      name: "Watch Glastonbury 2003 by Radiohead",
    });
    card.focus();
    fireEvent.keyDown(card, { key: "Enter" });

    expect(openSpy).toHaveBeenCalledWith(
      "https://youtube.com/watch?v=abc",
      "_blank",
      "noopener,noreferrer"
    );
  });

  it("does not expose interactive semantics when there is no watchable source", async () => {
    mockFrom.mockReturnValue(
      makeBuilder({
        data: [{ ...performance, watch_sources: [] }],
        error: null,
      })
    );

    render(<SearchPage />);

    await waitFor(() => expect(mockFrom).toHaveBeenCalled());
    expect(
      screen.queryByRole("button", { name: /watch/i })
    ).not.toBeInTheDocument();
  });
});
