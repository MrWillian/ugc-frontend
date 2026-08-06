import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "@/app/dashboard/page";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardSummary } from "@/features/dashboard/useDashboardSummary";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/features/dashboard/useDashboardSummary", () => ({
  useDashboardSummary: vi.fn(),
}));

vi.mock("@/features/instagram/InstagramConnectionCard", () => ({
  InstagramConnectionCard: () => <section>Instagram</section>,
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
      activeCampaigns: 1,
      pendingPosts: 2,
      widgets: 3,
      isLoading: false,
      isError: false,
      errorMessage: null,
      isFetching: false,
      refetch: vi.fn(),
    });
  });

  it("composes the authenticated dashboard and runs the summary hook", () => {
    render(<DashboardPage />);

    expect(screen.getByRole("heading", { name: "Acme" })).toBeInTheDocument();
    expect(screen.getByLabelText("Resumo do dashboard")).toBeInTheDocument();
    expect(screen.getByText("Instagram")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sair" })).toHaveAttribute(
      "href",
      "/logout",
    );
    expect(useDashboardSummary).toHaveBeenCalledOnce();
  });
});
