import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { allowedPostsSearch } from "@/app/api/posts/query";
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

  const { searchParams } = new URL(request.url);
  const backendResponse = await backendRequest(
    `/posts${allowedPostsSearch(searchParams)}`,
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
