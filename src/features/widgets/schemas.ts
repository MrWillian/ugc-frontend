import { z } from "zod";

export const widgetFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome.")
    .max(100, "O nome deve ter no máximo 100 caracteres."),
  layout: z.enum(["GRID", "CAROUSEL", "MASONRY"]),
  filtersText: z.string(),
});

export type WidgetFormValues = z.infer<typeof widgetFormSchema>;
