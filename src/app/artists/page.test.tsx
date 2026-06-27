import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/artists",
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

import ArtistsPage from "./page";

function makeBuilder(result: { data: unknown; error: unknown }) {
  const builder: PromiseLike<typeof result> & Record<string, unknown> = {
    select: () => builder,
    order: () => builder,
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return builder;
}

beforeEach(() => {
  mockFrom.mockReset();
  mockGetUser.mockResolvedValue({ data: { user: null } });
});

describe("ArtistsPage — load error handling", () => {
  it("shows an inline error message when the Supabase query fails", async () => {
    mockFrom.mockReturnValue(
      makeBuilder({ data: null, error: { message: "db down" } })
    );

    render(<ArtistsPage />);

    await waitFor(() =>
      expect(
        screen.getByText(/couldn.t load artists/i)
      ).toBeInTheDocument()
    );
    expect(screen.queryByText(/no artists found/i)).not.toBeInTheDocument();
  });

  it("shows the empty state (not the error message) when the query succeeds with no rows", async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: [], error: null }));

    render(<ArtistsPage />);

    await waitFor(() =>
      expect(screen.getByText(/no artists found/i)).toBeInTheDocument()
    );
    expect(screen.queryByText(/couldn.t load artists/i)).not.toBeInTheDocument();
  });
});
