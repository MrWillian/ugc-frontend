import type { CheckoutPlan, Plan, SubscriptionStatus } from "@/types";

export interface PlanTierLimits {
  activeCampaigns: number;
  postsPerMonth: number;
  widgets: number;
}

export const PLAN_TIER_LIMITS: Record<CheckoutPlan, PlanTierLimits> = {
  STARTER: { activeCampaigns: 1, postsPerMonth: 500, widgets: 1 },
  PRO: { activeCampaigns: 5, postsPerMonth: 5000, widgets: 5 },
  ENTERPRISE: { activeCampaigns: 15, postsPerMonth: 50000, widgets: 15 },
};

export const CHECKOUT_PLAN_ORDER: CheckoutPlan[] = ["STARTER", "PRO", "ENTERPRISE"];

export const PLAN_DISPLAY_NAMES: Record<CheckoutPlan, string> = {
  STARTER: "Starter",
  PRO: "Growth",
  ENTERPRISE: "Scale",
};

export function checkoutPlanForCurrentPlan(plan: Plan): CheckoutPlan {
  if (plan === "PRO") return "PRO";
  if (plan === "ENTERPRISE") return "ENTERPRISE";
  return "STARTER";
}

export function formatPlanLabel(plan: Plan): string {
  if (plan === "FREE") return "Gratuito";
  if (plan === "STARTER") return "Starter";
  if (plan === "PRO") return "Growth";
  return "Scale";
}

export function subscriptionStatusLabel(status: SubscriptionStatus): string | null {
  if (!status) return null;
  switch (status) {
    case "active":
      return "Ativa";
    case "canceled":
      return "Cancelada";
    case "past_due":
      return "Pagamento atrasado";
    case "trialing":
      return "Período de teste";
    case "paused":
      return "Pausada";
    case "unpaid":
      return "Não paga";
    case "incomplete":
    case "incomplete_expired":
      return "Pagamento incompleto";
    default:
      return status;
  }
}
