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
    range: () => builder,
    or: () => builder,
    abortSignal: () => builder,
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return builder;
}

function makeSequencedBuilder(results: { data: unknown; error: unknown }[]) {
  let call = 0;
  return () => {
    const result = results[Math.min(call, results.length - 1)];
    call += 1;
    return makeBuilder(result);
  };
}

function makePerformance(id: string) {
  return {
    id,
    artist_name: `Artist ${id}`,
    event_name: `Event ${id}`,
    venue_name: 'Venue',
    performance_date: '2024-01-01',
    performance_type: 'concert',
    duration_minutes: 60,
    watch_sources: [],
  };
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

describe("SearchPage — pagination", () => {
  it("shows a Load more button when a full page of results is returned, and appends the next page on click", async () => {
    const firstPage = Array.from({ length: 24 }, (_, i) => makePerformance(`p${i}`));
    const secondPage = [makePerformance("p24"), makePerformance("p25")];
    mockFrom.mockImplementation(
      makeSequencedBuilder([
        { data: firstPage, error: null },
        { data: secondPage, error: null },
      ])
    );

    render(<SearchPage />);

    await waitFor(() => expect(screen.getByText("24 PERFORMANCES")).toBeInTheDocument());
    const loadMoreButton = screen.getByRole("button", { name: /load more/i });
    expect(loadMoreButton).toBeInTheDocument();

    loadMoreButton.click();

    await waitFor(() => expect(screen.getByText("26 PERFORMANCES")).toBeInTheDocument());
  });

  it("hides the Load more button when fewer than a full page of results is returned", async () => {
    mockFrom.mockReturnValue(
      makeBuilder({ data: [makePerformance("p0")], error: null })
    );

    render(<SearchPage />);

    await waitFor(() => expect(screen.getByText("1 PERFORMANCES")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /load more/i })).not.toBeInTheDocument();

describe("SearchPage — stale request cancellation", () => {
  it("discards a slow in-flight response once a newer search supersedes it", async () => {
    let resolveStale!: (v: { data: unknown; error: null }) => void;
    const staleBuilder: PromiseLike<unknown> & Record<string, unknown> = {
      select: () => staleBuilder,
      order: () => staleBuilder,
      limit: () => staleBuilder,
      or: () => staleBuilder,
      abortSignal: () => staleBuilder,
      then: (resolve, reject) =>
        new Promise((res) => {
          resolveStale = res;
        }).then(resolve, reject),
    };
    const freshBuilder = makeBuilder({
      data: [
        {
          id: "fresh",
          artist_name: "Fresh Artist",
          event_name: "Fresh Result",
          venue_name: null,
          performance_date: null,
          performance_type: null,
          duration_minutes: null,
          watch_sources: [],
        },
      ],
      error: null,
    });

    mockFrom.mockReturnValueOnce(staleBuilder).mockReturnValueOnce(freshBuilder);

    render(<SearchPage />);

    const input = screen.getByPlaceholderText(/try/i);
    fireEvent.change(input, { target: { value: "fresh" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() =>
      expect(screen.getByText("Fresh Result")).toBeInTheDocument()
    );

    resolveStale({
      data: [
        {
          id: "stale",
          artist_name: "Stale Artist",
          event_name: "Stale Result",
          venue_name: null,
          performance_date: null,
          performance_type: null,
          duration_minutes: null,
          watch_sources: [],
        },
      ],
      error: null,
    });

    await waitFor(() =>
      expect(screen.queryByText("Stale Result")).not.toBeInTheDocument()
    );
    expect(screen.getByText("Fresh Result")).toBeInTheDocument();
  });
});
