import { test, expect, type Allowed } from "./support/fixtures";
import { ACCOUNTS, authFile } from "./support/creds";
import { apiCall, apiLogin } from "./support/api";
import { dismissGuide } from "./support/ui";
import { axeFindings } from "./support/axe";

/**
 * v1.5 tickets through School Admin's UI (contract §1, the desk as built):
 *
 * - the support desk (`/support`): a parent's ticket raised over the API shows
 *   in the queue with its "1 new" badge; the admin opens it, adds an internal
 *   note (never shown to the parent), replies, changes the status, assigns it
 *   to themselves and escalates it to Talim (then read only, on Talim's desk);
 * - Help & support (`/help`): "Contact Talim support" raises a Talim ticket
 *   and opens it;
 * - `/complaints` redirects to the desk;
 * - axe (WCAG 2.1 A/AA) on `/support`, a desk ticket and `/help`, light and dark.
 *
 * Each run makes its own tickets ("E2E <run> ..."); nothing is cleaned up,
 * since tickets cannot be deleted through the v1.5 routes.
 */
const RUN = Date.now().toString(36).slice(-5);
const ALLOW: readonly Allowed[] = [
  { kind: "external", match: /fonts\.googleapis\.com|fonts\.gstatic\.com/, reason: "Google Fonts are blocked by the harness; the system font is used." },
  {
    kind: "http",
    match: /GET \/timetable\?page=1&limit=1 -> 404/,
    reason: "BUG (Talim-Sch-Admin, open, see 02-smoke): the onboarding sync probes GET /timetable.",
  },
];

interface TicketMessage {
  body: string;
  internal: boolean;
}
interface Ticket {
  id: string;
  reference: string;
  desk: "school" | "talim";
  status: string;
  unread: number;
  assignee: { id: string; name: string } | null;
  messages: TicketMessage[];
}

test.use({ storageState: authFile("schoolAdmin") });

