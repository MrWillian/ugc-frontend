import { ensureOk } from "@/lib/api-error";
import type {
  CreateWidgetBody,
  PublicWidgetPost,
  UpdateWidgetBody,
  Widget,
} from "@/types";

async function parseWidget(response: Response): Promise<Widget> {
  await ensureOk(response);
  return response.json() as Promise<Widget>;
}

export async function fetchWidgets(): Promise<Widget[]> {
  const response = await fetch("/api/widgets", { credentials: "same-origin" });
  await ensureOk(response);
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
  await ensureOk(response);
}

export async function fetchWidgetPreviewPosts(
  id: string,
): Promise<PublicWidgetPost[]> {
  const response = await fetch(`/api/widget/${id}/posts`, {
    credentials: "same-origin",
  });
  await ensureOk(response);
  return response.json() as Promise<PublicWidgetPost[]>;
}
