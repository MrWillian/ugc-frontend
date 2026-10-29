import { expect, test } from "@playwright/test";
import { injectTestUserSession, TEST_USER, testUrl } from "./helpers";

// The stub backend keeps the connection in memory, so the first test must see
// it disconnected before the second one completes another callback.
test.describe.configure({ mode: "serial" });

test("connects Instagram from the dashboard through the OAuth callback", async ({
  page,
}) => {
  await injectTestUserSession(page);
  await page.goto(testUrl("/dashboard"));

  await page.getByRole("button", { name: "Conectar Instagram" }).click();

  await expect(page.getByRole("status")).toHaveText(
    "Instagram conectado com sucesso.",
  );
  await expect(page.getByText("Conectado como @acme_studio")).toBeVisible();
  await expect(page).toHaveURL(testUrl("/dashboard"));
});

test("an expired session resumes the Instagram callback after login", async ({
  page,
}) => {
  const callbackPath = "/auth/instagram/callback?code=e2e-meta-code&state=client-e2e";

  await page.goto(testUrl(callbackPath));

  await expect(page).toHaveURL(/\/login\?next=/);
  await page.getByLabel("E-mail").fill(TEST_USER.email);
  await page.getByLabel("Senha", { exact: true }).fill(TEST_USER.password);
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.getByRole("status")).toHaveText(
    "Instagram conectado com sucesso.",
  );
  await expect(page).toHaveURL(testUrl("/dashboard"));
});
