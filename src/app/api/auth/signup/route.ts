import { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  accessTokenCookieOptions,
  backendErrorMessage,
  backendRequest,
} from "@/lib/auth-server";
import type { AuthResponse, SignupBody } from "@/types";

export async function POST(request: Request) {
  const { name, email, password, subdomain } = await request.json() as SignupBody;
  const backendResponse = await backendRequest("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password, subdomain }),
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
