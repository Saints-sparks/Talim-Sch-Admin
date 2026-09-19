import { test as setup, expect } from "@playwright/test";
import { ACCOUNTS, authFile } from "./support/creds";
import { signInThroughUi } from "./support/auth";

/** Signs each seeded admin in once and stores the session for the other specs. */
for (const key of ["schoolAdmin", "subAdmin"] as const) {
  setup(`sign in ${key}`, async ({ page }) => {
    await signInThroughUi(page, ACCOUNTS[key]);
    await expect(page).toHaveURL(/\/dashboard/);
    await page.context().storageState({ path: authFile(key) });
  });
}
