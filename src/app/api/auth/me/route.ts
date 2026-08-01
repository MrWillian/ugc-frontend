import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  backendErrorMessage,
  backendRequest,
} from "@/lib/auth-server";
import type { Client } from "@/types";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Não autenticado." },
      { status: 401 },
    );
  }

  const backendResponse = await backendRequest(
    "/auth/me",
    { method: "GET" },
    token,
  );
  const payload: unknown = await backendResponse.json();

  if (!backendResponse.ok) {
    cookieStore.delete(ACCESS_TOKEN_COOKIE);
    return NextResponse.json(
      { message: backendErrorMessage(payload) },
      { status: backendResponse.status },
    );
  }

  return NextResponse.json({ client: payload as Client });
}
