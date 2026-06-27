import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

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

    expect(screen.queryByText("Apex Center")).not.toBeInTheDocument();
    expect(screen.getByText("Zenith Hall")).toBeInTheDocument();
  });

  it("renders the empty state when no performances exist", async () => {
    mockRows([]);

    render(<VenuesPage />);

    await waitFor(() => expect(screen.getByText("No venues found")).toBeInTheDocument());
  });
});
