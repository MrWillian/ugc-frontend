import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "@/app/(authenticated)/dashboard/page";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardSummary } from "@/features/dashboard/useDashboardSummary";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/features/dashboard/useDashboardSummary", () => ({
  useDashboardSummary: vi.fn(),
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
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "client-1",
        name: "Acme",
        email: "owner@acme.test",
        subdomain: "acme",
        plan: "FREE",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: "active",
        currentPeriodEnd: null,
        companyName: null,
        createdAt: "2026-08-05T00:00:00.000Z",
        updatedAt: "2026-08-05T00:00:00.000Z",
      },
      isLoading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
    });
    vi.mocked(useDashboardSummary).mockReturnValue({
      totalPosts: 10,
      pendingPosts: 2,
      approvedPosts: 5,
      widgets: 3,
      todayCollected: null,
      todayPending: null,
      todayApproved: null,
      isLoading: false,
      isError: false,
      errorMessage: null,
      isFetching: false,
      refetch: vi.fn(),
    });
  });

  it("composes the authenticated dashboard and runs the summary hook", () => {
    render(
      <QueryProvider>
        <DashboardPage />
      </QueryProvider>,
    );

    expect(screen.getByRole("heading", { name: /Olá, Acme/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Resumo do dashboard")).toBeInTheDocument();
    expect(useDashboardSummary).toHaveBeenCalledOnce();
  });
});
