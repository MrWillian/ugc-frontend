import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cookieSpies = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieSpies),
}));

import { POST as loginPost } from "@/app/api/auth/login/route";
import { POST as logoutPost } from "@/app/api/auth/logout/route";
import { GET as meGet } from "@/app/api/auth/me/route";
import { POST as signupPost } from "@/app/api/auth/signup/route";

const client = {
  id: "client-1",
  email: "a@b.com",
  name: "Acme",
  subdomain: "acme",
  plan: "FREE",
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  subscriptionStatus: "INACTIVE",
  currentPeriodEnd: null,
  companyName: null,
  createdAt: "2026-07-30T00:00:00.000Z",
  updatedAt: "2026-07-30T00:00:00.000Z",
};

const validSignup = {
  name: "Acme",
  email: "a@b.com",
  password: "password123",
  subdomain: "acme",
};

describe("BFF auth routes", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";
    cookieSpies.get.mockReset();
    cookieSpies.set.mockReset();
    cookieSpies.delete.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the client and sets an HTTP-only cookie after login", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      Response.json({ accessToken: "jwt-value", client }, { status: 201 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const body = { email: "a@b.com", password: "password123" };
    const requestBody = { ...body, role: "admin", plan: "ENTERPRISE" };

    const response = await loginPost(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify(requestBody),
      }),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/auth/login",
      expect.objectContaining({ method: "POST", body: JSON.stringify(body) }),
    );
    expect(await response.json()).toEqual({ client });
    expect(response.headers.get("set-cookie")).toContain("accessToken=jwt-value");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("preserves the backend status and normalized message on login failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        Response.json({ message: ["Email inválido", "Senha inválida"] }, { status: 400 }),
      ),
    );

    const response = await loginPost(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "invalid", password: "short" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "Email inválido Senha inválida" });
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("returns the client and sets the cookie after signup", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      Response.json({ accessToken: "signup-jwt", client }, { status: 201 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const requestBody = {
      ...validSignup,
      plan: "ENTERPRISE",
      companyName: "Injected Company",
    };

    const response = await signupPost(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(requestBody),
      }),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/auth/signup",
      expect.objectContaining({ method: "POST", body: JSON.stringify(validSignup) }),
    );
    expect(await response.json()).toEqual({ client });
    expect(response.headers.get("set-cookie")).toContain("accessToken=signup-jwt");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("preserves the backend status and message on signup failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        Response.json({ message: "Email já cadastrado" }, { status: 409 }),
      ),
    );

    const response = await signupPost(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(validSignup),
      }),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ message: "Email já cadastrado" });
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("rejects /me without an access-token cookie", async () => {
    cookieSpies.get.mockReturnValue(undefined);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await meGet();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: "Não autenticado." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards the access token and returns the current client from /me", async () => {
    cookieSpies.get.mockReturnValue({ value: "jwt-value" });
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json(client));
    vi.stubGlobal("fetch", fetchMock);

    const response = await meGet();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/auth/me",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer jwt-value" }),
      }),
    );
    expect(await response.json()).toEqual({ client });
    expect(cookieSpies.delete).not.toHaveBeenCalled();
  });

  it("preserves a backend /me failure and deletes the stale cookie", async () => {
    cookieSpies.get.mockReturnValue({ value: "stale-jwt" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        Response.json({ message: "Token expirado" }, { status: 401 }),
      ),
    );

    const response = await meGet();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: "Token expirado" });
    expect(cookieSpies.delete).toHaveBeenCalledWith("accessToken");
  });

  it("forwards the token on logout and always deletes the cookie", async () => {
    cookieSpies.get.mockReturnValue({ value: "jwt-value" });
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await logoutPost();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/auth/logout",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer jwt-value" }),
      }),
    );
    expect(await response.json()).toEqual({ ok: true });
    expect(cookieSpies.delete).toHaveBeenCalledWith("accessToken");
  });

  it("succeeds and deletes the cookie when the logout backend request throws", async () => {
    cookieSpies.get.mockReturnValue({ value: "jwt-value" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new Error("network unavailable")));

    const response = await logoutPost();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(cookieSpies.delete).toHaveBeenCalledWith("accessToken");
  });

  it("deletes the cookie and succeeds on logout without a token", async () => {
    cookieSpies.get.mockReturnValue(undefined);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await logoutPost();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(await response.json()).toEqual({ ok: true });
    expect(cookieSpies.delete).toHaveBeenCalledWith("accessToken");
  });
});
