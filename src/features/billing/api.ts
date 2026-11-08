import { ensureOk } from "@/lib/api-error";
import type {
  CancelSubscriptionResponse,
  CheckoutPlan,
  CreateCheckoutResponse,
  CurrentSubscription,
} from "@/types";

export async function fetchCurrentSubscription(): Promise<CurrentSubscription> {
  const response = await fetch("/api/subscription/current", {
    credentials: "same-origin",
  });
  await ensureOk(response);
  return response.json() as Promise<CurrentSubscription>;
}

export async function createCheckoutSession(
  plan: CheckoutPlan,
): Promise<CreateCheckoutResponse> {
  const response = await fetch("/api/subscription/create-checkout", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
  });
  await ensureOk(response);
  return response.json() as Promise<CreateCheckoutResponse>;
}

export async function cancelSubscription(): Promise<CancelSubscriptionResponse> {
  const response = await fetch("/api/subscription/cancel", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  await ensureOk(response);
  return response.json() as Promise<CancelSubscriptionResponse>;
}
