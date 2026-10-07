/**
 * Live contract check of the school Support desk (`/support`) and Help →
 * Contact Talim support (`/help`), v1.5 §1, through this app's own services,
 * against a running API with the e2e seed (`talimBE-V2/e2e`). Skipped unless
 * `LIVE_API=1`:
 *
 *   LIVE_API=1 LIVE_DB=talim_v15_web NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:5086 npx jest live.v15
 *
 * The seeded parent raises a school-desk ticket about Ada with raw requests
 * (the parents app's side); the school admin works it with `ticketService`:
 * counts, the staff list, the queue with `unread`, the thread (read for the
 * desk, with the requester's context, child and email), assign ("me"), an
 * internal note, a reply, status, a requester's reply reopening it, escalation
 * (then `access: observer` and 409 `TICKET_ESCALATED`). Then the admin raises
 * a ticket to Talim from Help, the platform admin answers it, and the admin
 * reads it (unread back to 0), replies, reopens within 7 days, and meets 409
 * `REOPEN_WINDOW_PASSED` and `TICKET_CLOSED`. The reopen window is passed by
 * moving `resolvedAt` back 8 days in that API's database, through the backend
 * checkout's own `mongodb` driver (`LIVE_BACKEND_DIR`, default
 * `../talimBE-V2`). It writes to that database: point it at a throwaway
 * stack only.
 */
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { authService } from "@/app/services/auth.service";
import { ticketService } from "@/app/services/ticket.service";
import { canReopen, ticketConflictCode, ticketContext, ticketErrorMessage } from "@/components/support/ticket.presentation";
import { apiClient } from "@/lib/apiClient";
import { ApiError } from "@/lib/apiError";
import { APP_VERSION } from "@/lib/appVersion";
import type { Ticket, TicketDeskCounts } from "@/types/tickets";

const LIVE = process.env.LIVE_API === "1";
const API = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");
const PASSWORD = process.env.LIVE_PASSWORD ?? "Demo#Pass2026";
const DOMAIN = process.env.LIVE_DOMAIN ?? "e2e.talim.test";
const DB = process.env.LIVE_DB ?? "";
const BACKEND = resolve(process.env.LIVE_BACKEND_DIR ?? "../talimBE-V2");
const RUN = Date.now().toString(36);

/**
 * A request as another app makes it (the parents app, Talim Admin).
 *
 * @param method - The HTTP method.
 * @param path - The path under the API.
 * @param token - The bearer token, if any.
 * @param body - The JSON body, if any.
 * @returns The status and the body, unwrapped from `{ success, data }`.
 */
async function raw<T = Record<string, unknown>>(method: string, path: string, token?: string, body?: unknown): Promise<{ status: number; body: T }> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const parsed = await res.json().catch(() => null);
  const unwrapped = parsed && typeof parsed === "object" && "success" in parsed && "data" in parsed ? parsed.data : parsed;
  return { status: res.status, body: unwrapped as T };
}

/**
 * Signs a seeded user in with raw requests.
 *
 * @param path - `/auth/login` or `/auth/admin-login`.
 * @param local - The part of the email before the `@`.
 * @returns The access token.
 */
async function token(path: string, local: string): Promise<string> {
  const res = await raw<{ access_token: string }>("POST", path, undefined, { email: `${local}@${DOMAIN}`, password: PASSWORD });
  if (res.status >= 300) throw new Error(`${local} could not sign in: ${res.status}`);
  return res.body.access_token;
}

/**
 * The user id in an access token.
 *
 * @param accessToken - The token.
 * @returns Its `sub`.
 */
function subOf(accessToken: string): string {
  return String(JSON.parse(Buffer.from(accessToken.split(".")[1], "base64url").toString()).sub);
}

/**
 * Moves a resolved ticket's `resolvedAt` into the past, in the live API's
 * database, so the 7-day reopen window has passed.
 *
 * @param ticketId - The ticket.
 * @param days - How many days ago it was resolved.
 * @returns Nothing; throws when no resolved ticket was changed.
 */
function ageResolved(ticketId: string, days: number): void {
  if (!DB || ["talim_e2e", "talim_portals"].includes(DB)) throw new Error("Set LIVE_DB to the throwaway stack's database.");
  const script = `const { MongoClient, ObjectId } = require(${JSON.stringify(`${BACKEND}/node_modules/mongodb`)});
(async () => {
  const client = await MongoClient.connect(process.env.LIVE_MONGO);
  const res = await client.db().collection("complaints").updateOne(
    { _id: new ObjectId(process.env.LIVE_ID), status: "resolved" },
    { $set: { resolvedAt: new Date(Date.now() - Number(process.env.LIVE_DAYS) * 864e5) } },
  );
  await client.close();
  if (res.modifiedCount !== 1) { console.error("no resolved ticket aged"); process.exit(1); }
})().catch((error) => { console.error(error); process.exit(1); });`;
  execFileSync(process.execPath, ["-e", script], {
    env: { ...process.env, LIVE_MONGO: `mongodb://127.0.0.1:27017/${DB}?replicaSet=rs0&directConnection=true`, LIVE_ID: ticketId, LIVE_DAYS: String(days) },
    stdio: "pipe",
  });
}

