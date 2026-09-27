import { NextResponse } from "next/server";
import { backendErrorMessage, backendRequest } from "@/lib/auth-server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const backendResponse = await backendRequest(
    `/api/widget/${id}/posts`,
    { method: "GET" },
  );
  const payload: unknown = await backendResponse.json().catch(() => null);

  if (!backendResponse.ok) {
    return NextResponse.json(
      { message: backendErrorMessage(payload) },
      { status: backendResponse.status },
    );
  }

  return NextResponse.json(payload, { status: backendResponse.status });
}
