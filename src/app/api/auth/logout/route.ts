import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, backendRequest } from "@/lib/auth-server";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  try {
    if (token) {
      await backendRequest("/auth/logout", { method: "POST" }, token);
    }
  } catch {
    // Local logout must complete even if the backend cannot be reached.
  } finally {
    cookieStore.delete(ACCESS_TOKEN_COOKIE);
  }

  return NextResponse.json({ ok: true });
}
