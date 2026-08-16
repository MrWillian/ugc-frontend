import type { CreateCampaignBody } from "@/types";
import { forwardCampaigns, requireAccessToken } from "./bff";

export async function GET() {
  const auth = await requireAccessToken();
  if (!auth.ok) return auth.response;

  return forwardCampaigns(auth.token, "/campaigns", { method: "GET" });
}

export async function POST(request: Request) {
  const auth = await requireAccessToken();
  if (!auth.ok) return auth.response;

  const { name, hashtag, terms_text } = (await request.json()) as CreateCampaignBody;
  const body: CreateCampaignBody = { name, hashtag };
  if (typeof terms_text === "string") {
    body.terms_text = terms_text;
  }

  return forwardCampaigns(auth.token, "/campaigns", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
