import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/venues",
}));

const mockNot = vi.hoisted(() => vi.fn());
const mockSelect = vi.hoisted(() => vi.fn(() => ({ not: mockNot })));
const mockFrom = vi.hoisted(() => vi.fn(() => ({ select: mockSelect })));
const mockGetUser = vi.hoisted(() => vi.fn());
const mockOnAuthStateChange = vi.hoisted(() =>
  vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
);

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
    auth: { getUser: mockGetUser, onAuthStateChange: mockOnAuthStateChange },
  },
}));

import VenuesPage from "./page";

function mockRows(data: { venue_name: string | null; artist_name: string | null }[] | null) {
  mockNot.mockResolvedValue({ data });
}

beforeEach(() => {
  mockFrom.mockClear();
  mockSelect.mockClear();
  mockNot.mockClear();
  mockGetUser.mockResolvedValue({ data: { user: null } });
});

describe("VenuesPage", () => {
  it("groups performances by venue_name and dedupes associated artists", async () => {
    mockRows([
      { venue_name: "A Arena", artist_name: "X" },
      { venue_name: "A Arena", artist_name: "X" },
      { venue_name: "A Arena", artist_name: "Y" },
      { venue_name: "B Stadium", artist_name: "Z" },
    ]);

    render(<VenuesPage />);

    await waitFor(() => expect(screen.getByText("A Arena")).toBeInTheDocument());
    expect(screen.getByText("3 performances")).toBeInTheDocument();
    expect(screen.getByText("B Stadium")).toBeInTheDocument();
    expect(screen.getByText("1 performance")).toBeInTheDocument();
    expect(screen.getByText("X")).toBeInTheDocument();
    expect(screen.getAllByText("X")).toHaveLength(1);
    expect(screen.getByText("Y")).toBeInTheDocument();
    expect(screen.getByText("Z")).toBeInTheDocument();
  });

  it("sorts by count by default, then supports A→Z and Z→A", async () => {
    mockRows([
      { venue_name: "Zenith Hall", artist_name: "X" },
      { venue_name: "Apex Center", artist_name: "Y" },
      { venue_name: "Apex Center", artist_name: "Z" },
    ]);

    render(<VenuesPage />);

    await waitFor(() => expect(screen.getByText("Apex Center")).toBeInTheDocument());

    const namesInOrder = () =>
      screen.getAllByText(/Arena|Center|Hall/).map((el) => el.textContent);

    // Default sort: "Most Performances" (count desc) — Apex Center (2) before Zenith Hall (1)
    expect(namesInOrder()).toEqual(["Apex Center", "Zenith Hall"]);

    fireEvent.click(screen.getByText("A → Z"));
    expect(namesInOrder()).toEqual(["Apex Center", "Zenith Hall"]);

    fireEvent.click(screen.getByText("Z → A"));
    expect(namesInOrder()).toEqual(["Zenith Hall", "Apex Center"]);
  });

  it("filters by search text", async () => {
    mockRows([
      { venue_name: "Apex Center", artist_name: "X" },
      { venue_name: "Zenith Hall", artist_name: "Y" },
    ]);

    render(<VenuesPage />);

    await waitFor(() => expect(screen.getByText("Apex Center")).toBeInTheDocument());
    expect(screen.getByText("Zenith Hall")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Filter venues..."), {
      target: { value: "zen" },
    });

    await waitFor(() => expect(screen.queryByText("Apex Center")).not.toBeInTheDocument());
    expect(screen.getByText("Zenith Hall")).toBeInTheDocument();
  });

  describe("debounced filtering", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("does not filter immediately on keystroke, but does after the 400ms debounce", async () => {
      mockRows([
        { venue_name: "Apex Center", artist_name: "X" },
        { venue_name: "Zenith Hall", artist_name: "Y" },
      ]);

      render(<VenuesPage />);

      await act(async () => {
        await Promise.resolve();
      });
      expect(screen.getByText("Apex Center")).toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText("Filter venues..."), {
        target: { value: "zen" },
      });

      // Immediately after typing, both venues are still rendered — filter hasn't committed yet
      expect(screen.getByText("Apex Center")).toBeInTheDocument();
      expect(screen.getByText("Zenith Hall")).toBeInTheDocument();

      // Just under the debounce threshold: still no filtering
      act(() => {
        vi.advanceTimersByTime(399);
      });
      expect(screen.getByText("Apex Center")).toBeInTheDocument();

      // Crossing the 400ms threshold commits the filter
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(screen.queryByText("Apex Center")).not.toBeInTheDocument();
      expect(screen.getByText("Zenith Hall")).toBeInTheDocument();
    });

    it("resets the debounce timer on each keystroke (rapid typing only filters once, after the last keystroke)", async () => {
      mockRows([
        { venue_name: "Apex Center", artist_name: "X" },
        { venue_name: "Zenith Hall", artist_name: "Y" },
      ]);

      render(<VenuesPage />);

      await act(async () => {
        await Promise.resolve();
      });

      const input = screen.getByPlaceholderText("Filter venues...");

      fireEvent.change(input, { target: { value: "z" } });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      fireEvent.change(input, { target: { value: "ze" } });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      fireEvent.change(input, { target: { value: "zen" } });

      // Total elapsed since last keystroke is still < 400ms, so no commit yet
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(screen.getByText("Apex Center")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(screen.queryByText("Apex Center")).not.toBeInTheDocument();
      expect(screen.getByText("Zenith Hall")).toBeInTheDocument();
    });
  });

  it("renders the empty state when no performances exist", async () => {
    mockRows([]);

    render(<VenuesPage />);

    await waitFor(() => expect(screen.getByText("No venues found")).toBeInTheDocument());
  });
});

describe("VenuesPage — load error handling", () => {
  beforeEach(() => {
    mockFrom.mockClear();
    mockSelect.mockClear();
    mockNot.mockClear();
    mockGetUser.mockResolvedValue({ data: { user: null } });
  });

  it("shows an inline error message when the Supabase query fails", async () => {
    mockNot.mockResolvedValue({ data: null, error: { message: "db error" } });

    render(<VenuesPage />);

    await waitFor(() =>
      expect(screen.getByText(/couldn.t load venues/i)).toBeInTheDocument()
    );
    expect(screen.queryByText(/no venues found/i)).not.toBeInTheDocument();
  });

  it("shows the empty state (not the error message) when the query succeeds with no rows", async () => {
    mockRows([]);

    render(<VenuesPage />);

    await waitFor(() =>
      expect(screen.getByText(/no venues found/i)).toBeInTheDocument()
    );
    expect(screen.queryByText(/couldn.t load venues/i)).not.toBeInTheDocument();
  });
});
