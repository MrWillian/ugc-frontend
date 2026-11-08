import type { CheckoutPlan, CreateCheckoutBody } from "@/types";
import { forwardSubscription, requireAccessToken } from "../bff";

const CHECKOUT_PLANS: CheckoutPlan[] = ["STARTER", "PRO", "ENTERPRISE"];

function pickCreateCheckoutBody(input: CreateCheckoutBody): CreateCheckoutBody {
  const body: CreateCheckoutBody = {};
  if (input.plan && CHECKOUT_PLANS.includes(input.plan)) {
    body.plan = input.plan;
  }
  if (typeof input.priceId === "string" && input.priceId.trim()) {
    body.priceId = input.priceId.trim();
  }
  return body;
}

export async function POST(request: Request) {
  const auth = await requireAccessToken();
  if (!auth.ok) return auth.response;

  const body = pickCreateCheckoutBody((await request.json()) as CreateCheckoutBody);
  return forwardSubscription(auth.token, "/subscription/create-checkout", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