test("support desk: a parent's ticket is new in the queue; note, reply, status, assign, escalate", async ({ page, monitor }) => {
  test.setTimeout(240_000);
  const parent = await apiLogin(ACCOUNTS.parent);
  const subject = `E2E ${RUN}: fee receipt missing`;
  const created = await apiCall<Ticket>(parent, "POST", "/tickets", {
    desk: "school",
    area: "fees",
    subject,
    body: "I paid the books fee in cash but the receipt is not in the app.",
  });
  expect(created.desk).toBe("school");

  monitor.clear();
  await page.goto("/support");
  await dismissGuide(page, 3_000);
  const row = page.getByRole("row").filter({ hasText: subject });
  await expect(row).toBeVisible();
  await expect(row.getByText("1 new", { exact: true })).toBeVisible();
  await expect(row).toContainText("Paul Parent");
  await expect(row).toContainText("Open");

  await row.getByRole("link", { name: new RegExp(subject) }).click();
  await expect(page).toHaveURL(new RegExp(`/support/${created.id}$`));
  await expect(page.getByRole("heading", { level: 1, name: subject })).toBeVisible();
  await dismissGuide(page, 3_000);

  // An internal note: the switch turns the composer into a note.
  const note = `E2E ${RUN} note: checked the bursary ledger, receipt exists.`;
  await page.getByRole("switch", { name: "Internal note" }).click();
  await page.getByRole("form", { name: "Add an internal note" }).getByRole("textbox").fill(note);
  await page.getByRole("button", { name: "Add internal note" }).click();
  await expect(page.getByText("Internal note added", { exact: true })).toBeVisible();
  await expect(page.getByText(note)).toBeVisible();

  // A public reply: the composer goes back to a reply after a note; an open ticket moves to In progress.
  const reply = `E2E ${RUN} reply: your receipt is on the Payments page now.`;
  await expect(page.getByRole("switch", { name: "Internal note" })).toHaveAttribute("aria-checked", "false");
  await page.getByRole("form", { name: "Reply" }).getByRole("textbox").fill(reply);
  await page.getByRole("button", { name: "Send reply" }).click();
  await expect(page.getByText("Reply sent", { exact: true })).toBeVisible();
  await expect(page.getByText(reply)).toBeVisible();
  await expect(page.locator("#ticket-status")).toHaveValue("in_progress");

  // The parent sees the reply and never the note.
  const seen = await apiCall<Ticket>(parent, "GET", `/tickets/${created.id}`);
  expect(seen.messages.map((m) => m.body)).toContain(reply);
  expect(seen.messages.map((m) => m.body)).not.toContain(note);
  expect(seen.messages.some((m) => m.internal)).toBe(false);

  // Status.
  await page.locator("#ticket-status").selectOption("waiting_on_user");
  await expect(page.getByText("Status set to Waiting on requester", { exact: true })).toBeVisible();
  await expect(page.locator("#ticket-status")).toHaveValue("waiting_on_user");

  // Assign to the signed-in admin (the staff list is the school's admins).
  const assignee = page.locator("#ticket-assignee");
  const mine = await assignee.locator("option", { hasText: ACCOUNTS.schoolAdmin.name }).getAttribute("value");
  expect(mine).toBeTruthy();
  await assignee.selectOption(mine!);
  await expect(page.getByText("Assigned to you", { exact: true })).toBeVisible();
  await expect(assignee).toHaveValue(mine!);

  // Escalate: the desk keeps read access; Talim's desk now holds it.
  await page.getByRole("button", { name: "Escalate to Talim" }).click();
  const sheet = page.getByRole("dialog", { name: "Escalate to Talim" });
  await sheet.getByLabel(/Why does this need Talim\?/).fill(`E2E ${RUN}: the receipt generator looks broken for cash payments.`);
  await sheet.getByRole("button", { name: "Escalate to Talim" }).click();
  await expect(page.getByText("Escalated to Talim support", { exact: true })).toBeVisible();
  await expect(page.getByText("With Talim support").first()).toBeVisible();
  await expect(page.locator("#ticket-status")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Escalate to Talim" })).toHaveCount(0);

  const platform = await apiLogin({ email: "platform@e2e.talim.test", password: ACCOUNTS.schoolAdmin.password });
  const onTalim = await apiCall<Ticket>(platform, "GET", `/tickets/${created.id}`);
  expect(onTalim.desk).toBe("talim");
  expect(onTalim.status).toBe("waiting_on_user");
  expect(onTalim.assignee).toBeNull();

  // Back on the queue it reads "With Talim support · read only".
  await page.getByRole("link", { name: "Support desk" }).first().click();
  await expect(page.getByRole("row").filter({ hasText: subject })).toContainText("With Talim support · read only");

  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
  expect(monitor.unexpected(ALLOW)).toEqual([]);
});

test("/complaints now opens the support desk", async ({ page }) => {
  await page.goto("/complaints");
  await expect(page).toHaveURL(/\/support$/);
  await expect(page.getByRole("heading", { level: 1, name: "Support desk" })).toBeVisible();
});

test("Help: Contact Talim support raises a Talim ticket and opens it", async ({ page, monitor }) => {
  monitor.clear();
  await page.goto("/help");
  await dismissGuide(page, 3_000);
  await expect(page.getByRole("heading", { name: "Help & support" })).toBeVisible();
  await expect(page.getByText("Contact Talim support").first()).toBeVisible();
  await page.getByRole("button", { name: "New ticket" }).first().click();
  const sheet = page.getByRole("dialog", { name: "New ticket" });
  const subject = `E2E ${RUN}: bulk upload stops at row 40`;
  await sheet.getByLabel(/What is it about\?/).selectOption("other");
  await sheet.getByLabel(/^Subject/).fill(subject);
  await sheet.getByLabel(/^Message/).fill("The student bulk upload stops at row 40 with no error.");
  const sent = page.waitForResponse((r) => /\/tickets$/.test(r.url()) && r.request().method() === "POST");
  await sheet.getByRole("button", { name: "Send to Talim support" }).click();
  const res = await sent;
  expect(res.status()).toBe(201);
  expect(res.request().postDataJSON()).toMatchObject({ desk: "talim", area: "other", subject });
  await expect(page).toHaveURL(/\/help\/tickets\/[a-f0-9]{24}$/);
  await expect(page.getByRole("heading", { level: 1, name: subject })).toBeVisible();

  await page.goto("/help");
  await expect(page.getByRole("list", { name: "Your tickets" })).toContainText(subject);
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
  expect(monitor.unexpected(ALLOW)).toEqual([]);
});

for (const theme of ["light", "dark"] as const) {
  test(`axe: /support, a desk ticket and /help in the ${theme} theme`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.emulateMedia({ colorScheme: theme });
    await page.addInitScript((t) => localStorage.setItem("talim_admin_theme", t), theme);
    const admin = await apiLogin(ACCOUNTS.schoolAdmin);
    const queue = await apiCall<{ data: { id: string }[] }>(admin, "GET", "/tickets/desk/school?limit=1");
    const mine = await apiCall<{ data: { id: string }[] }>(admin, "GET", "/tickets/mine?limit=1");
    const routes = [
      "/support",
      ...(queue.data[0] ? [`/support/${queue.data[0].id}`] : []),
      "/help",
      ...(mine.data[0] ? [`/help/tickets/${mine.data[0].id}`] : []),
    ];
    const failures: string[] = [];
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator(".animate-pulse:visible")).toHaveCount(0, { timeout: 30_000 });
      await dismissGuide(page, 3_000);
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
      await page.waitForTimeout(500);
      const label = `${route.replace(/[a-f0-9]{24}/, ":id")} (${theme})`;
      for (const f of await axeFindings(page, label, "support")) failures.push(`${label}: ${f.rule} [${f.impact}] ${f.targets.join(" | ")}`);
    }
    expect(failures).toEqual([]);
  });
}
