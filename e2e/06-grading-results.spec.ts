import fs from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { test, expect, type Allowed } from "./support/fixtures";
import { ACCOUNTS, authFile } from "./support/creds";
import { apiCall, apiLogin, unwrap } from "./support/api";
import { dismissGuide } from "./support/ui";

/**
 * Round 3 (Grading) in the School Admin app against the real API:
 * - Settings → Grading (`/settings?section=grading`): a validation error is
 *   caught before anything is sent, then a WAEC-style scale (A1 … F9) is
 *   saved and still there after a reload. The scale is LEFT IN PLACE for the
 *   Teachers suite's `10-admin-grades.spec.ts` (E2E_ADMIN_GRADES=1), which
 *   checks the letters on the Grading page and puts the default back; the
 *   backend's `node e2e/seed.js` also restores the default scale.
 * - Assessments: one created with a max score; a 409 when the max score of an
 *   assessment with published scores is changed (a throwaway assessment
 *   published through the API, cleaned up afterwards).
 * - Term Results (`/term-results`): a submission the class teacher makes
 *   through the API for a throwaway assessment published in all three Grade
 *   5A subjects; the office opens it, writes a principal remark, returns it
 *   with a reason, the class teacher resubmits (API), the office publishes it
 *   after confirming, and the remarks are then locked.
 *
 * Every assessment made here is deleted again (unlock, clear the scores,
 * delete). The term results submission and the remarks stay until the
 * backend's `node e2e/seed.js --reset`, which the Teachers suite runs before
 * its grading spec.
 */
const THEME_KEY = "talim_admin_theme";
const RUN = Date.now().toString(36).slice(-5);

const ALLOW: readonly Allowed[] = [
  { kind: "external", match: /fonts\.googleapis\.com|fonts\.gstatic\.com/, reason: "Google Fonts; blocked by the harness" },
  { kind: "http", match: /GET \/timetable\?page=1&limit=1 -> 404/, reason: "known: onboarding probe for a route the API does not have" },
];

/** The WAEC-style scale the admin builds: [letter, min, remark]. */
export const WAEC: readonly [string, number, string][] = [
  ["A1", 75, "Excellent"],
  ["B2", 70, "Very good"],
  ["B3", 65, "Good"],
  ["C4", 60, "Credit"],
  ["C5", 55, "Credit"],
  ["C6", 50, "Credit"],
  ["D7", 45, "Pass"],
  ["E8", 40, "Pass"],
  ["F9", 0, "Fail"],
];
const DEFAULT_SCALE = [
  { letter: "A", min: 70, remark: "Excellent" },
  { letter: "B", min: 60, remark: "Very good" },
  { letter: "C", min: 50, remark: "Good" },
  { letter: "D", min: 45, remark: "Fair" },
  { letter: "E", min: 40, remark: "Pass" },
  { letter: "F", min: 0, remark: "Fail" },
];

test.use({ storageState: authFile("schoolAdmin") });
test.describe.configure({ mode: "serial" });

// ─── API helpers ────────────────────────────────────────────────────────────

interface Card {
  course: { id: string; code: string; title: string };
  class: { id: string; name: string };
}
interface Sheet {
  term: { id: string; name: string };
  students: { id: string; name: string }[];
}
interface World {
  admin: string;
  tolu: string;
  third: string;
  classId: string;
  termId: string;
  termName: string;
  students: { id: string; name: string }[];
  /** Grade 5A's courses with the token of their teacher. */
  courses: { id: string; code: string; token: string }[];
}

let world: World | null = null;

async function getWorld(): Promise<World> {
  if (world) return world;
  const [admin, tolu, third] = await Promise.all([
    apiLogin(ACCOUNTS.schoolAdmin),
    apiLogin(ACCOUNTS.teacher),
    apiLogin(ACCOUNTS.thirdTeacher),
  ]);
  const toluCards = await apiCall<Card[]>(tolu, "GET", "/scheme-of-work/me");
  const thirdCards = await apiCall<Card[]>(third, "GET", "/scheme-of-work/me");
  const mth = toluCards.find((c) => c.course.code === "MTH-5A")!;
  const sheet = await apiCall<Sheet>(tolu, "GET", `/grading/course/${mth.course.id}`);
  world = {
    admin,
    tolu,
    third,
    classId: mth.class.id,
    termId: sheet.term.id,
    termName: sheet.term.name,
    students: sheet.students,
    courses: [
      ...toluCards.filter((c) => c.class.id === mth.class.id).map((c) => ({ id: c.course.id, code: c.course.code, token: tolu })),
      ...thirdCards.filter((c) => c.class.id === mth.class.id).map((c) => ({ id: c.course.id, code: c.course.code, token: third })),
    ],
  };
  return world;
}

