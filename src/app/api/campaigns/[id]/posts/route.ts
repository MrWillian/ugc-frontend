import { allowedPostsSearch } from "@/app/api/posts/query";
import { forwardCampaigns, requireAccessToken } from "../../bff";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAccessToken();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  return forwardCampaigns(
    auth.token,
    `/campaigns/${id}/posts${allowedPostsSearch(searchParams)}`,
    { method: "GET" },
  );
}
