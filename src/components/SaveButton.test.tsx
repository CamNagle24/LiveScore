import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { SaveButton } from "./SaveButton";

const { mockPush, mockToggleSaved, mockEnsureSavedLoaded, mockResetSaved, auth, store } =
  vi.hoisted(() => {
    const auth = { user: null as { id: string } | null, loading: false };
    const store = { isSaved: false };
    return {
      mockPush: vi.fn(),
      mockToggleSaved: vi.fn(),
      mockEnsureSavedLoaded: vi.fn(),
      mockResetSaved: vi.fn(),
      auth,
      store,
    };
  });

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/search",
}));

vi.mock("@/lib/useUser", () => ({
  useUser: () => ({ user: auth.user, loading: auth.loading }),
}));

vi.mock("@/lib/savedStore", () => ({
  useSavedIds: () => new Set<string>(),
  isSavedId: () => store.isSaved,
  toggleSaved: mockToggleSaved,
  ensureSavedLoaded: mockEnsureSavedLoaded,
  resetSaved: mockResetSaved,
}));

beforeEach(() => {
  auth.user = null;
  auth.loading = false;
  store.isSaved = false;
  mockPush.mockReset();
  mockToggleSaved.mockReset();
  mockEnsureSavedLoaded.mockImplementation(() => Promise.resolve());
  mockResetSaved.mockReset();
});

describe("SaveButton", () => {
  it("unauthenticated click routes to /login with next param", async () => {
    render(<SaveButton performanceId="perf-1" />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockPush).toHaveBeenCalledWith("/login?next=%2Fsearch");
    expect(mockToggleSaved).not.toHaveBeenCalled();
  });

  it("authenticated click calls toggleSaved with correct args", async () => {
    auth.user = { id: "user-1" };
    mockToggleSaved.mockImplementation(() => Promise.resolve());
    render(<SaveButton performanceId="perf-1" />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(mockToggleSaved).toHaveBeenCalledWith("perf-1", "user-1");
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows error tooltip when toggleSaved throws and performance is not yet saved", async () => {
    auth.user = { id: "user-1" };
    store.isSaved = false;
    mockToggleSaved.mockRejectedValue(new Error("db error"));
    render(<SaveButton performanceId="perf-1" />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Couldn't save. Try again.");
    });
  });

  it("shows remove error tooltip when toggleSaved throws and performance is saved", async () => {
    auth.user = { id: "user-1" };
    store.isSaved = true;
    mockToggleSaved.mockRejectedValue(new Error("db error"));
    render(<SaveButton performanceId="perf-1" />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Couldn't remove. Try again.");
    });
  });

  it("busy state blocks a second click before the first resolves", async () => {
    auth.user = { id: "user-1" };
    let resolveToggle!: () => void;
    mockToggleSaved.mockImplementation(
      () => new Promise<void>((res) => { resolveToggle = res; })
    );
    render(<SaveButton performanceId="perf-1" />);
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    // Wait for the first call to register (setBusy(true) fires before the await)
    await waitFor(() => expect(mockToggleSaved).toHaveBeenCalledTimes(1));
    // Second click while still busy — should be a no-op
    fireEvent.click(btn);
    expect(mockToggleSaved).toHaveBeenCalledTimes(1);
    // Resolve to let the component settle
    await act(async () => {
      resolveToggle();
    });
  });
});
