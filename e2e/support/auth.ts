import { expect, type Page } from "@playwright/test";
import type { Account } from "./creds";

/** Signs in through the real form and waits until the app has left the sign-in page. */
export async function signInThroughUi(page: Page, account: Account, keepSignedIn = true): Promise<void> {
  await page.goto("/");
  await page.getByLabel("Email address").fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  if (keepSignedIn) await page.getByLabel("Keep me signed in").check();
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).not.toHaveURL(/\/$/, { timeout: 60_000 });
}
