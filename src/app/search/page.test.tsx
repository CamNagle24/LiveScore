import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

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
