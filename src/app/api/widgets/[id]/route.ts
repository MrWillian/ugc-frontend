import type { UpdateWidgetBody, WidgetLayout } from "@/types";
import { forwardWidgets, requireAccessToken } from "../bff";

const LAYOUTS: WidgetLayout[] = ["GRID", "CAROUSEL", "MASONRY"];

function pickUpdateBody(input: UpdateWidgetBody): UpdateWidgetBody {
  const body: UpdateWidgetBody = {};
  if (typeof input.name === "string") body.name = input.name;
  if (input.layout && LAYOUTS.includes(input.layout)) {
    body.layout = input.layout;
  }
  if (
    input.filters &&
    typeof input.filters === "object" &&
    !Array.isArray(input.filters)
  ) {
    body.filters = input.filters;
  }
  return body;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAccessToken();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  return forwardWidgets(auth.token, `/widgets/${id}`, { method: "GET" });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAccessToken();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = pickUpdateBody((await request.json()) as UpdateWidgetBody);
  return forwardWidgets(auth.token, `/widgets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAccessToken();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  return forwardWidgets(auth.token, `/widgets/${id}`, { method: "DELETE" });
}
