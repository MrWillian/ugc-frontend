import { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  accessTokenCookieOptions,
  backendErrorMessage,
  backendRequest,
} from "@/lib/auth-server";
import type { AuthResponse, LoginBody } from "@/types";

export async function POST(request: Request) {
  const { email, password } = await request.json() as LoginBody;
  const backendResponse = await backendRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const payload: unknown = await backendResponse.json();

  if (!backendResponse.ok) {
    return NextResponse.json(
      { message: backendErrorMessage(payload) },
      { status: backendResponse.status },
    );
  }

  const auth = payload as AuthResponse;
  const response = NextResponse.json({ client: auth.client });
  response.cookies.set(
    ACCESS_TOKEN_COOKIE,
    auth.accessToken,
    accessTokenCookieOptions(),
  );
  return response;
}
