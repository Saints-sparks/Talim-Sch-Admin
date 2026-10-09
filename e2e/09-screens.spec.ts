import fs from "node:fs";
import type { Page } from "@playwright/test";
import { test, expect } from "./support/fixtures";
import { authFile } from "./support/creds";
import { ADMIN_PAGES } from "./support/pages";
import { dismissGuide } from "./support/ui";

/**
 * Screenshots for visual review (gitignored, e2e/screenshots/):
 * - desktop light and dark: the pages the sidebar does not reach and that
 *   04-themes therefore skips, the ones the v1.5 restyle changed by colour
 *   only: onboarding, a student's and a teacher's profile and edit pages,
 *   and the transfer wizard;
 * - mobile (390×844, light): every sidebar page plus those.
 * Each page must load (no skeleton left) and, on a phone, not scroll sideways.
 */
const THEME_KEY = "talim_admin_theme";
const slug = (route: string): string => route.replace(/^\//, "").replace(/[/?=&]/g, "_") || "root";

/** Waits for the page's data, closes its first-visit guide and settles. */
async function settle(page: Page): Promise<void> {
  await expect(page.locator(".animate-pulse:visible")).toHaveCount(0, { timeout: 30_000 });
  await dismissGuide(page, 2_000);
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
  await page.waitForTimeout(600);
}

/** Screens a page and, on a phone, checks it does not scroll sideways. */
async function shoot(page: Page, dir: string, name: string, phone: boolean): Promise<string | null> {
  await settle(page);
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
  if (!phone) return null;
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  return overflow > 1 ? `${name} scrolls sideways by ${overflow}px` : null;
}

/** The pages outside the sidebar: onboarding, profiles and edits, the transfer wizard. */
async function extras(page: Page, dir: string, phone: boolean): Promise<string[]> {
  const problems: (string | null)[] = [];
  for (const route of ["/onboarding", "/onboarding/setup", "/transit/transfers/new/source", "/transit/transfers/new/target"]) {
    await page.goto(route);
    problems.push(await shoot(page, dir, slug(route), phone));
  }
  for (const [list, name, key] of [
    ["/users/students", "Ada Student", "users_student"],
    ["/users/teachers", "Tolu Teacher", "users_teacher"],
  ] as const) {
    await page.goto(list);
    await settle(page);
    const card = page.locator("div").filter({ hasText: name }).filter({ has: page.getByRole("button", { name: "View Profile" }) }).last();
    await card.getByRole("button", { name: "View Profile" }).click();
    await expect(page).toHaveURL(new RegExp(`${list}/[a-f0-9]{24}`));
    problems.push(await shoot(page, dir, `${key}-profile`, phone));
    await page.getByRole("button", { name: /^Edit/ }).first().click();
    await expect(page).toHaveURL(/\/edit$/);
    problems.push(await shoot(page, dir, `${key}-edit`, phone));
  }
  return problems.filter((p): p is string => p !== null);
}

for (const theme of ["light", "dark"] as const) {
  test.describe(`desktop ${theme}`, () => {
    test.use({ storageState: authFile("schoolAdmin"), colorScheme: theme });

    test(`restyled pages outside the sidebar (${theme})`, async ({ page }) => {
      test.setTimeout(300_000);
      await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [THEME_KEY, theme] as const);
      const dir = `e2e/screenshots/${theme}`;
      fs.mkdirSync(dir, { recursive: true });
      expect(await extras(page, dir, false)).toEqual([]);
    });
  });
}

test.describe("mobile", () => {
  test.use({ storageState: authFile("schoolAdmin"), viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("every page on a phone", async ({ page }) => {
    test.setTimeout(600_000);
    await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [THEME_KEY, "light"] as const);
    const dir = "e2e/screenshots/mobile";
    fs.mkdirSync(dir, { recursive: true });
    const problems: string[] = [];
    for (const spec of ADMIN_PAGES) {
      await page.goto(spec.path);
      await expect(page.getByText(spec.content).filter({ visible: true }).first()).toBeAttached();
      const problem = await shoot(page, dir, slug(spec.path), true);
      if (problem) problems.push(problem);
    }
    problems.push(...(await extras(page, dir, true)));
    expect(problems).toEqual([]);
  });
});
