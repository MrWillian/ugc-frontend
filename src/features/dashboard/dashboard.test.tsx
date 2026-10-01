import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { DashboardSummaryCards } from "@/features/dashboard/DashboardSummaryCards";
import { useDashboardSummary } from "@/features/dashboard/useDashboardSummary";

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

function SummaryHarness() {
  return <DashboardSummaryCards {...useDashboardSummary()} />;
}

function renderSummary() {
  return render(
    <QueryProvider>
      <SummaryHarness />
    </QueryProvider>,
  );
}

describe("dashboard summary", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("derives each count from the dashboard responses", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input) => {
        const url = String(input);

        if (url === "/api/posts?limit=1") {
          return jsonResponse({
            data: [],
            meta: { page: 1, limit: 1, total: 328, totalPages: 328 },
          });
        }
        if (url === "/api/posts?status=pending&limit=1") {
          return jsonResponse({
            data: [],
            meta: { page: 1, limit: 1, total: 32, totalPages: 32 },
          });
        }
        if (url === "/api/posts?status=approved&limit=1") {
          return jsonResponse({
            data: [],
            meta: { page: 1, limit: 1, total: 227, totalPages: 227 },
          });
        }
        if (url.startsWith("/api/posts?") && url.includes("limit=100")) {
          return jsonResponse({
            data: [],
            meta: { page: 1, limit: 100, total: 0, totalPages: 1 },
          });
        }
        if (url === "/api/widgets") {
          return jsonResponse([{ id: "w1" }, { id: "w2" }, { id: "w3" }]);
        }

        throw new Error(`Unexpected URL: ${url}`);
      });

    renderSummary();

    expect(await screen.findByText("Posts coletados")).toBeInTheDocument();
    expect(screen.getByText("328")).toBeInTheDocument();
    expect(screen.getByText("32")).toBeInTheDocument();
    expect(screen.getByText("227")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/posts?limit=1", {
      credentials: "same-origin",
    });
  });

  it("shows a loading message while responses are pending", () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      () => new Promise<Response>(() => undefined),
    );

    renderSummary();

    expect(screen.getByText("Carregando resumo…")).toBeInTheDocument();
  });

  it("shows an error and retries all summary requests", async () => {
    let allPostsCalls = 0;
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input) => {
        const url = String(input);
        if (url === "/api/posts?limit=1") {
          allPostsCalls += 1;
          if (allPostsCalls > 2) {
            return new Promise<Response>(() => undefined);
          }
          return jsonResponse(
            { message: "Falha ao carregar posts." },
            { status: 500 },
          );
        }
        if (url === "/api/posts?status=pending&limit=1") {
          return jsonResponse({
            data: [],
            meta: { page: 1, limit: 1, total: 7, totalPages: 7 },
          });
        }
        if (url === "/api/posts?status=approved&limit=1") {
          return jsonResponse({
            data: [],
            meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
          });
        }
        if (url.startsWith("/api/posts?") && url.includes("limit=100")) {
          return jsonResponse({
            data: [],
            meta: { page: 1, limit: 100, total: 0, totalPages: 1 },
          });
        }
        return jsonResponse([{ id: "w1" }]);
      });

    renderSummary();

    const alert = await screen.findByRole("alert", {}, { timeout: 3_000 });
    expect(alert).toHaveTextContent("Falha ao carregar posts.");
    const callsBeforeRetry = fetchMock.mock.calls.length;

    await userEvent.click(
      screen.getByRole("button", { name: "Tentar novamente" }),
    );

    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBeGreaterThan(callsBeforeRetry);
    });
  });
});
