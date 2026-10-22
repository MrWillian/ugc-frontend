import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DashboardPage from "@/app/(authenticated)/dashboard/page";
import { QueryProvider } from "@/components/providers/QueryProvider";

// The page is a server component now: it renders a synchronous shell and defers
// every per-request read into its own boundary. These stand in for the deferred
// children, which are async server components and cannot render in jsdom.
// Whether the shell actually commits is covered by e2e/instant-dashboard.spec.ts.
vi.mock("@/features/dashboard/DashboardGreeting", () => ({
  DashboardGreeting: () => <>Olá, Acme</>,
  DashboardGreetingSkeleton: () => <span />,
  DashboardPlan: () => <>Plano FREE</>,
  DashboardPlanSkeleton: () => <span />,
}));

vi.mock("@/features/dashboard/DashboardSummaryCards", () => ({
  DashboardSummaryCards: () => <section aria-label="Resumo do dashboard" />,
  DashboardSummaryCardsSkeleton: () => <p>Carregando resumo…</p>,
}));

vi.mock("@/features/dashboard/DashboardChart", () => ({
  DashboardChart: () => <div>Chart</div>,
}));

vi.mock("@/features/dashboard/DashboardActivityFeed", () => ({
  DashboardActivityFeed: () => <div>Feed</div>,
}));

vi.mock("@/features/dashboard/DashboardPopularWidget", () => ({
  DashboardPopularWidget: () => <div>Popular</div>,
}));

vi.mock("@/features/dashboard/DashboardFilterPanel", () => ({
  DashboardFilterPanel: () => <div>Filter</div>,
}));

describe("DashboardPage", () => {
  it("composes the authenticated dashboard", () => {
    render(
      <QueryProvider>
        <DashboardPage />
      </QueryProvider>,
    );

    expect(screen.getByRole("heading", { name: /Olá, Acme/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Resumo do dashboard")).toBeInTheDocument();
    expect(screen.getByText("Feed")).toBeInTheDocument();
  });

  it("marks the page header as the static shell marker", () => {
    render(
      <QueryProvider>
        <DashboardPage />
      </QueryProvider>,
    );

    expect(screen.getByTestId("dashboard-shell-marker")).toBeInTheDocument();
  });
});
