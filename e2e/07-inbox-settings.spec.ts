import fs from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { test, expect, type Allowed } from "./support/fixtures";
import { ACCOUNTS, API_URL, authFile } from "./support/creds";
import { apiCall, apiLogin, unwrap } from "./support/api";
import { signInThroughUi } from "./support/auth";
import { dismissGuide } from "./support/ui";

/**
 * Round 4 on the School Admin side, against the real API (backend
 * `e2e/seed.js`, which gives Tolu Teacher a "School office" thread):
 * - the office inbox: Tolu's thread under "Teachers · Office", a reply the
 *   teacher reads through the API, and no add, remove or leave in it;
 * - group info: the description of a group edited by its admin, with the
 *   "Group admin" badge;
 * - office hours in School Day & Bells: set, kept after a reload, checked,
 *   cleared (then put back as the seed has them);
 * - Security: the signed-in devices, "Sign out of other devices", and the
 *   password rules from `GET /auth/password-policy`;
 * - Data & System: "Report a problem" and its reference;
 * - axe on these screens in both themes, and screenshots.
 *
 * The sessions test signs the admin's other sessions out, including the one
 * the other specs stored, so it runs last (the setup project signs in again
 * at the start of every run).
 */
const ALLOW: readonly Allowed[] = [
  { kind: "external", match: /fonts\.googleapis\.com|fonts\.gstatic\.com/, reason: "Google Fonts; blocked by the harness" },
];
const THEME_KEY = "talim_admin_theme";
const RUN = Date.now().toString(36).slice(-5);
const STAFF_GROUP = "E2E staff room";
/** The seed's office hours (the Teachers app shows them on the school contact card). */
const SEEDED_HOURS = { start: "07:30", end: "16:00" };

interface Room {
  _id: string;
  type: string;
  name?: string;
  category?: string;
  subtitle?: string;
  description?: string | null;
  admins?: { id: string; name: string }[];
}
interface Policy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSymbol: boolean;
  historyCount: number;
}

const subOf = (jwt: string): string => JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString()).sub;

let admin = "";
let teacher = "";
let adminId = "";
let teacherId = "";
let officeRoom = "";
let staffRoom = "";
const question = `E2E office question ${RUN}: can Grade 5A leave at noon on Friday?`;

test.use({ storageState: authFile("schoolAdmin") });
test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  admin = await apiLogin(ACCOUNTS.schoolAdmin);
  teacher = await apiLogin(ACCOUNTS.teacher);
  adminId = subOf(admin);
  teacherId = subOf(teacher);
  // Tolu's office room (created by the seed, or here) and a question from Tolu in it.
  const room = await apiCall<Room & { roomId?: string }>(teacher, "POST", "/chat/office");
  officeRoom = room._id ?? room.roomId!;
  await apiCall(teacher, "POST", "/chat/messages", { chatRoomId: officeRoom, text: question });
  // A staff group the admin runs (one for every run: found again by its name).
  const mine = await apiCall<Room[]>(admin, "GET", "/chat/rooms");
  staffRoom =
    mine.find((r) => r.name === STAFF_GROUP)?._id ??
    (await apiCall<Room>(admin, "POST", "/chat/groups", { type: "custom_group", name: STAFF_GROUP, participants: [teacherId] }))._id;
});

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Opens Messages on a room (or the list) and waits for the conversations. */
async function openMessages(page: Page, room?: string): Promise<void> {
  await page.goto(room ? `/messages?room=${room}` : "/messages");
  await expect(page.getByRole("textbox", { name: "Search conversations" })).toBeVisible({ timeout: 30_000 });
  await dismissGuide(page, 3_000);
}

/** A message in the open thread (the list's preview of the last message is a paragraph, a bubble's text a span). */
const bubble = (page: Page, text: string) => page.locator("span", { hasText: text }).first();

/**
 * Opens the room info from the chat header (the name is a button). An office
 * thread's header names the teacher; its info is titled with the room's own
 * name, "School office".
 */
