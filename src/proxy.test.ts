import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { config, proxy } from "@/proxy";

describe("proxy config", () => {
  it("matches protected and public auth routes only", () => {
    expect(config.matcher).toEqual([
      "/dashboard/:path*",
      "/campaigns/:path*",
      "/widgets/:path*",
      "/login",
      "/signup",
    ]);
  });
});

describe("proxy", () => {
  it("redirects a missing-cookie dashboard request to login", () => {
    const response = proxy(new NextRequest("http://localhost/dashboard"));

    expect(response.headers.get("location")).toBe("http://localhost/login");
  });

  it("redirects a missing-cookie campaigns request to login", () => {
    const response = proxy(new NextRequest("http://localhost/campaigns"));

    expect(response.headers.get("location")).toBe("http://localhost/login");
  });

  it("redirects a missing-cookie nested widgets request to login", () => {
    const response = proxy(new NextRequest("http://localhost/widgets/abc/settings"));

    expect(response.headers.get("location")).toBe("http://localhost/login");
  });

  it("redirects an authenticated login request to dashboard", () => {
    const request = new NextRequest("http://localhost/login");
    request.cookies.set("accessToken", "jwt-value");

    const response = proxy(request);

    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
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
