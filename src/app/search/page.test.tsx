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
    abortSignal: () => builder,
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
