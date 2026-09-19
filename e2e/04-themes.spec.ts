import fs from "node:fs";
import { test, expect } from "./support/fixtures";
import { ADMIN_PAGES } from "./support/pages";
import { authFile } from "./support/creds";
import { dismissGuide } from "./support/ui";
import { contrastOf, writeContrastReport, type PageContrast } from "./support/contrast";

/**
 * Both themes: every page is screenshotted (e2e/screenshots/<theme>/) and run
 * through axe's colour-contrast rule. Contrast does NOT fail the suite yet; the
 * counts go to e2e/reports/contrast-<theme>.json and the console. What does
 * fail: the requested theme not being the one applied.
 */
const THEME_KEY = "talim_admin_theme";
const slug = (route: string): string => (route === "/" ? "sign-in" : route.replace(/^\//, "").replace(/\//g, "_"));

for (const theme of ["light", "dark"] as const) {
  test.describe(`${theme} theme`, () => {
    test.use({ storageState: authFile("schoolAdmin"), colorScheme: theme });

    test(`every page in the ${theme} theme`, async ({ page, browser }) => {
      test.setTimeout(600_000);
      fs.mkdirSync(`e2e/screenshots/${theme}`, { recursive: true });
      await page.addInitScript(
        ([key, value]) => {
          try {
            localStorage.setItem(key, value);
          } catch {
            /* storage blocked: the test below will say so */
          }
        },
        [THEME_KEY, theme] as const,
      );

      const results: PageContrast[] = [];
      for (const spec of ADMIN_PAGES) {
        await page.goto(spec.path);
        await expect(page.locator(".animate-pulse:visible")).toHaveCount(0, { timeout: 30_000 });
        await expect(page.getByText(spec.content).filter({ visible: true }).first()).toBeVisible();
        await dismissGuide(page, 2_000); // the first-visit tour dims the page and would skew every contrast reading
        await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
        await page.waitForTimeout(800); // transitions settle before pixels are judged
        const applied = await page.evaluate(() => document.documentElement.classList.contains("dark"));
        expect(applied, `${spec.path} should be ${theme}`).toBe(theme === "dark");
        await page.screenshot({ path: `e2e/screenshots/${theme}/${slug(spec.path)}.png`, fullPage: true });
        results.push(await contrastOf(page, spec.path));
      }

      // The sign-in page is public: a fresh, signed-out context.
      const anon = await browser.newContext({ colorScheme: theme, viewport: { width: 1440, height: 900 } });
      const anonPage = await anon.newPage();
      await anonPage.addInitScript(([k, v]) => localStorage.setItem(k, v), [THEME_KEY, theme] as const);
      await anonPage.route((url) => !["localhost", "127.0.0.1"].includes(url.hostname), (route) => route.abort());
      await anonPage.goto("/");
      await expect(anonPage.getByRole("heading", { name: "Welcome back" })).toBeVisible();
      await anonPage.waitForTimeout(800);
      await anonPage.screenshot({ path: `e2e/screenshots/${theme}/sign-in.png`, fullPage: true });
      results.push(await contrastOf(anonPage, "/"));
      await anon.close();

      writeContrastReport("Talim-Sch-Admin", theme, results);
    });
  });
}
