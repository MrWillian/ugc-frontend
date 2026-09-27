import { describe, expect, it } from "vitest";
import { parseFiltersJson } from "@/features/widgets/filters";

describe("parseFiltersJson", () => {
  it("returns undefined filters for blank input", () => {
    expect(parseFiltersJson("")).toEqual({ ok: true, filters: undefined });
    expect(parseFiltersJson("   ")).toEqual({ ok: true, filters: undefined });
  });

  it("parses a JSON object", () => {
    expect(parseFiltersJson('{"maxPosts": 10}')).toEqual({
      ok: true,
      filters: { maxPosts: 10 },
    });
  });

  it("rejects invalid JSON, arrays, and primitives", () => {
    expect(parseFiltersJson("{")).toEqual({
      ok: false,
      message: "JSON de filters inválido.",
    });
    expect(parseFiltersJson("[1]")).toEqual({
      ok: false,
      message: "Filters deve ser um objeto JSON.",
    });
    expect(parseFiltersJson("10")).toEqual({
      ok: false,
      message: "Filters deve ser um objeto JSON.",
    });
  });
});
