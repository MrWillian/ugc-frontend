import { describe, expect, it } from "vitest";
import { campaignEditSchema, campaignFormSchema } from "@/features/campaigns/schemas";

describe("campaignFormSchema", () => {
  it("rejects a name shorter than 3 characters", () => {
    const result = campaignFormSchema.safeParse({
      name: "ab",
      hashtag: "ugc",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      "O nome deve ter ao menos 3 caracteres.",
    );
  });

  it("rejects a hashtag with # or other disallowed characters", () => {
    const withHash = campaignFormSchema.safeParse({
      name: "Campanha",
      hashtag: "#ugc",
    });
    const withSpaces = campaignFormSchema.safeParse({
      name: "Campanha",
      hashtag: "ugc brand",
    });

    expect(withHash.success).toBe(false);
    expect(withSpaces.success).toBe(false);
    expect(withHash.error?.issues.map((issue) => issue.message)).toContain(
      "Use apenas letras, números e underscore, sem #.",
    );
  });

  it("accepts a valid payload with empty terms_text", () => {
    const result = campaignFormSchema.safeParse({
      name: "Campanha verão",
      hashtag: "Verao_2026",
      terms_text: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        name: "Campanha verão",
        hashtag: "Verao_2026",
        terms_text: "",
      });
    }
  });
});

describe("campaignEditSchema", () => {
  it("requires an active flag", () => {
    const result = campaignEditSchema.safeParse({
      name: "Campanha",
      hashtag: "ugc",
      terms_text: "",
      active: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.active).toBe(true);
    }
  });
});
