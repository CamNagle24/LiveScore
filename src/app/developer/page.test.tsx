import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

const mockFrom = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase", () => ({
  supabase: { from: mockFrom },
}));

import Dashboard from "./page";

// Returns a chainable builder that detects count queries (select with head:true)
// vs data queries and resolves to the appropriate shape.
type QueryResult = { data?: unknown[] | null; error?: unknown; count?: number };
type QueryBuilder = {
  select: (...args: unknown[]) => QueryBuilder;
  eq: () => QueryBuilder;
  order: () => QueryBuilder;
  limit: () => QueryBuilder;
  returns: () => QueryBuilder;
  then: (res: (v: QueryResult) => void) => Promise<void>;
};

function makeBuilder({
  count = 0,
  data = [] as unknown[] | null,
  dataError = null as unknown,
} = {}) {
  function countChain(): QueryBuilder {
    const c: QueryBuilder = {
      select: () => c,
      eq: () => c,
      order: () => c,
      limit: () => c,
      returns: () => c,
      then: (res) => Promise.resolve({ count, error: null }).then(res),
    };
    return c;
  }

  const dataBuilder: QueryBuilder = {
    select(...args: unknown[]) {
      const isCount =
        args[1] != null &&
        typeof args[1] === "object" &&
        (args[1] as Record<string, unknown>).head === true;
      return isCount ? countChain() : dataBuilder;
    },
    eq: () => dataBuilder,
    order: () => dataBuilder,
    limit: () => dataBuilder,
    returns: () => dataBuilder,
    then: (res) => Promise.resolve({ data, error: dataError }).then(res),
  };
  return dataBuilder;
}

beforeEach(() => {
  mockFrom.mockReturnValue(makeBuilder());
});

describe("Dashboard (developer/page)", () => {
  it("shows the Performances tab as active on initial load (empty table)", async () => {
    render(<Dashboard />);

    await waitFor(() =>
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    );

    // Empty state message includes the current tab name
    expect(screen.getByText(/No data in/)).toBeInTheDocument();
    // The <code> element inside the sentence contains the tab key
    expect(document.querySelector("code")?.textContent).toBe("performances");
  });

  it("switching to Video Candidates tab re-fetches and renders table columns", async () => {
    render(<Dashboard />);
    await waitFor(() =>
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    );

    const testData = [{ id: 1, source_url: "https://example.com", created_at: "2024-01-01" }];
    mockFrom.mockReturnValue(makeBuilder({ data: testData }));

    fireEvent.click(screen.getByRole("button", { name: /Video Candidates/i }));

    // Column headers are rendered from Object.keys(data[0])
    await waitFor(() =>
      expect(screen.getByText("source_url")).toBeInTheDocument()
    );
    expect(screen.getByText("created_at")).toBeInTheDocument();
  });

  it("switching to Pipeline Runs tab renders columns from that table's rows", async () => {
    render(<Dashboard />);
    await waitFor(() =>
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    );

    const pipelineData = [{ id: 1, started_at: "2024-01-01T00:00:00Z", status: "completed" }];
    mockFrom.mockReturnValue(makeBuilder({ data: pipelineData }));

    fireEvent.click(screen.getByRole("button", { name: /Pipeline Runs/i }));

    await waitFor(() =>
      expect(screen.getByText("started_at")).toBeInTheDocument()
    );
    expect(screen.getByText("status")).toBeInTheDocument();
  });

  it("shows the error state when the Supabase data query fails", async () => {
    mockFrom.mockReturnValue(
      makeBuilder({ data: null, dataError: { message: "DB connection refused" } })
    );

    render(<Dashboard />);

    await waitFor(() =>
      expect(screen.getByText("Error connecting to Supabase")).toBeInTheDocument()
    );
    expect(screen.getByText("DB connection refused")).toBeInTheDocument();
    // Empty-table message should NOT appear
    expect(screen.queryByText(/No data in/)).not.toBeInTheDocument();
  });
});
