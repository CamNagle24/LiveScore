import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetUser = vi.hoisted(() => vi.fn());

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { getUser: mockGetUser } }),
}));

// Import after mock registration
const { proxy } = await import("./proxy");

function req(pathname: string) {
  return new NextRequest(`http://localhost${pathname}`);
}

describe("proxy — /developer gating", () => {
  beforeEach(() => {
    process.env.ADMIN_EMAILS = "admin@example.com";
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated user to /login with ?next", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await proxy(req("/developer/page"));
    expect(res.status).toBe(307);
    const loc = new URL(res.headers.get("location")!);
    expect(loc.pathname).toBe("/login");
    expect(loc.searchParams.get("next")).toBe("/developer/page");
  });

  it("redirects non-admin authenticated user to /landing", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { email: "user@example.com" } },
    });
    const res = await proxy(req("/developer"));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/landing");
  });

  it("allows admin user through /developer", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { email: "admin@example.com" } },
    });
    const res = await proxy(req("/developer"));
    expect(res.status).toBe(200);
  });

  it("is case-insensitive for the admin email check", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { email: "ADMIN@EXAMPLE.COM" } },
    });
    const res = await proxy(req("/developer"));
    expect(res.status).toBe(200);
  });

  it("allows one of several comma-separated ADMIN_EMAILS", async () => {
    process.env.ADMIN_EMAILS = "a@example.com, admin@example.com, b@example.com";
    mockGetUser.mockResolvedValue({
      data: { user: { email: "admin@example.com" } },
    });
    const res = await proxy(req("/developer"));
    expect(res.status).toBe(200);
  });
});

describe("proxy — /profile gating", () => {
  beforeEach(() => {
    process.env.ADMIN_EMAILS = "admin@example.com";
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated user to /login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await proxy(req("/profile"));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
  });

  it("allows any authenticated user through /profile", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { email: "regular@example.com" } },
    });
    const res = await proxy(req("/profile"));
    expect(res.status).toBe(200);
  });
});
