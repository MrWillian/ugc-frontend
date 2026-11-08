import { ensureOk } from "@/lib/api-error";
import type { Campaign, CreateCampaignBody, UpdateCampaignBody } from "@/types";

async function parseCampaign(response: Response): Promise<Campaign> {
  await ensureOk(response);
  return response.json() as Promise<Campaign>;
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  const response = await fetch("/api/campaigns", { credentials: "same-origin" });
  await ensureOk(response);
  return response.json() as Promise<Campaign[]>;
}

export async function fetchCampaign(id: string): Promise<Campaign> {
  const response = await fetch(`/api/campaigns/${id}`, {
    credentials: "same-origin",
  });

  return parseCampaign(response);
}

export async function createCampaign(
  body: CreateCampaignBody,
): Promise<Campaign> {
  const response = await fetch("/api/campaigns", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return parseCampaign(response);
}

export async function updateCampaign(
  id: string,
  body: UpdateCampaignBody,
): Promise<Campaign> {
  const response = await fetch(`/api/campaigns/${id}`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return parseCampaign(response);
}
