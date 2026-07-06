import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LoginForm } from "./LoginForm";

const { mockPush, mockRefresh, searchParamGet } = vi.hoisted(() => {
  const mockPush = vi.fn();
  const mockRefresh = vi.fn();
  const searchParamGet = vi.fn((_key: string) => null as string | null);
  return { mockPush, mockRefresh, searchParamGet };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  useSearchParams: () => ({ get: searchParamGet }),
}));

const { mockSignIn, mockSignUp, mockOAuth } = vi.hoisted(() => {
  const mockSignIn = vi.fn();
  const mockSignUp = vi.fn();
  const mockOAuth = vi.fn();
  return { mockSignIn, mockSignUp, mockOAuth };
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: mockSignIn,
      signUp: mockSignUp,
      signInWithOAuth: mockOAuth,
    },
  },
}));

beforeEach(() => {
  mockPush.mockReset();
  mockRefresh.mockReset();
  mockSignIn.mockReset();
  mockSignUp.mockReset();
  mockOAuth.mockReset();
  searchParamGet.mockImplementation((_key: string) => null);
});

describe("LoginForm", () => {
  it("(a) sign-in success calls router.push with the redirect target", async () => {
    mockSignIn.mockResolvedValueOnce({ error: null });
    render(<LoginForm />);

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/profile"));
    expect(mockSignIn).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });

  it("(b) shows error banner when Supabase sign-in returns an error", async () => {
    mockSignIn.mockResolvedValueOnce({ error: { message: "Invalid login credentials" } });
    render(<LoginForm />);

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "wrongpass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByText("Invalid login credentials")).toBeInTheDocument()
    );
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("(c) submit button is disabled while a request is in flight (busy state)", async () => {
    let resolveSignIn!: (v: unknown) => void;
    mockSignIn.mockReturnValueOnce(
      new Promise((r) => {
        resolveSignIn = r;
      })
    );

    render(<LoginForm />);

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "a@b.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /sign in/i })).toBeDisabled()
    );

    resolveSignIn({ error: null });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /sign in/i })).not.toBeDisabled()
    );
  });

  it("(d) clicking Continue with Google calls signInWithOAuth with provider='google'", async () => {
    mockOAuth.mockResolvedValueOnce({ error: null });
    render(<LoginForm />);

    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));

    await waitFor(() =>
      expect(mockOAuth).toHaveBeenCalledWith(
        expect.objectContaining({ provider: "google" })
      )
    );
  });

  it("(e) toggling from sign-in to sign-up mode clears error and notice states", async () => {
    mockSignIn.mockResolvedValueOnce({ error: { message: "Wrong password" } });
    render(<LoginForm />);

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "a@b.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "badpass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByText("Wrong password")).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /sign up free/i }));

    expect(screen.queryByText("Wrong password")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: /CREATE YOUR ACCOUNT/i })
    ).toBeInTheDocument();
  });

  it("(f) ?error=auth query param pre-populates the error banner without calling Supabase", () => {
    searchParamGet.mockImplementation((key: string) =>
      key === "error" ? "auth" : null
    );
    render(<LoginForm />);

    expect(
      screen.getByText("Sign-in failed. Please try again.")
    ).toBeInTheDocument();
    expect(mockSignIn).not.toHaveBeenCalled();
    expect(mockOAuth).not.toHaveBeenCalled();
  });
});
