import { describe, expect, it } from "vitest";
import { widgetFormSchema } from "@/features/widgets/schemas";

describe("widgetFormSchema", () => {
  it("rejects an empty name", () => {
    const result = widgetFormSchema.safeParse({
      name: "  ",
      layout: "GRID",
      filtersText: "",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      "Informe o nome.",
    );
  });

  it("accepts a valid payload", () => {
    const result = widgetFormSchema.safeParse({
      name: " Galeria ",
      layout: "MASONRY",
      filtersText: '{"maxPosts":10}',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        name: "Galeria",
        layout: "MASONRY",
        filtersText: '{"maxPosts":10}',
      });
    }
  });
});