/**
 * What a promise rejected with.
 *
 * @param promise - The call.
 * @returns The `ApiError` it threw.
 */
async function failure(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ApiError) return error;
    throw error;
  }
  throw new Error("expected the call to fail");
}

const live = LIVE ? describe : describe.skip;

live("v1.5 school Support desk and Help against the live API", () => {
  jest.setTimeout(60_000);
  let parent = "";
  let platform = "";
  let adminId = "";
  let adaId = "";
  let before: TicketDeskCounts;
  let ticket: Ticket;

  beforeAll(async () => {
    // The client reads its token only in a browser; the test runs in Node with real fetch.
    (globalThis as { window?: unknown }).window ??= globalThis;
    parent = await token("/auth/login", "parent");
    platform = await token("/auth/admin-login", "platform");
    const login = await authService.login({ email: `admin@${DOMAIN}`, password: PASSWORD });
    apiClient.setAccessToken(login.access_token);
    adminId = subOf(login.access_token);
    const children = await raw<{ id: string; name: string }[]>("GET", "/parents/me/children", parent);
    adaId = children.body.find((child) => child.name.startsWith("Ada"))?.id ?? "";
    if (!adaId) throw new Error("the seeded parent has no Ada");
  });

  afterAll(() => {
    apiClient.setAccessToken(null);
    if ((globalThis as { window?: unknown }).window === globalThis) delete (globalThis as { window?: unknown }).window;
  });

  it("counts and the staff list (the assignee choices)", async () => {
    before = await ticketService.schoolDeskCounts();
    expect(Object.keys(before).sort()).toEqual(["closed", "in_progress", "mine", "open", "resolved", "total", "unassigned", "waiting_on_user"]);
    const staff = await ticketService.schoolDeskStaff();
    expect(staff.find((member) => member.id === adminId)).toMatchObject({ role: "school_admin", email: `admin@${DOMAIN}` });
    expect(staff.every((member) => ["school_admin", "school_sub_admin"].includes(member.role))).toBe(true);
    // The seeded sub-admin lacks manage:support, so is not a choice.
    expect(staff.some((member) => member.email === `subadmin@${DOMAIN}`)).toBe(false);
  });

  it("queues a parent's ticket with unread, and opening it shows the context and child, and reads it", async () => {
    const raised = await raw<Ticket>("POST", "/tickets", parent, {
      desk: "school",
      area: "results",
      subject: `Live desk ${RUN}`,
      body: "Ada's maths score is wrong.",
      childId: adaId,
      context: { path: "/results", appVersion: "1.5.0", userAgent: "parents-live" },
    });
    expect(raised.status).toBe(201);
    const queue = await ticketService.schoolDesk({ status: ["open"], q: `Live desk ${RUN}` });
    const row = queue.data.find((item) => item.id === raised.body.id);
    expect(row).toMatchObject({ access: "desk", unread: 1, status: "open", child: { id: adaId }, childId: adaId, assignee: null });
    expect(row?.requester.email).toBe(`parent@${DOMAIN}`);
    const counts = await ticketService.schoolDeskCounts();
    expect([counts.open, counts.unassigned, counts.total]).toEqual([before.open + 1, before.unassigned + 1, before.total + 1]);

    ticket = await ticketService.get(raised.body.id);
    expect(ticket.context).toEqual({ path: "/results", appVersion: "1.5.0", userAgent: "parents-live" });
    expect(ticket.child?.name).toMatch(/^Ada/);
    const after = await ticketService.schoolDesk({ q: `Live desk ${RUN}` });
    expect(after.data.find((item) => item.id === ticket.id)?.unread).toBe(0);
  });

  it("assigns to the admin, and 'Assigned to me' sends me", async () => {
    const assigned = await ticketService.update(ticket.id, { assigneeId: adminId });
    expect(assigned.assignee?.id).toBe(adminId);
    const mine = await ticketService.schoolDesk({ assigneeId: "me" });
    expect(mine.data.some((item) => item.id === ticket.id)).toBe(true);
    const unassigned = await ticketService.schoolDesk({ assigneeId: "none" });
    expect(unassigned.data.some((item) => item.id === ticket.id)).toBe(false);
    expect((await ticketService.schoolDeskCounts()).mine).toBe(before.mine + 1);
  });

  it("adds an internal note the parent never sees, then a reply the parent does", async () => {
    const noted = await ticketService.reply(ticket.id, { body: "Check the gradebook entry.", internal: true });
    expect(noted.messages.at(-1)).toMatchObject({ internal: true, body: "Check the gradebook entry." });
    const parentView = await raw<Ticket>("GET", `/tickets/${ticket.id}`, parent);
    expect(parentView.body.messages.some((message) => message.internal)).toBe(false);
    expect(parentView.body.context).toBeNull();

    const replied = await ticketService.reply(ticket.id, { body: "We're correcting it." });
    expect(replied.status).toBe("in_progress");
    const parentList = await raw<{ data: Ticket[] }>("GET", "/tickets/mine?limit=100", parent);
    expect(parentList.body.data.find((item) => item.id === ticket.id)?.unread).toBe(1);
  });

  it("sets the status and priority; a requester's reply to a resolved ticket comes back unread", async () => {
    expect((await ticketService.update(ticket.id, { status: "resolved" })).status).toBe("resolved");
    expect((await raw("POST", `/tickets/${ticket.id}/messages`, parent, { body: "It's still wrong." })).status).toBe(201);
    const row = (await ticketService.schoolDesk({ q: `Live desk ${RUN}` })).data.find((item) => item.id === ticket.id);
    expect(row).toMatchObject({ status: "in_progress", unread: 1 });
    ticket = await ticketService.get(ticket.id);
    expect(ticket.unread).toBe(0);
    const priority = await ticketService.update(ticket.id, { priority: "high" });
    expect(priority.priority).toBe("high");
  });

  it("escalates to Talim: the desk then observes, and a write is 409 TICKET_ESCALATED", async () => {
    const escalated = await ticketService.escalate(ticket.id, { note: "Needs Talim to fix the gradebook." });
    expect(escalated).toMatchObject({ desk: "talim", escalatedFrom: "school", access: "observer", assignee: null, unread: 0 });
    expect(escalated.messages.at(-1)).toMatchObject({ internal: true });
    const row = (await ticketService.schoolDesk({ q: `Live desk ${RUN}` })).data.find((item) => item.id === ticket.id);
    expect(row?.access).toBe("observer");
    const write = await failure(ticketService.reply(ticket.id, { body: "One more note." }));
    expect([write.status, ticketConflictCode(write)]).toEqual([409, "TICKET_ESCALATED"]);
    expect(ticketErrorMessage(write)).toMatch(/escalated to Talim support/);
    const counts = await ticketService.schoolDeskCounts();
    expect(counts.total).toBe(before.total);
  });

  it("raises a ticket to Talim from Help, with context only Talim reads", async () => {
    const context = ticketContext(APP_VERSION, { path: "/help", userAgent: "jest-live (School Admin)" });
    const mine = await ticketService.create({ desk: "talim", area: "payments", subject: `Live help ${RUN}`, body: "Transfers stuck.", context });
    expect(mine).toMatchObject({ desk: "talim", access: "requester", unread: 0, context: null });
    expect(mine.requester.id).toBe(adminId);
    const talimView = await raw<Ticket>("GET", `/tickets/${mine.id}`, platform);
    expect(talimView.body.context).toEqual({ path: "/help", appVersion: APP_VERSION, userAgent: "jest-live (School Admin)" });
    const school = await failure(ticketService.create({ desk: "school", area: "other", subject: "Wrong desk", body: "Staff raise to Talim." }));
    expect(school.status).toBe(400);
    const notResolved = await failure(ticketService.reopen(mine.id));
    expect([notResolved.status, ticketConflictCode(notResolved)]).toEqual([409, "INVALID_TRANSITION"]);
    ticket = mine;
  });

  it("lists Talim's reply as unread in My tickets, clears it on opening, replies and reopens within 7 days", async () => {
    expect((await raw("POST", `/tickets/${ticket.id}/messages`, platform, { body: "Which bank?" })).status).toBe(201);
    expect((await ticketService.mine({ status: ["in_progress"] })).data.find((item) => item.id === ticket.id)?.unread).toBe(1);
    const opened = await ticketService.get(ticket.id);
    expect(opened.messages.map((message) => message.body)).toEqual(["Transfers stuck.", "Which bank?"]);
    expect((await ticketService.mine({})).data.find((item) => item.id === ticket.id)?.unread).toBe(0);
    expect((await ticketService.reply(ticket.id, { body: "GTBank." })).messageCount).toBe(3);
    expect((await raw("PATCH", `/tickets/${ticket.id}`, platform, { status: "resolved" })).status).toBe(200);
    const resolved = await ticketService.get(ticket.id);
    expect(canReopen(resolved)).toBe(true);
    expect((await ticketService.reopen(ticket.id)).status).toBe("open");
  });

  it("answers 409 REOPEN_WINDOW_PASSED after 7 days, and TICKET_CLOSED once closed", async () => {
    expect((await raw("PATCH", `/tickets/${ticket.id}`, platform, { status: "resolved" })).status).toBe(200);
    ageResolved(ticket.id, 8);
    expect(canReopen(await ticketService.get(ticket.id))).toBe(false);
    const reopen = await failure(ticketService.reopen(ticket.id));
    expect([reopen.status, ticketConflictCode(reopen)]).toEqual([409, "REOPEN_WINDOW_PASSED"]);
    expect(ticketErrorMessage(reopen)).toMatch(/within 7 days/);
    const reply = await failure(ticketService.reply(ticket.id, { body: "Again." }));
    expect(ticketConflictCode(reply)).toBe("REOPEN_WINDOW_PASSED");
    expect((await ticketService.close(ticket.id)).status).toBe("closed");
    const late = await failure(ticketService.reply(ticket.id, { body: "One more thing." }));
    expect([late.status, ticketConflictCode(late)]).toEqual([409, "TICKET_CLOSED"]);
  });
});
