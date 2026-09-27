import { NextResponse } from "next/server";
import {
  jsonFromBackend,
  requireAccessToken,
} from "@/app/api/campaigns/bff";
import { backendErrorMessage, backendRequest } from "@/lib/auth-server";

export { jsonFromBackend, requireAccessToken };

export async function forwardWidgets(
  token: string,
  path: string,
  init: RequestInit,
) {
  const backendResponse = await backendRequest(path, init, token);

  if (init.method === "DELETE") {
    const text = await backendResponse.text();
    if (!backendResponse.ok) {
      const payload: unknown = text ? JSON.parse(text) : null;
      return NextResponse.json(
        { message: backendErrorMessage(payload) },
        { status: backendResponse.status },
      );
    }
    if (!text) {
      return new NextResponse(null, { status: backendResponse.status });
    }
    return NextResponse.json(JSON.parse(text) as unknown, {
      status: backendResponse.status,
    });
  }

  return jsonFromBackend(backendResponse);
}
