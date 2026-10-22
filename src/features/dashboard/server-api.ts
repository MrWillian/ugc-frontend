import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE, backendRequest } from "@/lib/auth-server";
import type { CollectedPost, PaginatedResponse } from "@/types";

/**
 * Server-side counterpart of `@/features/dashboard/api`. The client helpers go
 * through the BFF route handlers; on the server we hold the token already, so
 * the extra hop would only add latency to a deferred render.
 */
export async function fetchRecentPosts(limit: number): Promise<CollectedPost[]> {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return [];

  const response = await backendRequest(
    `/posts?limit=${limit}`,
    { method: "GET" },
    token,
  );
  if (!response.ok) {
    throw new Error("Não foi possível carregar atividades.");
  }

  const payload = (await response.json()) as PaginatedResponse<CollectedPost>;
  return payload.data ?? [];
}
