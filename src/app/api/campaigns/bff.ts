import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  backendErrorMessage,
  backendRequest,
} from "@/lib/auth-server";

export async function requireAccessToken(): Promise<
  { ok: true; token: string } | { ok: false; response: NextResponse }
> {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Não autenticado." }, { status: 401 }),
    };
  }

  return { ok: true, token };
}

export async function jsonFromBackend(backendResponse: Response) {
  const payload: unknown = await backendResponse.json();

  if (!backendResponse.ok) {
    return NextResponse.json(
      { message: backendErrorMessage(payload) },
      { status: backendResponse.status },
    );
  }

  return NextResponse.json(payload, { status: backendResponse.status });
}

export async function forwardCampaigns(
  token: string,
  path: string,
  init: RequestInit,
) {
  const backendResponse = await backendRequest(path, init, token);
  return jsonFromBackend(backendResponse);
}