async function openRoomInfo(page: Page, name: string, title = name) {
  await page.getByRole("button", { name: `${name}: conversation info` }).click();
  const dialog = page.getByRole("dialog", { name: `${title} info` });
  await expect(dialog).toBeVisible();
  return dialog;
}

/** Opens a settings section and waits for it. */
async function openSection(page: Page, section: string, title: string): Promise<void> {
  await page.goto(`/settings?section=${section}`);
  await expect(page.getByRole("heading", { name: title }).first()).toBeVisible();
  await expect(page.locator(".animate-pulse:visible")).toHaveCount(0, { timeout: 30_000 });
  await dismissGuide(page, 3_000);
}

// ─── Office inbox ───────────────────────────────────────────────────────────

test("the teacher's office thread is under Teachers · Office, and the teacher reads the reply", async ({ page, monitor }) => {
  await openMessages(page);
  monitor.clear();
  await page.getByRole("button", { name: /^Filter: / }).click();
  await page.getByRole("menuitem", { name: /Teachers · Office/ }).click();
  await expect(page.getByRole("button", { name: "Filter: Teachers · Office" })).toBeVisible();
  const row = page.locator('[data-category="office"]').filter({ hasText: ACCOUNTS.teacher.name });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText(`Office thread · ${ACCOUNTS.teacher.name}`);
  // Only office threads under this filter.
  await expect(page.locator('[role="button"][data-category]:not([data-category="office"])')).toHaveCount(0);

  await row.click();
  await expect(page).toHaveURL(new RegExp(`room=${officeRoom}`));
  await expect(bubble(page, question)).toBeVisible();
  const reply = `E2E office reply ${RUN}: yes, the early close is confirmed.`;
  await page.getByRole("textbox", { name: "Message" }).fill(reply);
  // The floating Guide button keeps clear of Send (Messages fills the window down to the composer).
  const send = (await page.getByRole("button", { name: "Send", exact: true }).boundingBox())!;
  const guide = (await page.getByRole("button", { name: "Guide", exact: true }).boundingBox())!;
  expect(send.x < guide.x + guide.width && guide.x < send.x + send.width && send.y < guide.y + guide.height && guide.y < send.y + send.height).toBe(false);
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(bubble(page, reply)).toBeVisible();
  await expect
    .poll(
      async () => {
        const body = await apiCall<{ messages: { text?: string; content?: string; senderId?: string | { _id: string } }[] }>(teacher, "GET", `/chat/rooms/${officeRoom}/messages/cursor?limit=30`);
        // This read answers the sender populated.
        const senderOf = (m: { senderId?: string | { _id: string } }) => (typeof m.senderId === "object" ? m.senderId._id : m.senderId);
        return body.messages.some((m) => (m.text ?? m.content) === reply && senderOf(m) === adminId);
      },
      { timeout: 20_000 },
    )
    .toBe(true);
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => undefined);
  expect(monitor.unexpected(ALLOW)).toEqual([]);
});

test("an office thread offers no add, remove or leave, and no editable details", async ({ page }) => {
  await openMessages(page, officeRoom);
  await expect(bubble(page, question)).toBeVisible();
  await expect(page.getByRole("button", { name: /Add/ }).filter({ hasText: /^Add$/ })).toHaveCount(0);
  const info = await openRoomInfo(page, ACCOUNTS.teacher.name, "School office");
  await expect(info.getByText(`Office thread · ${ACCOUNTS.teacher.name}`)).toBeVisible();
  await expect(info.getByRole("listitem").filter({ hasText: ACCOUNTS.teacher.name })).toHaveCount(1);
  await expect(info.getByRole("listitem").filter({ hasText: ACCOUNTS.schoolAdmin.name })).toHaveCount(1);
  await expect(info.getByRole("button", { name: /^Remove / })).toHaveCount(0);
  await expect(info.getByRole("button", { name: /Leave group/ })).toHaveCount(0);
  await expect(info.getByRole("button", { name: "Edit group description" })).toHaveCount(0);
  await expect(info.getByRole("button", { name: /Add (Parents|Teachers)/ })).toHaveCount(0);
  await info.getByRole("button", { name: "Close" }).click();

  // The members list from the header menu has no Remove either.
  await page.getByRole("button", { name: "More options" }).click();
  await page.getByRole("menuitem", { name: "View Members" }).click();
  await expect(page.getByRole("button", { name: "Close members list" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Remove / })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Leave group/ })).toHaveCount(0);

  // And the API agrees: an office room has no editable details (400) and no removals (403).
  const patch = await fetch(`${API_URL}/chat/rooms/${officeRoom}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${admin}` },
    body: JSON.stringify({ description: "nope" }),
  });
  expect(patch.status).toBe(400);
  const remove = await fetch(`${API_URL}/chat/rooms/${officeRoom}/participants/${teacherId}/remove`, {
    method: "PATCH",
    headers: { authorization: `Bearer ${admin}` },
  });
  expect(remove.status).toBe(403);
});

