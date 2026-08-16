import type { Campaign, CreateCampaignBody, UpdateCampaignBody } from "@/types";

async function responseMessage(response: Response): Promise<string> {
  const payload: unknown = await response.json().catch(() => null);

  if (typeof payload === "object" && payload !== null && "message" in payload) {
    const { message } = payload as { message?: unknown };

    if (Array.isArray(message)) {
      return message
        .filter((item): item is string => typeof item === "string")
        .join(" ");
    }

    if (typeof message === "string") {
      return message;
    }
  }

  return "Não foi possível concluir a solicitação.";
}

async function parseCampaign(response: Response): Promise<Campaign> {
  if (!response.ok) {
    throw new Error(await responseMessage(response));
  }

  return response.json() as Promise<Campaign>;
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  const response = await fetch("/api/campaigns", { credentials: "same-origin" });

  if (!response.ok) {
    throw new Error(await responseMessage(response));
  }

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
