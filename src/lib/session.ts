import { cache } from "react";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE, backendRequest } from "@/lib/auth-server";
import type { Client } from "@/types";

/**
 * Reads the signed-in client from the session cookie. Server-only, and cached
 * per request so several deferred slots can read it without refetching.
 *
 * Returns null rather than throwing: the proxy already redirects anonymous
 * visitors away from authenticated routes, so a null here means the token went
 * stale mid-session and the UI should degrade quietly.
 */
export const getSessionUser = cache(async (): Promise<Client | null> => {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return null;

  const response = await backendRequest("/auth/me", { method: "GET" }, token);
  if (!response.ok) return null;

  return (await response.json()) as Client;
});
