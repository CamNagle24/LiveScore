import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import NotFound from "./not-found";

describe("NotFound", () => {
  it("renders a friendly message and a link back to the app", () => {
    render(<NotFound />);

    expect(screen.getByText(/page not found/i)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /back to livescore/i });
    expect(link).toHaveAttribute("href", "/landing");
  });
});
