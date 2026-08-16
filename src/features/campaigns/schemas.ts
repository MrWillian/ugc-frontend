import { z } from "zod";

export const campaignFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "O nome deve ter ao menos 3 caracteres.")
    .max(100, "O nome deve ter no máximo 100 caracteres."),
  hashtag: z
    .string()
    .trim()
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Use apenas letras, números e underscore, sem #.",
    ),
  terms_text: z.string(),
});

export const campaignEditSchema = campaignFormSchema.extend({
  active: z.boolean(),
});

export type CampaignFormValues = z.infer<typeof campaignFormSchema>;
export type CampaignEditValues = z.infer<typeof campaignEditSchema>;
