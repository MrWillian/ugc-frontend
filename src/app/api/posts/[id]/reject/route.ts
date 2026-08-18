import type { RejectPostBody } from "@/types";
import { jsonFromBackend, requireAccessToken } from "@/app/api/campaigns/bff";
import { backendRequest } from "@/lib/auth-server";

function pickRejectBody(input: RejectPostBody): RejectPostBody {
  return {
    rejection_reasons:
      typeof input.rejection_reasons === "string" ? input.rejection_reasons : "",
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAccessToken();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = pickRejectBody((await request.json()) as RejectPostBody);
  const backendResponse = await backendRequest(
    `/posts/${id}/reject`,
    { method: "POST", body: JSON.stringify(body) },
    auth.token,
  );

  return jsonFromBackend(backendResponse);
}
