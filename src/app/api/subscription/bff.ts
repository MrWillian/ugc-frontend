import {
  jsonFromBackend,
  requireAccessToken,
} from "@/app/api/campaigns/bff";
import { backendRequest } from "@/lib/auth-server";

export { requireAccessToken };

export async function forwardSubscription(
  token: string,
  path: string,
  init: RequestInit,
) {
  const backendResponse = await backendRequest(path, init, token);
  return jsonFromBackend(backendResponse);
}