// ─── Group info ─────────────────────────────────────────────────────────────

test("group info: the group's admin edits its description, kept after a reload, and wears the badge", async ({ page }) => {
  const description = `E2E ${RUN}: staff notices and cover requests. Please reply by 3pm.`;
  await openMessages(page, staffRoom);
  let info = await openRoomInfo(page, STAFF_GROUP);
  const me = info.getByRole("listitem").filter({ hasText: "(You)" });
  await expect(me).toContainText(ACCOUNTS.schoolAdmin.name);
  await expect(me.getByText("Group admin")).toBeVisible();
  await expect(info.getByRole("listitem").filter({ hasText: ACCOUNTS.teacher.name }).getByText("Group admin")).toHaveCount(0);

  await info.getByRole("button", { name: "Edit group description" }).click();
  await info.getByRole("textbox", { name: "Group description" }).fill(description);
  const saved = page.waitForResponse((r) => r.url().endsWith(`/chat/rooms/${staffRoom}`) && r.request().method() === "PATCH");
  await info.getByRole("button", { name: "Save", exact: true }).click();
  const res = await saved;
  expect(res.status()).toBe(200);
  expect(res.request().postDataJSON()).toEqual({ description });
  await expect(info.getByText(description)).toBeVisible();

  await page.reload();
  await expect(page.getByRole("textbox", { name: "Search conversations" })).toBeVisible({ timeout: 30_000 });
  await dismissGuide(page, 2_000);
  info = await openRoomInfo(page, STAFF_GROUP);
  await expect(info.getByText(description)).toBeVisible();
  const stored = (await apiCall<Room[]>(teacher, "GET", "/chat/rooms")).find((r) => r._id === staffRoom)!;
  expect(stored.description).toBe(description);
  expect(stored.admins?.map((a) => a.id)).toContain(adminId);
});

// ─── Office hours ───────────────────────────────────────────────────────────

test("office hours in School Day & Bells: set, kept after a reload, checked, and cleared", async ({ page }) => {
  const start = page.locator("#sd-office-start");
  const end = page.locator("#sd-office-end");
  const save = () => page.getByRole("button", { name: "Save changes" });
  const patched = () => page.waitForResponse((r) => r.url().includes("/settings/academic") && r.request().method() === "PATCH");
  try {
    await openSection(page, "school-day", "School Day & Bells");
    await start.fill("07:45");
    await end.fill("16:30");
    let res = patched();
    await save().click();
    expect((await res).status()).toBe(200);
    expect(((await res).request().postDataJSON() as { officeHours?: unknown }).officeHours).toEqual({ start: "07:45", end: "16:30" });
    await page.reload();
    await openSection(page, "school-day", "School Day & Bells");
    await expect(start).toHaveValue("07:45");
    await expect(end).toHaveValue("16:30");

    // An end before the start is caught before anything is sent.
    let sent = false;
    const watch = (r: { url(): string; method(): string }) => {
      if (r.url().includes("/settings/academic") && r.method() === "PATCH") sent = true;
    };
    page.on("request", watch);
    await end.fill("07:00");
    await save().click();
    await expect(page.getByText("Office hours must end after they start.")).toBeVisible();
    await expect(end).toHaveAttribute("aria-invalid", "true");
    await page.waitForTimeout(500);
    expect(sent).toBe(false);
    page.off("request", watch);

    // Clear office hours.
    await page.getByRole("button", { name: "Clear office hours" }).click();
    await expect(start).toHaveValue("");
    await expect(end).toHaveValue("");
    res = patched();
    await save().click();
    expect((await res).status()).toBe(200);
    expect(((await res).request().postDataJSON() as { officeHours?: unknown }).officeHours).toBeNull();
    await page.reload();
    await openSection(page, "school-day", "School Day & Bells");
    await expect(start).toHaveValue("");
    const settings = await apiCall<{ settings?: { officeHours: unknown }; officeHours?: unknown }>(admin, "GET", "/settings/academic");
    expect((settings.settings ?? settings).officeHours ?? null).toBeNull();
  } finally {
    await apiCall(admin, "PATCH", "/settings/academic", { officeHours: SEEDED_HOURS });
  }
});

