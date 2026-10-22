import { request as playwrightRequest, type Page } from "@playwright/test";
import { baseURL } from "../playwright.config";

export const TEST_USER = {
  email: "e2e@socialproof.test",
  password: "e2e-password",
  name: "Acme Studio",
  plan: "PRO",
} as const;

export function testUrl(path: string): string {
  return new URL(path, baseURL).toString();
}

/** The cookie @next/playwright's instant() sets to hold back dynamic data. */
export const INSTANT_COOKIE = "next-instant-navigation-testing";

async function loginCookie() {
  const context = await playwrightRequest.newContext({ baseURL });

  const response = await context.post("/api/auth/login", {
    data: { email: TEST_USER.email, password: TEST_USER.password },
  });

  if (!response.ok()) {
    throw new Error(
      `e2e login failed: ${response.status()} ${await response.text()}`,
    );
  }

  const { cookies } = await context.storageState();
  await context.dispose();

  const accessToken = cookies.find((cookie) => cookie.name === "accessToken");
  if (!accessToken) {
    throw new Error("e2e login returned no accessToken cookie");
  }

  return accessToken;
}

/**
 * Establishes the session without navigating `page`. An initial-load instant()
 * test needs the cookie in place before the measured `goto`, and a login helper
 * that drives `page` itself would run that navigation unmeasured.
 */
export async function injectTestUserSession(page: Page): Promise<void> {
  await page.context().addCookies([await loginCookie()]);
}

/**
 * Fetches the raw /dashboard document as the test user, optionally with the
 * instant lock engaged. Reading the document directly is how the initial-load
 * contract is checked: in a browser the client resumes the postponed render as
 * soon as the shell lands, so a DOM assertion races that resume, while the
 * served bytes are deterministic.
 */
export async function fetchDashboardDocument(
  { locked }: { locked: boolean },
): Promise<string> {
  const accessToken = await loginCookie();
  const cookie = [
    `accessToken=${accessToken.value}`,
    ...(locked ? [`${INSTANT_COOKIE}=${encodeURIComponent('[0,"e2e"]')}`] : []),
  ].join("; ");

  const context = await playwrightRequest.newContext({
    baseURL,
    extraHTTPHeaders: { cookie },
  });
  const response = await context.get("/dashboard");
  const body = await response.text();
  await context.dispose();

  return body;
}
