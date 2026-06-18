import { describe, it, expect, vi, beforeEach } from "vitest";

const mockExchange = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { exchangeCodeForSession: mockExchange },
  }),
}));

// Import under test (after mocks are registered)
const { GET } = await import("./route");

function makeRequest(path: string): Request {
  return new Request(`http://localhost${path}`);
}

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /login?error=auth when no code is present", async () => {
    const res = await GET(makeRequest("/auth/callback"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost/login?error=auth"
    );
    expect(mockExchange).not.toHaveBeenCalled();
  });

  it("redirects to /login?error=auth when code exchange fails", async () => {
    mockExchange.mockResolvedValue({ error: { message: "invalid code" } });
    const res = await GET(makeRequest("/auth/callback?code=bad"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost/login?error=auth"
    );
  });

  it("redirects to /profile on successful exchange (default next)", async () => {
    mockExchange.mockResolvedValue({ error: null });
    const res = await GET(makeRequest("/auth/callback?code=good"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/profile");
  });

  it("respects a safe ?next parameter on success", async () => {
    mockExchange.mockResolvedValue({ error: null });
    const res = await GET(
      makeRequest("/auth/callback?code=good&next=%2Fartist%2Ftaylor-swift")
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost/artist/taylor-swift"
    );
  });

  it("ignores an unsafe ?next (open redirect attempt) and falls back to /profile", async () => {
    mockExchange.mockResolvedValue({ error: null });
    const res = await GET(
      makeRequest(
        "/auth/callback?code=good&next=" + encodeURIComponent("//evil.com")
      )
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/profile");
  });
});
