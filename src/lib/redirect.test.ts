import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/lib/redirect";

describe("safeRedirectPath", () => {
  it("keeps a same-origin path with its query", () => {
    expect(safeRedirectPath("/auth/instagram/callback?code=a&state=b")).toBe(
      "/auth/instagram/callback?code=a&state=b",
    );
  });

  it.each([
    null,
    "",
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "dashboard",
  ])("falls back to the dashboard for %s", (value) => {
    expect(safeRedirectPath(value)).toBe("/dashboard");
  });
});
