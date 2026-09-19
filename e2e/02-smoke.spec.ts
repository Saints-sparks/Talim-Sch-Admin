import { test, expect, type Allowed } from "./support/fixtures";
import { ADMIN_PAGES } from "./support/pages";
import { authFile } from "./support/creds";

/**
 * Walks every sidebar destination as the school admin. A page passes when it
 * loads with no uncaught error, no console.error and no unexpected non-2xx API
 * response, leaves its loading state, and shows its heading.
 *
 * ALLOW lists what is known and accepted. Each entry states why; anything
 * else is a failure, so a new error on a page cannot slip in unnoticed.
 */
const ALLOW: readonly Allowed[] = [
  {
    kind: "external",
    match: /fonts\.googleapis\.com|fonts\.gstatic\.com/,
    reason: "The layout loads Poppins from Google Fonts. The harness blocks every off-machine request; the page falls back to a system font.",
  },
  {
    kind: "http",
    match: /GET \/timetable\?page=1&limit=1 -> 404/,
    reason:
      "BUG (Talim-Sch-Admin, open): the onboarding sync probes GET /timetable, which the API does not have. It 404s on every navigation, so the 'timetable' step can never complete.",
  },
];

test.use({ storageState: authFile("schoolAdmin") });

for (const spec of ADMIN_PAGES) {
  test(`admin can open ${spec.path}`, async ({ page, monitor }) => {
    monitor.clear();
    await page.goto(spec.path);

    // Loading -> content: no skeleton or full-page loader may outlive the data.
    await expect(page.locator(".animate-pulse:visible")).toHaveCount(0, { timeout: 30_000 });
    await expect(page.getByText(spec.content).filter({ visible: true }).first()).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${spec.path}/?$`));
    // Top-level pages are reachable from the sidebar (grouped pages sit behind a menu that opens on click).
    if (spec.path.split("/").length === 2) await expect(page.locator(`a[href="${spec.path}"]`).first()).toBeAttached();

    // Let trailing requests (websocket handshake, badge counts) land before judging.
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
    expect(monitor.unexpected(ALLOW), `unexpected findings on ${spec.path}`).toEqual([]);
  });
}

test.describe("sub-admin pages", () => {
  test.use({ storageState: authFile("subAdmin") });

  for (const path of ["/dashboard", "/users/students", "/announcements"]) {
    test(`sub-admin can open ${path} without a refused request`, async ({ page, monitor }) => {
      monitor.clear();
      await page.goto(path);
      await expect(page.locator(".animate-pulse:visible")).toHaveCount(0, { timeout: 30_000 });
      await expect(page.getByRole("heading", { name: "Access Denied" })).toHaveCount(0);
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
      expect(monitor.unexpected(ALLOW), `unexpected findings on ${path}`).toEqual([]);
    });
  }
});
