import { describe, expect, it, vi } from "vitest";
import {
  accessTokenCookieOptions,
  backendErrorMessage,
  backendRequest,
} from "@/lib/auth-server";

describe("accessTokenCookieOptions", () => {
  it("creates an HTTP-only same-site cookie", () => {
    expect(accessTokenCookieOptions()).toMatchObject({
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    });
  });
});

describe("backendErrorMessage", () => {
  it("joins Nest validation messages", () => {
    expect(backendErrorMessage({ message: ["email must be an email", "password is too short"] }))
      .toBe("email must be an email password is too short");
  });
});

describe("backendRequest", () => {
  it("forwards the token as a Bearer header", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";

    await backendRequest("/auth/me", { method: "GET" }, "jwt-value");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/auth/me",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer jwt-value" }),
      }),
    );
    vi.unstubAllGlobals();
  });
});
