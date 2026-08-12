import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { DashboardHeader } from "@/features/dashboard/DashboardHeader";
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

        if (url === "/api/campaigns") {
          return jsonResponse([
            { id: "1", active: true },
            { id: "2", active: false },
          ]);
        }
        if (url === "/api/posts?status=pending&limit=1") {
          return jsonResponse({
            data: [],
            meta: { page: 1, limit: 1, total: 7, totalPages: 7 },
          });
        }
        if (url === "/api/widgets") {
          return jsonResponse([{ id: "w1" }, { id: "w2" }]);
        }

        throw new Error(`Unexpected URL: ${url}`);
      });

    renderSummary();

    expect(await screen.findByText("Campanhas ativas")).toBeInTheDocument();
    expect(screen.getByText("Pendentes de moderação")).toBeInTheDocument();
    expect(screen.getByText("Widgets")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/campaigns", {
      credentials: "same-origin",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/posts?status=pending&limit=1",
      { credentials: "same-origin" },
    );
    expect(fetchMock).toHaveBeenCalledWith("/api/widgets", {
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
    let campaignCalls = 0;
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input) => {
        if (String(input) === "/api/campaigns") {
          campaignCalls += 1;
          if (campaignCalls > 2) {
            return new Promise<Response>(() => undefined);
          }
          return jsonResponse(
            { message: "Falha ao carregar campanhas." },
            { status: 500 },
          );
        }
        if (String(input) === "/api/posts?status=pending&limit=1") {
          return jsonResponse({
            data: [],
            meta: { page: 1, limit: 1, total: 7, totalPages: 7 },
          });
        }
        return jsonResponse([{ id: "w1" }, { id: "w2" }]);
      });

    renderSummary();

    const alert = await screen.findByRole("alert", {}, { timeout: 3_000 });
    expect(alert).toHaveTextContent("Falha ao carregar campanhas.");
    expect(screen.getByText("Campanhas ativas")).toBeInTheDocument();
    expect(screen.getByText("Pendentes de moderação")).toBeInTheDocument();
    expect(screen.getByText("Widgets")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    const callsBeforeRetry = fetchMock.mock.calls.length;

    await userEvent.click(
      screen.getByRole("button", { name: "Tentar novamente" }),
    );

    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBeGreaterThan(callsBeforeRetry);
    });
    expect(
      screen.getByRole("button", { name: "Tentando novamente…" }),
    ).toBeDisabled();
  });

  it("treats malformed successful payloads as zero counts", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      if (String(input) === "/api/campaigns") {
        return jsonResponse({ data: "not-an-array" });
      }
      if (String(input) === "/api/posts?status=pending&limit=1") {
        return jsonResponse({ data: [] });
      }
      return jsonResponse({ widgets: null });
    });

    renderSummary();

    expect(await screen.findByText("Campanhas ativas")).toBeInTheDocument();
    expect(screen.getAllByText("0")).toHaveLength(3);
  });

  it("renders the client name and plan in the header", () => {
    render(<DashboardHeader name="Acme" plan="FREE" />);

    expect(screen.getByRole("heading", { name: "Acme" })).toBeInTheDocument();
    expect(screen.getByText(/FREE/)).toBeInTheDocument();
  });
});
