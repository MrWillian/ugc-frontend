import { jsonFromBackend, requireAccessToken } from "@/app/api/campaigns/bff";
import { backendRequest } from "@/lib/auth-server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAccessToken();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const backendResponse = await backendRequest(
    `/posts/${id}`,
    { method: "GET" },
    auth.token,
  );

  return jsonFromBackend(backendResponse);
}
