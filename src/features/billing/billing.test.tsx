import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { BillingPage } from "@/features/billing/BillingPage";

const subscriptionFree = {
  plan: "FREE",
  subscriptionStatus: null,
  currentPeriodEnd: null,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
};

const subscriptionPaid = {
  plan: "PRO",
  subscriptionStatus: "active",
  currentPeriodEnd: "2026-12-15T12:00:00.000Z",
  stripeCustomerId: "cus_123",
  stripeSubscriptionId: "sub_123",
};

describe("BillingPage", () => {
  const assign = vi.fn();

  beforeEach(() => {
    assign.mockReset();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, assign },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows current plan and treats missing renewal as normal", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      Response.json(subscriptionFree),
    );

    render(
      <QueryProvider>
        <BillingPage />
      </QueryProvider>,
    );

    expect(await screen.findByText("Gratuito")).toBeInTheDocument();
    expect(screen.getByText("Sem cobrança recorrente neste plano.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancelar assinatura" })).not.toBeInTheDocument();
  });

  it("marks the current tier in the comparison", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      Response.json(subscriptionFree),
    );

    render(
      <QueryProvider>
        <BillingPage />
      </QueryProvider>,
    );

    await screen.findByText("Seu plano");
    const starterHeading = screen.getByRole("heading", { name: "Starter" });
    expect(starterHeading.closest("li")?.className).toMatch(/border-primary/);
  });

  it("redirects to Stripe on upgrade click", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json(subscriptionFree))
      .mockResolvedValueOnce(
        Response.json({
          sessionId: "cs_test",
          url: "https://checkout.stripe.test/session",
        }),
      );

    render(
      <QueryProvider>
        <BillingPage />
      </QueryProvider>,
    );

    await screen.findByText("Gratuito");
    const growthCard = screen.getByRole("heading", { name: "Growth" }).closest("li");
    expect(growthCard).toBeTruthy();
    await user.click(
      within(growthCard as HTMLElement).getByRole("button", { name: "Fazer upgrade" }),
    );

    await waitFor(() => {
      expect(assign).toHaveBeenCalledWith("https://checkout.stripe.test/session");
    });
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/subscription/create-checkout",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ plan: "PRO" }),
      }),
    );
  });

  it("shows cancel flow for active stripe subscription", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json(subscriptionPaid))
      .mockResolvedValueOnce(
        Response.json({ subscriptionStatus: "canceled" }),
      )
      .mockResolvedValueOnce(
        Response.json({
          ...subscriptionPaid,
          plan: "STARTER",
          subscriptionStatus: "canceled",
          stripeSubscriptionId: null,
        }),
      );

    render(
      <QueryProvider>
        <BillingPage />
      </QueryProvider>,
    );

    await screen.findByText("Ativa");
    await user.click(screen.getByRole("button", { name: "Cancelar assinatura" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/subscription/cancel",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  it("shows subscription load error with retry", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        Response.json({ message: "Falha no servidor." }, { status: 500 }),
      )
      .mockResolvedValueOnce(Response.json(subscriptionFree));

    render(
      <QueryProvider>
        <BillingPage />
      </QueryProvider>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Falha no servidor.");
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByText("Gratuito")).toBeInTheDocument();
  });
});
