import { afterEach, describe, expect, it } from "vitest";
import { buildEmbedCode, widgetEmbedCode } from "@/features/widgets/embed";

describe("widget embed helpers", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  it("builds the Nest script snippet from NEXT_PUBLIC_API_URL", () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:3000";
    expect(buildEmbedCode("abc")).toBe(
      `<div id="ugc-widget-abc"></div>\n<script src="http://localhost:3000/api/widget/abc.js" defer></script>`,
    );
  });

  it("prefers a non-empty embedCode from the API", () => {
    expect(
      widgetEmbedCode({
        id: "abc",
        embedCode: '<div id="ugc-widget-abc"></div>',
      }),
    ).toBe('<div id="ugc-widget-abc"></div>');
  });

  it("falls back when embedCode is missing or blank", () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:3000";
    expect(widgetEmbedCode({ id: "abc" })).toBe(buildEmbedCode("abc"));
    expect(widgetEmbedCode({ id: "abc", embedCode: "  " })).toBe(
      buildEmbedCode("abc"),
    );
  });
});
