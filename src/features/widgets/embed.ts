import type { Widget } from "@/types";

export function buildEmbedCode(widgetId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
  return `<div id="ugc-widget-${widgetId}"></div>\n<script src="${baseUrl}/api/widget/${widgetId}.js" defer></script>`;
}

export function widgetEmbedCode(
  widget: Pick<Widget, "id" | "embedCode">,
): string {
  const fromApi = widget.embedCode?.trim();
  return fromApi ? fromApi : buildEmbedCode(widget.id);
}
