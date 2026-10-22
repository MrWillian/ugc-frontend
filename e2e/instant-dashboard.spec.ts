import { expect, test } from "@playwright/test";
import { instant } from "@next/playwright";
import {
  fetchDashboardDocument,
  injectTestUserSession,
  testUrl,
} from "./helpers";

// A sync node of /dashboard's static shell: the page header frame.
const SHELL_MARKER = '[data-testid="dashboard-shell-marker"]';
// Per-request data the shell defers. Asserting it is gated under the lock makes a
// vacuous pass impossible: if the lock never engaged, it would already be present.
const DEFERRED_FEED = "activity-feed-items";

test.beforeEach(async ({ page }) => {
  await injectTestUserSession(page);
});

test("soft nav /settings -> /dashboard commits the dashboard shell", async ({
  page,
}) => {
  await page.goto(testUrl("/settings"));

  const trigger = page.getByTestId("nav-link-dashboard");
  await expect(trigger).toBeVisible({ timeout: 20000 });

  await instant(page, async () => {
    await trigger.click();
    await expect(page.locator(SHELL_MARKER)).toBeVisible();
    await expect(page.getByTestId(DEFERRED_FEED)).toHaveCount(0);
  });

  await expect(page.getByTestId(DEFERRED_FEED)).toBeVisible();
});

test("initial load of /dashboard serves the static shell", async () => {
  const locked = await fetchDashboardDocument({ locked: true });

  expect(locked).toContain("dashboard-shell-marker");
  expect(locked).not.toContain(DEFERRED_FEED);

  // The unlocked document is the control: it proves the deferred marker is
  // reachable at all, so the assertion above cannot pass by the marker simply
  // never existing.
  const unlocked = await fetchDashboardDocument({ locked: false });
  expect(unlocked).toContain("dashboard-shell-marker");
  expect(unlocked).toContain(DEFERRED_FEED);
});

// D2: the shell must match the real render at every breakpoint, not just desktop.
test("the dashboard shell commits on a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const url = testUrl("/dashboard");

  await instant(
    page,
    async () => {
      await page.goto(url);
      await expect(page.locator(SHELL_MARKER)).toBeVisible();
    },
    { baseURL: new URL(url).origin },
  );
});
