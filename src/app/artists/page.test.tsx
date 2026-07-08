import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/artists",
}));

const mockTrack = vi.hoisted(() => vi.fn());
const mockGetUser = vi.hoisted(() => vi.fn());
const mockOnAuthStateChange = vi.hoisted(() =>
  vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
);
const mockFrom = vi.hoisted(() => vi.fn());

vi.mock("@/lib/analytics", () => ({ track: mockTrack }));

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

    await waitFor(() => expect(screen.queryByText("Adele")).not.toBeInTheDocument());
    expect(screen.getByText("Beyonce")).toBeInTheDocument();
    expect(screen.queryByText("Coldplay")).not.toBeInTheDocument();
  });

  describe("debounced filtering", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("does not filter immediately on keystroke, but does after the 400ms debounce", async () => {
      mockFrom.mockReturnValue(
        makeBuilder({
          data: rowsFor(["Adele", "Beyonce", "Coldplay"]),
          error: null,
        })
      );

      render(<ArtistsPage />);

      await act(async () => {
        await Promise.resolve();
      });
      expect(screen.getByText("Coldplay")).toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText("Filter artists..."), {
        target: { value: "bey" },
      });

      // Immediately after typing, all three artists are still rendered
      expect(screen.getByText("Adele")).toBeInTheDocument();
      expect(screen.getByText("Beyonce")).toBeInTheDocument();
      expect(screen.getByText("Coldplay")).toBeInTheDocument();

      // Just under the debounce threshold: still no filtering
      act(() => {
        vi.advanceTimersByTime(399);
      });
      expect(screen.getByText("Coldplay")).toBeInTheDocument();

      // Crossing the 400ms threshold commits the filter
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(screen.getByText("Beyonce")).toBeInTheDocument();
      expect(screen.queryByText("Adele")).not.toBeInTheDocument();
      expect(screen.queryByText("Coldplay")).not.toBeInTheDocument();
    });

    it("resets the debounce timer on each keystroke (rapid typing only filters once, after the last keystroke)", async () => {
      mockFrom.mockReturnValue(
        makeBuilder({
          data: rowsFor(["Adele", "Beyonce", "Coldplay"]),
          error: null,
        })
      );

      render(<ArtistsPage />);

      await act(async () => {
        await Promise.resolve();
      });

      const input = screen.getByPlaceholderText("Filter artists...");

      fireEvent.change(input, { target: { value: "b" } });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      fireEvent.change(input, { target: { value: "be" } });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      fireEvent.change(input, { target: { value: "bey" } });

      // Total elapsed since last keystroke is still < 400ms, so no commit yet
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(screen.getByText("Adele")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(screen.queryByText("Adele")).not.toBeInTheDocument();
      expect(screen.getByText("Beyonce")).toBeInTheDocument();
      expect(screen.queryByText("Coldplay")).not.toBeInTheDocument();
    });
  });

  it("renders the empty state when no performances exist", async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: [], error: null }));

    render(<ArtistsPage />);

    await waitFor(() => expect(screen.getByText("No artists found")).toBeInTheDocument());
  });

  it("filter input has an accessible aria-label", async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: [], error: null }));

    render(<ArtistsPage />);

    await waitFor(() => expect(screen.getByText("No artists found")).toBeInTheDocument());
    expect(screen.getByRole("textbox", { name: /filter artists by name/i })).toBeInTheDocument();
  });

  it("results-count badge has aria-live=polite and aria-atomic=true", async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: rowsFor(["Adele"]), error: null }));

    render(<ArtistsPage />);

    await waitFor(() => expect(screen.getByText("Adele")).toBeInTheDocument());
    const badge = screen.getByText(/\d+ ARTISTS/);
    expect(badge).toHaveAttribute("aria-live", "polite");
    expect(badge).toHaveAttribute("aria-atomic", "true");
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

describe("ArtistsPage — analytics", () => {
  beforeEach(() => {
    mockFrom.mockReturnValue(makeBuilder({ data: [{ artist_name: "Adele" }], error: null }));
    mockTrack.mockReset();
  });

  it("calls track('artist_card_click') with the artist name when a card is clicked", async () => {
    render(<ArtistsPage />);
    await waitFor(() => expect(screen.getByText("Adele")).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText("View Adele"));
    expect(mockTrack).toHaveBeenCalledWith("artist_card_click", { artist: "Adele" });
  });
});
