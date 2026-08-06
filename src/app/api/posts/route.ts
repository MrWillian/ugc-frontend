import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  backendErrorMessage,
  backendRequest,
} from "@/lib/auth-server";

export async function GET(request: Request) {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  const { search } = new URL(request.url);
  const backendResponse = await backendRequest(
    `/posts${search}`,
    { method: "GET" },
    token,
  );
  const payload: unknown = await backendResponse.json();

  if (!backendResponse.ok) {
    return NextResponse.json(
      { message: backendErrorMessage(payload) },
      { status: backendResponse.status },
    );
  }

  return NextResponse.json(payload);
}
