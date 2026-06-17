import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockInsert = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: () => ({ insert: mockInsert }),
  },
}));

import { SuggestFooter } from "./SuggestFooter";

describe("SuggestFooter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("disables the submit button when the artist field is empty", () => {
    render(<SuggestFooter />);
    const btn = screen.getByRole("button", { name: /submit suggestion/i });
    expect(btn).toBeDisabled();
  });

  it("enables the submit button once the artist field has text", () => {
    render(<SuggestFooter />);
    fireEvent.change(screen.getByPlaceholderText(/artist name/i), {
      target: { value: "Radiohead" },
    });
    expect(screen.getByRole("button", { name: /submit suggestion/i })).not.toBeDisabled();
  });

  it("shows the thank-you state after a successful insert", async () => {
    mockInsert.mockResolvedValue({ error: null });
    render(<SuggestFooter />);

    fireEvent.change(screen.getByPlaceholderText(/artist name/i), {
      target: { value: "Radiohead" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit suggestion/i }));

    await waitFor(() =>
      expect(screen.getByText(/thanks.*review/i)).toBeInTheDocument()
    );
    expect(screen.queryByRole("button", { name: /submit suggestion/i })).not.toBeInTheDocument();
  });

  it("surfaces error text when Supabase returns an error", async () => {
    mockInsert.mockResolvedValue({ error: { message: "db error" } });
    render(<SuggestFooter />);

    fireEvent.change(screen.getByPlaceholderText(/artist name/i), {
      target: { value: "Radiohead" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit suggestion/i }));

    await waitFor(() =>
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    );
    expect(
      screen.getByRole("button", { name: /submit suggestion/i })
    ).toBeInTheDocument();
  });

  it('"Suggest another" resets the form back to the empty state', async () => {
    mockInsert.mockResolvedValue({ error: null });
    render(<SuggestFooter />);

    fireEvent.change(screen.getByPlaceholderText(/artist name/i), {
      target: { value: "Radiohead" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit suggestion/i }));

    await waitFor(() =>
      expect(screen.getByText(/suggest another/i)).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText(/suggest another/i));

    expect(
      screen.getByRole("button", { name: /submit suggestion/i })
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/artist name/i)).toHaveValue("");
  });
});
