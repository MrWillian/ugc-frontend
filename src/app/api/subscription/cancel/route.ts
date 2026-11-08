import { forwardSubscription, requireAccessToken } from "../bff";

export async function POST() {
  const auth = await requireAccessToken();
  if (!auth.ok) return auth.response;

  return forwardSubscription(auth.token, "/subscription/cancel", {
    method: "POST",
    body: JSON.stringify({}),
  });
}
