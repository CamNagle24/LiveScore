import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ArtistError from "./error";

describe("ArtistError", () => {
  it("renders without throwing and shows a heading", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ArtistError error={new Error("boom")} unstable_retry={vi.fn()} />);
    expect(screen.getByRole("heading", { name: /something went wrong/i })).toBeInTheDocument();
  });

  it("logs the error to console.error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("artist load failed");
    render(<ArtistError error={error} unstable_retry={vi.fn()} />);
    expect(spy).toHaveBeenCalledWith(error);
    spy.mockRestore();
  });

  it("includes a reset mechanism — a Try again button", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ArtistError error={new Error("boom")} unstable_retry={vi.fn()} />);
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("calls unstable_retry when the Try again button is clicked", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const retry = vi.fn();
    render(<ArtistError error={new Error("boom")} unstable_retry={retry} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
