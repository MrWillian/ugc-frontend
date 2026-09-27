import type { WidgetLayout } from "@/types";

export const WIDGET_LAYOUT_OPTIONS = [
  { value: "GRID", label: "Grid" },
  { value: "CAROUSEL", label: "Carousel" },
  { value: "MASONRY", label: "Masonry" },
] as const satisfies readonly { value: WidgetLayout; label: string }[];

export function layoutLabel(layout: WidgetLayout): string {
  return (
    WIDGET_LAYOUT_OPTIONS.find((option) => option.value === layout)?.label ??
    layout
  );
}
