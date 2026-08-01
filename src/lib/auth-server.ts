export const ACCESS_TOKEN_COOKIE = "accessToken";

export function accessTokenCookieOptions() {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export function backendErrorMessage(body: unknown): string {
  if (typeof body === "object" && body !== null && "message" in body) {
    const message = (body as { message: unknown }).message;
    return Array.isArray(message) ? message.join(" ") : String(message);
  }
  return "Não foi possível concluir a solicitação.";
}

export async function backendRequest(path: string, init: RequestInit, token?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL não está configurada.");

  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const headerRecord: Record<string, string> = {};
  headers.forEach((value, key) => {
    headerRecord[key === "authorization" ? "Authorization" : key] = value;
  });

  return fetch(`${baseUrl}${path}`, { ...init, headers: headerRecord, cache: "no-store" });
}