const isoDay = (offset = 0) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);

/** An assessment of the current term, created by the admin through the API. */
async function createAssessment(name: string, maxScore: number): Promise<string> {
  const w = await getWorld();
  const created = await apiCall<{ assessment: { _id: string } }>(w.admin, "POST", "/assessments", {
    name,
    termId: w.termId,
    maxScore,
    startDate: `${isoDay()}T00:00:00Z`,
    endDate: `${isoDay(3)}T23:59:59Z`,
  });
  return created.assessment._id;
}

/** Scores every Grade 5A student on `assessmentId` in the given courses (by code) and publishes them. */
async function scoreAndPublish(assessmentId: string, codes: string[], scores: number[]): Promise<void> {
  const w = await getWorld();
  for (const course of w.courses.filter((c) => codes.includes(c.code))) {
    await apiCall(course.token, "PUT", `/grading/course/${course.id}/assessments/${assessmentId}/scores`, {
      scores: w.students.map((s, i) => ({ studentId: s.id, score: scores[i % scores.length] })),
    });
    await apiCall(course.token, "POST", `/grading/course/${course.id}/assessments/${assessmentId}/publish`);
  }
}

/** Unlocks, clears and deletes a throwaway assessment, whatever state it is in. */
async function removeAssessment(assessmentId: string): Promise<void> {
  const w = await getWorld();
  for (const course of w.courses) {
    const base = `/grading/course/${course.id}/assessments/${assessmentId}`;
    await apiCall(course.token, "POST", `${base}/unlock`, { reason: "e2e cleanup" }).catch(() => undefined);
    await apiCall(course.token, "PUT", `${base}/scores`, { scores: w.students.map((s) => ({ studentId: s.id, score: null })) }).catch(() => undefined);
  }
  await apiCall(w.admin, "DELETE", `/assessments/${assessmentId}`);
}

