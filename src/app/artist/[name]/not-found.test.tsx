import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ArtistNotFound from "./not-found";

describe("ArtistNotFound", () => {
  it("renders without throwing", () => {
    render(<ArtistNotFound />);
  });

  it("includes artist-specific not-found text", () => {
    render(<ArtistNotFound />);
    expect(screen.getByText(/artist not found/i)).toBeInTheDocument();
  });

  it("includes a link back to browse performances", () => {
    render(<ArtistNotFound />);
    const link = screen.getByRole("link", { name: /browse performances/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/search");
  });
});
