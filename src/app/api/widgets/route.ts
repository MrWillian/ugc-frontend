import type { CreateWidgetBody, WidgetLayout } from "@/types";
import { forwardWidgets, requireAccessToken } from "./bff";

const LAYOUTS: WidgetLayout[] = ["GRID", "CAROUSEL", "MASONRY"];

function pickCreateBody(input: CreateWidgetBody): CreateWidgetBody {
  const body: CreateWidgetBody = { name: input.name };
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

export async function GET() {
  const auth = await requireAccessToken();
  if (!auth.ok) return auth.response;

  return forwardWidgets(auth.token, "/widgets", { method: "GET" });
}

export async function POST(request: Request) {
  const auth = await requireAccessToken();
  if (!auth.ok) return auth.response;

  const body = pickCreateBody((await request.json()) as CreateWidgetBody);
  return forwardWidgets(auth.token, "/widgets", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
