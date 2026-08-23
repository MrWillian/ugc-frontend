import { jsonFromBackend, requireAccessToken } from "@/app/api/campaigns/bff";
import { backendRequest } from "@/lib/auth-server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ permissionId: string }> },
) {
  const auth = await requireAccessToken();
  if (!auth.ok) return auth.response;

  const { permissionId } = await params;
  const backendResponse = await backendRequest(
    `/consent/resend/${permissionId}`,
    { method: "POST" },
    auth.token,
  );

  return jsonFromBackend(backendResponse);
}
