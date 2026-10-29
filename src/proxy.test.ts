import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { config, proxy } from "@/proxy";

describe("proxy config", () => {
  it("matches protected and public auth routes only", () => {
    expect(config.matcher).toEqual([
      "/dashboard/:path*",
      "/campaigns/:path*",
      "/widgets/:path*",
      "/posts/:path*",
      "/moderation/:path*",
      "/settings/:path*",
      "/auth/instagram/callback",
      "/login",
      "/signup",
    ]);
  });
});

describe("proxy", () => {
  it("redirects a missing-cookie dashboard request to login", () => {
    const response = proxy(new NextRequest("http://localhost/dashboard"));

    expect(response.headers.get("location")).toBe(
      "http://localhost/login?next=%2Fdashboard",
    );
  });

  it("redirects a missing-cookie campaigns request to login", () => {
    const response = proxy(new NextRequest("http://localhost/campaigns"));

    expect(response.headers.get("location")).toBe(
      "http://localhost/login?next=%2Fcampaigns",
    );
  });

  it("redirects a missing-cookie nested posts request to login", () => {
    const response = proxy(new NextRequest("http://localhost/posts/post-1"));

    expect(response.headers.get("location")).toBe(
      "http://localhost/login?next=%2Fposts%2Fpost-1",
    );
  });

  it("redirects a missing-cookie moderation request to login", () => {
    const response = proxy(new NextRequest("http://localhost/moderation"));

    expect(response.headers.get("location")).toBe(
      "http://localhost/login?next=%2Fmoderation",
    );
  });

  it("redirects a missing-cookie settings request to login", () => {
    const response = proxy(new NextRequest("http://localhost/settings"));

    expect(response.headers.get("location")).toBe(
      "http://localhost/login?next=%2Fsettings",
    );
  });

  it("redirects a missing-cookie nested widgets request to login", () => {
    const response = proxy(new NextRequest("http://localhost/widgets/abc/settings"));

    expect(response.headers.get("location")).toBe(
      "http://localhost/login?next=%2Fwidgets%2Fabc%2Fsettings",
    );
  });

  it("sends a missing-cookie Instagram callback to login with its full return URL", () => {
    const response = proxy(
      new NextRequest("http://localhost/auth/instagram/callback?code=meta-code&state=client-id"),
    );

    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("next")).toBe(
      "/auth/instagram/callback?code=meta-code&state=client-id",
    );
  });

  it("allows an authenticated Instagram callback through", () => {
    const request = new NextRequest("http://localhost/auth/instagram/callback?code=a&state=b");
    request.cookies.set("accessToken", "jwt-value");

    expect(proxy(request).headers.get("location")).toBeNull();
  });

  it("redirects an authenticated login request to dashboard", () => {
    const request = new NextRequest("http://localhost/login");
    request.cookies.set("accessToken", "jwt-value");

    const response = proxy(request);

    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("sends an authenticated login request to its safe return URL", () => {
    const request = new NextRequest(
      "http://localhost/login?next=%2Fauth%2Finstagram%2Fcallback%3Fcode%3Da",
    );
    request.cookies.set("accessToken", "jwt-value");

    expect(proxy(request).headers.get("location")).toBe(
      "http://localhost/auth/instagram/callback?code=a",
    );
  });

  it("ignores an external return URL on an authenticated login request", () => {
    const request = new NextRequest("http://localhost/login?next=%2F%2Fevil.test");
    request.cookies.set("accessToken", "jwt-value");

    expect(proxy(request).headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("redirects an authenticated signup request to dashboard", () => {
    const request = new NextRequest("http://localhost/signup");
    request.cookies.set("accessToken", "jwt-value");

    const response = proxy(request);

    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("allows an authenticated dashboard request through", () => {
    const request = new NextRequest("http://localhost/dashboard");
    request.cookies.set("accessToken", "jwt-value");

    const response = proxy(request);

    expect(response.headers.get("location")).toBeNull();
  });

  it("allows an unauthenticated login request through", () => {
    const response = proxy(new NextRequest("http://localhost/login"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("does not redirect unrelated paths", () => {
    const response = proxy(new NextRequest("http://localhost/about"));

    expect(response.headers.get("location")).toBeNull();
  });
});
