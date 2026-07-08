import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/components/PageNav", () => ({ PageNav: () => null }));
vi.mock("@/components/SuggestFooter", () => ({ SuggestFooter: () => null }));
vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} />
  ),
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

import LandingPage from "./page";

beforeEach(() => {
  mockPush.mockClear();
});

describe("LandingPage", () => {
  it("renders without throwing", () => {
    expect(() => render(<LandingPage />)).not.toThrow();
  });

  it("renders the primary hero heading", () => {
    render(<LandingPage />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(document.body.textContent).toContain("EVERY LIVE");
    expect(document.body.textContent).toContain("ALL IN ONE PLACE.");
  });

  it("renders the RECENT DROPS section with at least one image", () => {
    render(<LandingPage />);
    expect(screen.getByText("RECENT DROPS")).toBeInTheDocument();
    const images = document.querySelectorAll("img");
    expect(images.length).toBeGreaterThan(0);
  });

  it('"SIGN UP FREE" CTA navigates to /login', () => {
    render(<LandingPage />);
    fireEvent.click(screen.getByText("SIGN UP FREE"));
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it('"CREATE FREE ACCOUNT" CTA navigates to /login', () => {
    render(<LandingPage />);
    fireEvent.click(screen.getByText("CREATE FREE ACCOUNT"));
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it('"EXPLORE NOW" CTA navigates to /search', () => {
    render(<LandingPage />);
    fireEvent.click(screen.getByText("EXPLORE NOW"));
    expect(mockPush).toHaveBeenCalledWith("/search");
  });

  it("EventCard is keyboard-focusable (tabIndex=0) and Enter fires router push", () => {
    render(<LandingPage />);
    const cards = screen.getAllByRole("link");
    const eventCard = cards[0];
    expect(eventCard).toHaveAttribute("tabindex", "0");
    fireEvent.keyDown(eventCard, { key: "Enter" });
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("/search?q="));
  });

  it("EventCard Space key fires router push", () => {
    render(<LandingPage />);
    const [firstCard] = screen.getAllByRole("link");
    fireEvent.keyDown(firstCard, { key: " " });
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("/search?q="));
  });
});
