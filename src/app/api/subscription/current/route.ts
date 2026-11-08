import { forwardSubscription, requireAccessToken } from "../bff";

export async function GET() {
  const auth = await requireAccessToken();
  if (!auth.ok) return auth.response;

  return forwardSubscription(auth.token, "/subscription/current", { method: "GET" });
}
