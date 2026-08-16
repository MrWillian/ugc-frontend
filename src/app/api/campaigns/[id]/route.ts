import type { UpdateCampaignBody } from "@/types";
import { forwardCampaigns, requireAccessToken } from "../bff";

function pickUpdateBody(input: UpdateCampaignBody): UpdateCampaignBody {
  const body: UpdateCampaignBody = {};
  if (typeof input.name === "string") body.name = input.name;
  if (typeof input.hashtag === "string") body.hashtag = input.hashtag;
  if (typeof input.terms_text === "string") body.terms_text = input.terms_text;
  if (typeof input.active === "boolean") body.active = input.active;
  return body;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAccessToken();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  return forwardCampaigns(auth.token, `/campaigns/${id}`, { method: "GET" });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAccessToken();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = pickUpdateBody((await request.json()) as UpdateCampaignBody);
  return forwardCampaigns(auth.token, `/campaigns/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
