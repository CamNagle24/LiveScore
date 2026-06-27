import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

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

function rowsFor(names: (string | null)[]) {
  return names.map(artist_name => ({ artist_name }));
}

beforeEach(() => {
  mockGetUser.mockResolvedValue({ data: { user: null } });
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ json: async () => ({ artists: [] }) })
  );
});

describe("ArtistsPage", () => {
  it("counts and dedupes artist names from performances", async () => {
    mockFrom.mockReturnValue(
      makeBuilder({
        data: rowsFor(["Beyonce", "Beyonce", "Adele", null]),
        error: null,
      })
    );

    render(<ArtistsPage />);

    await waitFor(() => expect(screen.getByText("Beyonce")).toBeInTheDocument());
    expect(screen.getByText("2 performances")).toBeInTheDocument();
    expect(screen.getByText("Adele")).toBeInTheDocument();
    expect(screen.getByText("1 performance")).toBeInTheDocument();
  });

  it("sorts by most performances by default, and supports A→Z / Z→A", async () => {
    mockFrom.mockReturnValue(
      makeBuilder({
        data: rowsFor(["Adele", "Beyonce", "Beyonce", "Coldplay", "Coldplay", "Coldplay"]),
        error: null,
      })
    );

    render(<ArtistsPage />);
    await waitFor(() => expect(screen.getByText("Coldplay")).toBeInTheDocument());

    const namesInOrder = () =>
      screen.getAllByText(/^(Adele|Beyonce|Coldplay)$/).map(el => el.textContent);

    // Default sort = "count": Coldplay(3) > Beyonce(2) > Adele(1)
    expect(namesInOrder()).toEqual(["Coldplay", "Beyonce", "Adele"]);

    fireEvent.click(screen.getByText("A → Z"));
    expect(namesInOrder()).toEqual(["Adele", "Beyonce", "Coldplay"]);

    fireEvent.click(screen.getByText("Z → A"));
    expect(namesInOrder()).toEqual(["Coldplay", "Beyonce", "Adele"]);
  });

  it("filters artists by search text", async () => {
    mockFrom.mockReturnValue(
      makeBuilder({
        data: rowsFor(["Adele", "Beyonce", "Coldplay"]),
        error: null,
      })
    );

    render(<ArtistsPage />);
    await waitFor(() => expect(screen.getByText("Coldplay")).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText("Filter artists..."), {
      target: { value: "bey" },
    });

    expect(screen.getByText("Beyonce")).toBeInTheDocument();
    expect(screen.queryByText("Adele")).not.toBeInTheDocument();
    expect(screen.queryByText("Coldplay")).not.toBeInTheDocument();
  });

  it("renders the empty state when no performances exist", async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: [], error: null }));

    render(<ArtistsPage />);

    await waitFor(() => expect(screen.getByText("No artists found")).toBeInTheDocument());
  });
});

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
