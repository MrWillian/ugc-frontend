import type {
  CreateWidgetBody,
  PublicWidgetPost,
  UpdateWidgetBody,
  Widget,
} from "@/types";

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

async function parseWidget(response: Response): Promise<Widget> {
  if (!response.ok) {
    throw new Error(await responseMessage(response));
  }
  return response.json() as Promise<Widget>;
}

export async function fetchWidgets(): Promise<Widget[]> {
  const response = await fetch("/api/widgets", { credentials: "same-origin" });
  if (!response.ok) {
    throw new Error(await responseMessage(response));
  }
  return response.json() as Promise<Widget[]>;
}

export async function fetchWidget(id: string): Promise<Widget> {
  const response = await fetch(`/api/widgets/${id}`, {
    credentials: "same-origin",
  });
  return parseWidget(response);
}

export async function createWidget(body: CreateWidgetBody): Promise<Widget> {
  const response = await fetch("/api/widgets", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseWidget(response);
}

export async function updateWidget(
  id: string,
  body: UpdateWidgetBody,
): Promise<Widget> {
  const response = await fetch(`/api/widgets/${id}`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseWidget(response);
}

export async function deleteWidget(id: string): Promise<void> {
  const response = await fetch(`/api/widgets/${id}`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  if (!response.ok) {
    throw new Error(await responseMessage(response));
  }
}

export async function fetchWidgetPreviewPosts(
  id: string,
): Promise<PublicWidgetPost[]> {
  const response = await fetch(`/api/widget/${id}/posts`, {
    credentials: "same-origin",
  });
  if (!response.ok) {
    throw new Error(await responseMessage(response));
  }
  return response.json() as Promise<PublicWidgetPost[]>;
}
