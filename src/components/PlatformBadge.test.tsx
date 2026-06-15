import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlatformBadge } from "./PlatformBadge";

describe("PlatformBadge", () => {
  it("renders the YouTube badge when isYouTube is true", () => {
    render(<PlatformBadge platform="Some Platform" isYouTube />);
    expect(screen.getByText("YouTube")).toBeInTheDocument();
  });

  it("renders a known platform label", () => {
    render(<PlatformBadge platform="Netflix" isYouTube={false} />);
    expect(screen.getByText("Netflix")).toBeInTheDocument();
  });

  it("falls back to the raw platform name for unknown platforms", () => {
    render(<PlatformBadge platform="Mystery Service" isYouTube={false} />);
    expect(screen.getByText("Mystery Service")).toBeInTheDocument();
  });
});