// ─── Help ───────────────────────────────────────────────────────────────────

test("Data & System: Report a problem answers with a TS- reference", async ({ page }) => {
  await openSection(page, "data-system", "Data & System");
  await page.getByRole("button", { name: "Report a problem" }).click();
  const form = page.getByRole("dialog", { name: "Report a problem" });
  await form.getByLabel(/What is it about/).selectOption("messages");
  await form.getByRole("textbox").fill(`E2E ${RUN}: the office filter keeps showing a thread I have already answered.`);
  const sent = page.waitForResponse((r) => r.url().endsWith("/support/tickets") && r.request().method() === "POST");
  await form.getByRole("button", { name: "Send report" }).click();
  const res = await sent;
  expect(res.status()).toBe(201);
  const { reference } = unwrap<{ reference: string }>(await res.json());
  expect(reference).toMatch(/^TS-[A-HJ-NP-Z2-9]{5}$/);
  const done = page.getByRole("dialog", { name: "Report sent" });
  await expect(done.getByText(reference, { exact: true })).toBeVisible();
});

// ─── Security ───────────────────────────────────────────────────────────────

test("Security: the password rules are the ones GET /auth/password-policy answers", async ({ page }) => {
  const policy = unwrap<Policy>(await (await fetch(`${API_URL}/auth/password-policy`)).json());
  const expected = [`At least ${policy.minLength} characters`];
  if (policy.requireUppercase) expected.push("An uppercase letter");
  if (policy.requireLowercase) expected.push("A lowercase letter");
  if (policy.requireNumber) expected.push("A number");
  if (policy.requireSymbol) expected.push('A symbol such as ! @ # $ % ^ & * ( ) , . ? " : { } | < >');
  await openSection(page, "security", "Security");
  await page.getByRole("button", { name: "Change", exact: true }).click();
  const modal = page.getByRole("dialog", { name: "Change Password" });
  const rules = modal.locator("#settings-password-rules li");
  await expect(rules).toHaveCount(expected.length);
  for (const [i, label] of expected.entries()) await expect(rules.nth(i)).toHaveText(new RegExp(`(Met|Not yet): ${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
  if (policy.historyCount === 1) await expect(modal.getByText("It can't be your current password.")).toBeVisible();
});

// ─── axe and screenshots ────────────────────────────────────────────────────

/** axe's serious and critical findings on the page. */
async function seriousIssues(page: Page) {
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"]).analyze();
  return {
    all: result.violations.map((v) => `${v.id}(${v.impact})`),
    bad: result.violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(" ")).slice(0, 5) })),
  };
}

/** Walks the new admin screens, calling `visit` on each once it has settled. */
async function walk(page: Page, visit: (name: string) => Promise<void>): Promise<void> {
  await openMessages(page, officeRoom);
  await expect(bubble(page, question)).toBeVisible();
  await page.waitForTimeout(600);
  await visit("messages-office");
  await openRoomInfo(page, ACCOUNTS.teacher.name, "School office");
  await page.waitForTimeout(400);
  await visit("messages-office-info");
  await openMessages(page, staffRoom);
  await openRoomInfo(page, STAFF_GROUP);
  await page.waitForTimeout(400);
  await visit("messages-group-info");
  for (const [section, title] of [["school-day", "School Day & Bells"], ["security", "Security"], ["data-system", "Data & System"]] as const) {
    await openSection(page, section, title);
    await page.waitForTimeout(600);
    await visit(`settings-${section}`);
  }
  await page.getByRole("button", { name: "Report a problem" }).click();
  await expect(page.getByRole("dialog", { name: "Report a problem" })).toBeVisible();
  await page.waitForTimeout(400);
  await visit("settings-report-problem");
}

for (const theme of ["light", "dark"] as const) {
  test(`axe finds nothing serious or critical on the office inbox, group info, office hours, Security and Report a problem (${theme})`, async ({ page }) => {
    test.setTimeout(300_000);
    await page.emulateMedia({ colorScheme: theme });
    await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [THEME_KEY, theme] as const);
    const failures: Record<string, unknown> = {};
    await walk(page, async (name) => {
      const { all, bad } = await seriousIssues(page);
      console.log(`[axe] ${name} ${theme}: ${all.join(", ") || "none"}; ${bad.length} serious/critical`);
      if (bad.length) failures[name] = bad;
    });
    expect(failures).toEqual({});
  });
}

test("screenshots of the new admin screens, light and dark", async ({ browser, baseURL }) => {
  test.setTimeout(300_000);
  fs.mkdirSync("e2e/screenshots", { recursive: true });
  for (const theme of ["light", "dark"] as const) {
    const context = await browser.newContext({ baseURL, storageState: authFile("schoolAdmin"), viewport: { width: 1440, height: 900 }, colorScheme: theme });
    const page = await context.newPage();
    await page.route((url) => !["localhost", "127.0.0.1"].includes(url.hostname), (route) => route.abort());
    await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [THEME_KEY, theme] as const);
    await walk(page, async (name) => {
      await page.screenshot({ path: `e2e/screenshots/redesign-admin-r4-${name}-${theme}.png`, fullPage: true });
    });
    await context.close();
  }
});

// Last: signing the other devices out also ends the session the other specs stored.
test("Security: the signed-in devices mark this one, and Sign out of other devices ends the others", async ({ browser, baseURL }) => {
  const other = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
  const otherPage = await other.newPage();
  await otherPage.route((url) => !["localhost", "127.0.0.1"].includes(url.hostname), (route) => route.abort());
  await signInThroughUi(otherPage, ACCOUNTS.schoolAdmin);

  const context = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] }, viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.route((url) => !["localhost", "127.0.0.1"].includes(url.hostname), (route) => route.abort());
  try {
    await signInThroughUi(page, ACCOUNTS.schoolAdmin);
    const listed = page.waitForResponse((r) => r.url().endsWith("/auth/sessions") && r.request().method() === "GET" && r.ok());
    await openSection(page, "security", "Security");
    await listed;
    const devices = page.getByRole("list", { name: "Signed-in devices" });
    await expect(devices.getByText("This device", { exact: true })).toHaveCount(1);
    const signOutOne = devices.getByRole("button", { name: /^Sign out / });
    expect(await signOutOne.count()).toBeGreaterThanOrEqual(1);

    await page.getByRole("button", { name: /Sign out of other devices/ }).click();
    const confirm = page.getByRole("dialog", { name: "Sign out of other devices?" });
    const revoked = page.waitForResponse((r) => r.url().endsWith("/auth/sessions/revoke-others") && r.request().method() === "POST");
    await confirm.getByRole("button", { name: "Sign out other devices" }).click();
    const res = await revoked;
    expect(res.ok()).toBe(true);
    expect(unwrap<{ revoked: number }>(await res.json()).revoked).toBeGreaterThanOrEqual(1);
    await expect(signOutOne).toHaveCount(0);
    await expect(devices.getByText("This device", { exact: true })).toHaveCount(1);

    // The other browser's refresh token is dead.
    const status = await otherPage.evaluate(async (api) => (await fetch(`${api}/auth/refresh`, { method: "POST", credentials: "include" })).status, API_URL);
    expect(status).toBe(401);
  } finally {
    await context.close();
    await other.close();
  }
});
