import type {
  Campaign,
  CollectedPost,
  PaginatedResponse,
  Widget,
} from "@/types";

async function readError(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  if (typeof body === "object" && body !== null && "message" in body) {
    const { message } = body as { message?: unknown };
    if (Array.isArray(message)) {
      return message
        .filter((item): item is string => typeof item === "string")
        .join(" ");
    }
    if (typeof message === "string") return message;
  }
  return "Não foi possível carregar o resumo.";
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  const response = await fetch("/api/campaigns", {
    credentials: "same-origin",
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<Campaign[]>;
}

export async function fetchPendingPostsMeta(): Promise<
  PaginatedResponse<CollectedPost>
> {
  const response = await fetch("/api/posts?status=pending&limit=1", {
    credentials: "same-origin",
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<PaginatedResponse<CollectedPost>>;
}

export async function fetchWidgets(): Promise<Widget[]> {
  const response = await fetch("/api/widgets", {
    credentials: "same-origin",
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<Widget[]>;
}