/** Raw call that returns the status and body instead of throwing. */
async function rawCall(token: string, method: string, path: string, body?: unknown): Promise<{ status: number; body: Record<string, unknown> }> {
  const res = await fetch(`${process.env.E2E_API_URL ?? "http://localhost:5055"}${path}`, {
    method,
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? (JSON.parse(text) as Record<string, unknown>) : {} };
}

// ─── Grade scale ────────────────────────────────────────────────────────────

const grades = (page: Page) => page.getByRole("list", { name: "Grades" }).getByRole("listitem");

// The first page a fresh session opens shows the one-time guide as soon as its content renders,
// so each helper waits for the content before closing the guide (on a busy machine it comes late).
async function openGrading(page: Page): Promise<void> {
  await page.goto("/settings?section=grading");
  await expect(page.getByRole("heading", { name: "Grade scale" })).toBeVisible();
  await expect(page.locator(".animate-pulse:visible")).toHaveCount(0, { timeout: 30_000 });
  await dismissGuide(page, 3_000);
}

test("the admin edits the grade scale: a mistake is caught first, the saved scale survives a reload", async ({ page, monitor }) => {
  // A known starting point: the default scale.
  const w = await getWorld();
  await apiCall(w.admin, "PATCH", "/settings/academic", { gradeScale: DEFAULT_SCALE, passMark: 50 });
  await openGrading(page);
  await expect(grades(page)).toHaveCount(DEFAULT_SCALE.length);
  monitor.clear();

  let patched = 0;
  page.on("request", (r) => {
    if (r.url().includes("/settings/academic") && r.method() === "PATCH") patched += 1;
  });

  // The last grade must start at 0%, and letters must be unique.
  const last = grades(page).last();
  await last.getByLabel("Minimum (%)").fill("10");
  await grades(page).nth(1).getByLabel("Letter").fill("a");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Fix the highlighted fields before saving.")).toBeVisible();
  await expect(last.getByText("The last grade must start at 0% so every score gets a grade.")).toBeVisible();
  await expect(grades(page).nth(1).getByText("A is already used. Letters must be unique.")).toBeVisible();
  await expect(last.getByLabel("Minimum (%)")).toHaveAttribute("aria-invalid", "true");
  await page.waitForTimeout(400);
  expect(patched, "nothing is sent while the form has errors").toBe(0);
  await page.getByRole("button", { name: "Discard changes" }).click();
  await expect(last.getByLabel("Minimum (%)")).toHaveValue("0");

  // Nine grades, WAEC style.
  for (let i = DEFAULT_SCALE.length; i < WAEC.length; i++) await page.getByRole("button", { name: "Add grade" }).click();
  await expect(grades(page)).toHaveCount(WAEC.length);
  for (const [i, [letter, min, remark]] of WAEC.entries()) {
    const row = grades(page).nth(i);
    await row.getByLabel("Letter").fill(letter);
    await row.getByLabel("Minimum (%)").fill(String(min));
    await row.getByLabel(/^Remark/).fill(remark);
  }
  const saved = page.waitForResponse((r) => r.url().includes("/settings/academic") && r.request().method() === "PATCH");
  await page.getByRole("button", { name: "Save changes" }).click();
  const res = await saved;
  expect(res.status()).toBe(200);
  const sent = res.request().postDataJSON() as { gradeScale: { letter: string; min: number; remark?: string }[]; passMark: number };
  expect(sent.gradeScale.map((b) => [b.letter, b.min, b.remark])).toEqual(WAEC);
  expect(sent.passMark).toBe(50);
  await expect(page.getByText("Grading saved")).toBeVisible();

  await page.reload();
  await openGrading(page);
  await expect(grades(page)).toHaveCount(WAEC.length);
  for (const [i, [letter, min, remark]] of WAEC.entries()) {
    const row = grades(page).nth(i);
    await expect(row.getByLabel("Letter")).toHaveValue(letter);
    await expect(row.getByLabel("Minimum (%)")).toHaveValue(String(min));
    await expect(row.getByLabel(/^Remark/)).toHaveValue(remark);
  }
  // Every letter the API reports now reads this scale.
  const scale = await apiCall<{ settings: { gradeScale: { letter: string }[] } }>(w.admin, "GET", "/settings/academic");
  expect(scale.settings.gradeScale.map((b) => b.letter)).toEqual(WAEC.map((b) => b[0]));
  fs.mkdirSync("e2e/reports", { recursive: true });
  fs.writeFileSync("e2e/reports/admin-grades.json", JSON.stringify({ scale: WAEC }, null, 2));
  expect(monitor.unexpected(ALLOW)).toEqual([]);
});

// ─── Assessments: max score ─────────────────────────────────────────────────

async function openAssessments(page: Page): Promise<void> {
  await page.goto("/assessments");
  await expect(page.getByText("First Term CA 1").first()).toBeVisible();
  await expect(page.locator(".animate-pulse:visible")).toHaveCount(0, { timeout: 30_000 });
  await dismissGuide(page, 3_000);
}

/** The card of one assessment in the list (the innermost block holding its heading). */
const assessmentCard = (page: Page, name: string) =>
  page.locator("div.p-6").filter({ has: page.getByRole("heading", { name, exact: true }) }).last();

test("the admin creates an assessment with a max score", async ({ page, monitor }) => {
  const name = `E2E Quiz ${RUN}`;
  let createdId = "";
  try {
    await openAssessments(page);
    monitor.clear();
    await page.getByRole("button", { name: "Create Assessment" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Create New Assessment" });
    await expect(dialog).toBeVisible();
    await dialog.locator("#assessment-name").fill(name);
    await dialog.locator("#assessment-description").fill("Made by the browser suite");
    const term = dialog.locator("select").filter({ has: page.locator("option", { hasText: /First Term/ }) }).first();
    await term.selectOption({ label: (await term.locator("option", { hasText: /First Term/ }).first().textContent())!.trim() });
    await dialog.locator("#assessment-start").fill(isoDay(1));
    await dialog.locator("#assessment-end").fill(isoDay(2));
    // Required, a whole number 1..1000.
    await dialog.locator("#assessment-max-score").fill("0");
    await dialog.getByRole("button", { name: "Create Assessment" }).click();
    await expect(dialog.getByText("Max score must be between 1 and 1000")).toBeVisible();
    await dialog.locator("#assessment-max-score").fill("25");

    const created = page.waitForResponse((r) => new URL(r.url()).pathname === "/assessments" && r.request().method() === "POST");
    await dialog.getByRole("button", { name: "Create Assessment" }).click();
    const res = await created;
    expect(res.status()).toBe(201);
    expect(res.request().postDataJSON()).toMatchObject({ name, maxScore: 25 });
    createdId = unwrap<{ assessment?: { _id: string } }>(await res.json()).assessment?._id ?? "";
    await expect(page.getByText("Assessment created successfully!")).toBeVisible();
    await expect(dialog).toHaveCount(0);
    const card = assessmentCard(page, name);
    await expect(card).toBeVisible();
    await expect(card.getByText("out of 25")).toBeVisible();
    expect(monitor.unexpected(ALLOW)).toEqual([]);
  } finally {
    const w = await getWorld();
    if (!createdId) {
      const list = await apiCall<{ assessments?: { _id: string; name: string }[] }>(w.admin, "GET", "/assessments/school?page=1&limit=100");
      createdId = (list.assessments ?? []).find((a) => a.name === name)?._id ?? "";
    }
    if (createdId) await apiCall(w.admin, "DELETE", `/assessments/${createdId}`);
  }
});

test("changing the max score of an assessment with published scores is refused with a clear message", async ({ page }) => {
  const name = `E2E Published ${RUN}`;
  const id = await createAssessment(name, 10);
  try {
    await scoreAndPublish(id, ["MTH-5A"], [8, 6.5]);
    await openAssessments(page);
    const card = assessmentCard(page, name);
    await expect(card.getByText("out of 10")).toBeVisible();
    await card.getByRole("button", { name: "Edit" }).click();
    const dialog = page.getByRole("dialog", { name: "Edit Assessment" });
    await expect(dialog).toBeVisible();
    await dialog.locator("#assessment-max-score").fill("12");
    const updated = page.waitForResponse((r) => r.url().includes(`/assessments/${id}`) && r.request().method() === "PUT");
    await dialog.getByRole("button", { name: "Update Assessment" }).click();
    const res = await updated;
    expect(res.status()).toBe(409);
    expect(((await res.json()) as { code?: string }).code).toBe("PUBLISHED");
    await expect(dialog.getByText("Scores for this assessment are already published, so its max score can't change. Put it back to 10 to save your other changes.")).toBeVisible();
    await expect(dialog.locator("#assessment-max-score")).toHaveAttribute("aria-invalid", "true");
    await expect(dialog.getByText("The assessment was not saved. See the max score below.")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  } finally {
    await removeAssessment(id);
  }
});

// ─── Term Results ───────────────────────────────────────────────────────────

let quiz = "";
let submissionId = "";
const QUIZ = `E2E Term Quiz ${RUN}`;
const REASON = "Please add a remark for Ben before we publish.";
const PRINCIPAL = "A fine term, Ada. Keep it up.";

async function openQueue(page: Page, tab: "Submitted" | "Returned" | "Published"): Promise<void> {
  await page.goto("/term-results");
  await expect(page.getByRole("heading", { name: "Term Results" }).first()).toBeVisible();
  await expect(page.locator(".animate-pulse:visible")).toHaveCount(0, { timeout: 30_000 });
  await dismissGuide(page, 3_000);
  await page.getByRole("group", { name: "Show results that are" }).getByRole("button", { name: new RegExp(`^${tab}`) }).click();
  await expect(page.locator(".animate-pulse:visible")).toHaveCount(0, { timeout: 30_000 });
}

test("Term Results: the office reviews a submission, writes a remark, returns it, then publishes the resubmission", async ({ page, monitor }) => {
  test.setTimeout(240_000);
  const w = await getWorld();
  const [ada, ben] = [w.students.find((s) => /Ada/.test(s.name))!, w.students.find((s) => /Ben/.test(s.name))!];
  quiz = await createAssessment(QUIZ, 10);
  await scoreAndPublish(quiz, ["MTH-5A", "ENG-5A", "BSC-5A"], [8, 6.5]);
  await apiCall(w.tolu, "PUT", `/grading/classes/${w.classId}/remarks`, { remarks: [{ studentId: ada.id, classTeacherRemark: "Steady work this term." }] });
  const submitted = await apiCall<{ id: string; status: string }>(w.tolu, "POST", `/grading/classes/${w.classId}/term-results`, { basis: quiz });
  expect(submitted.status).toBe("submitted");
  submissionId = submitted.id;

  // The queue shows it, with one student missing a remark.
  await openQueue(page, "Submitted");
  monitor.clear();
  const row = page.getByRole("row").filter({ hasText: QUIZ });
  await expect(row).toContainText("Grade 5A");
  await expect(row).toContainText("Tolu Teacher");
  await expect(row).toContainText("1 missing");
  await row.getByRole("button", { name: "Review Grade 5A results" }).click();

  // The detail: broadsheet, remarks, the actions.
  await expect(page.getByRole("heading", { level: 2, name: `Grade 5A · ${w.termName}`, exact: true })).toBeVisible();
  await expect(page.getByText(new RegExp(`${QUIZ} · submitted by Tolu Teacher`))).toBeVisible();
  await expect(page.getByText("Ada Student").first()).toBeVisible();
  const remarks = page.getByRole("list", { name: "Remarks by student" });
  await expect(remarks.getByText("Steady work this term.")).toBeVisible();
  await remarks.getByLabel("Principal remark for Ada Student").fill(PRINCIPAL);
  const savedRemarks = page.waitForResponse((r) => r.url().includes(`/grading/term-results/${submissionId}/principal-remarks`) && r.request().method() === "PUT");
  await page.getByRole("button", { name: "Save remarks (1)" }).click();
  expect((await savedRemarks).status()).toBe(200);
  await expect(page.getByRole("button", { name: "Save remarks", exact: true })).toBeDisabled();

  // Return it: a reason is required.
  await page.getByRole("button", { name: "Return to class teacher" }).click();
  const returnDialog = page.getByRole("dialog", { name: "Return to class teacher" });
  await expect(returnDialog).toBeVisible();
  await returnDialog.getByRole("button", { name: "Return results" }).click();
  await expect(returnDialog.locator("#return-reason")).toHaveAttribute("aria-invalid", "true");
  await returnDialog.locator("#return-reason").fill(REASON);
  const returned = page.waitForResponse((r) => r.url().includes(`/grading/term-results/${submissionId}/return`) && r.request().method() === "POST");
  await returnDialog.getByRole("button", { name: "Return results" }).click();
  const returnRes = await returned;
  expect(returnRes.status()).toBe(200);
  expect(returnRes.request().postDataJSON()).toEqual({ reason: REASON });
  await expect(returnDialog).toHaveCount(0);

  await openQueue(page, "Returned");
  await expect(page.getByRole("row").filter({ hasText: QUIZ })).toContainText(`Returned: ${REASON}`);

  // The class teacher adds Ben's remark and submits again (through the API).
  await apiCall(w.tolu, "PUT", `/grading/classes/${w.classId}/remarks`, { remarks: [{ studentId: ben.id, classTeacherRemark: "Improving every week." }] });
  const again = await apiCall<{ id: string; status: string }>(w.tolu, "POST", `/grading/classes/${w.classId}/term-results`, { basis: quiz });
  expect(again).toMatchObject({ id: submissionId, status: "submitted" });

  await openQueue(page, "Submitted");
  const row2 = page.getByRole("row").filter({ hasText: QUIZ });
  await row2.getByRole("button", { name: "Review Grade 5A results" }).click();
  await expect(page.getByRole("heading", { level: 2, name: `Grade 5A · ${w.termName}`, exact: true })).toBeVisible();
  await expect(page.getByText("Every student has a class teacher remark.")).toBeVisible();
  await expect(page.getByRole("list", { name: "Remarks by student" }).getByLabel("Principal remark for Ada Student")).toHaveValue(PRINCIPAL);

  // Publish, after confirming.
  await page.getByRole("button", { name: "Publish results" }).click();
  const publishDialog = page.getByRole("dialog", { name: "Publish results?" });
  await expect(publishDialog).toContainText("2 students and their parents will be notified");
  await publishDialog.getByRole("button", { name: "Cancel" }).click();
  await expect(publishDialog).toHaveCount(0);
  await page.getByRole("button", { name: "Publish results" }).click();
  const published = page.waitForResponse((r) => r.url().includes(`/grading/term-results/${submissionId}/publish`) && r.request().method() === "POST");
  await page.getByRole("dialog", { name: "Publish results?" }).getByRole("button", { name: "Publish and notify" }).click();
  expect((await published).status()).toBe(200);

  // Published: the remarks are locked, in the app and on the API.
  await openQueue(page, "Published");
  await page.getByRole("row").filter({ hasText: QUIZ }).getByRole("button", { name: "Open Grade 5A results" }).click();
  await expect(page.getByText(/Students and parents can see these results\./)).toBeVisible();
  const lockedList = page.getByRole("list", { name: "Remarks by student" });
  await expect(lockedList.getByText(PRINCIPAL)).toBeVisible();
  await expect(lockedList.locator("textarea")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Save remarks/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Publish results" })).toHaveCount(0);
  const late = await rawCall(w.admin, "PUT", `/grading/term-results/${submissionId}/principal-remarks`, {
    remarks: [{ studentId: ben.id, principalRemark: "Too late" }],
  });
  expect(late.status).toBe(409);
  expect(late.body.code).toBe("RESULTS_PUBLISHED");
  const counts = await apiCall<{ published: number }>(w.admin, "GET", `/grading/term-results/counts`);
  expect(counts.published).toBeGreaterThanOrEqual(1);
  expect(monitor.unexpected(ALLOW)).toEqual([]);
});

// ─── axe and screenshots ────────────────────────────────────────────────────

for (const theme of ["light", "dark"] as const) {
  test(`axe finds nothing serious or critical on Grading settings and Term Results (${theme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [THEME_KEY, theme] as const);
    const bad: unknown[] = [];
    const judge = async (label: string) => {
      await page.waitForTimeout(600);
      const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"]).analyze();
      for (const v of result.violations.filter((x) => x.impact === "serious" || x.impact === "critical")) {
        bad.push({ page: label, id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(" ")).slice(0, 5) });
      }
    };
    await openGrading(page);
    await judge("/settings?section=grading");
    await openQueue(page, "Published");
    await judge("/term-results");
    const open = page.getByRole("button", { name: /^(Open|Review) Grade 5A results$/ }).first();
    if (await open.count()) {
      await open.click();
      await expect(page.getByRole("list", { name: "Remarks by student" })).toBeVisible();
      await judge("/term-results (detail)");
    }
    expect(bad).toEqual([]);
  });
}

/** The settings page scrolls an inner column: grows the viewport by what it hides, shoots, restores. */
async function shootWhole(page: Page, file: string): Promise<void> {
  const size = page.viewportSize()!;
  const hidden = await page.evaluate(() => {
    let most = 0;
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
      const overflow = getComputedStyle(el).overflowY;
      if ((overflow === "auto" || overflow === "scroll") && el.clientHeight > 200) most = Math.max(most, el.scrollHeight - el.clientHeight);
    }
    return most;
  });
  if (hidden > 0) {
    await page.setViewportSize({ width: size.width, height: size.height + hidden });
    await page.waitForTimeout(400);
  }
  await page.screenshot({ path: file, fullPage: true });
  if (hidden > 0) await page.setViewportSize(size);
}

test("screenshots of Grading settings and Term Results, light and dark", async ({ browser, baseURL }) => {
  test.setTimeout(240_000);
  fs.mkdirSync("e2e/screenshots", { recursive: true });
  for (const theme of ["light", "dark"] as const) {
    const context = await browser.newContext({ baseURL, storageState: authFile("schoolAdmin"), viewport: { width: 1440, height: 900 }, colorScheme: theme });
    const page = await context.newPage();
    await page.route((url) => !["localhost", "127.0.0.1"].includes(url.hostname), (route) => route.abort());
    await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [THEME_KEY, theme] as const);
    await openGrading(page);
    await page.waitForTimeout(600);
    await shootWhole(page, `e2e/screenshots/redesign-admin-grading-${theme}.png`);
    await openQueue(page, "Published");
    await page.waitForTimeout(600);
    await shootWhole(page, `e2e/screenshots/redesign-admin-term-results-${theme}.png`);
    const open = page.getByRole("button", { name: /^(Open|Review) Grade 5A results$/ }).first();
    if (await open.count()) {
      await open.click();
      await expect(page.getByRole("list", { name: "Remarks by student" })).toBeVisible();
      await page.waitForTimeout(600);
      await shootWhole(page, `e2e/screenshots/redesign-admin-term-result-detail-${theme}.png`);
    }
    await context.close();
  }
});

test.afterAll(async () => {
  if (quiz) await removeAssessment(quiz).catch(() => undefined);
});
