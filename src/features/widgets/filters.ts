import type { WidgetFilters } from "@/types";

export function parseFiltersJson(
  raw: string,
):
  | { ok: true; filters: WidgetFilters | undefined }
  | { ok: false; message: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: true, filters: undefined };
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (
      parsed === null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return { ok: false, message: "Filters deve ser um objeto JSON." };
    }
    return { ok: true, filters: parsed as WidgetFilters };
  } catch {
    return { ok: false, message: "JSON de filters inválido." };
  }
}
