import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreateClient = vi.hoisted(() => vi.fn());

vi.mock("./supabase/client", () => ({
  createClient: mockCreateClient,
}));

describe("supabase lazy singleton", () => {
  beforeEach(() => {
    vi.resetModules();
    mockCreateClient.mockReset();
  });

  it("does not create the underlying client at import time", async () => {
    await import("./supabase");
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it("creates the client lazily on first property access and reuses it (singleton)", async () => {
    const realClient = { from: vi.fn(), auth: {} };
    mockCreateClient.mockReturnValue(realClient);

    const { supabase } = await import("./supabase");
    expect(mockCreateClient).not.toHaveBeenCalled();

    void supabase.from;
    expect(mockCreateClient).toHaveBeenCalledTimes(1);

    void supabase.auth;
    void supabase.from;
    expect(mockCreateClient).toHaveBeenCalledTimes(1);
  });

  it("binds accessed methods to the real client so a destructured method doesn't throw on `this`", async () => {
    const realClient = {
      value: "real-value",
      getValue() {
        return this.value;
      },
    };
    mockCreateClient.mockReturnValue(realClient);

    const { supabase } = await import("./supabase");
    const { getValue } = supabase as unknown as typeof realClient;

    expect(getValue()).toBe("real-value");
  });
});
