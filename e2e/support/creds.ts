/**
 * The accounts created by the backend's `e2e/seed.js`. Fixed on purpose: the
 * seed prints the same list, and the README documents it.
 */
export const API_URL = process.env.E2E_API_URL ?? "http://localhost:5055";
export const ENVELOPE = process.env.E2E_ENVELOPE ?? "false";

export interface Account {
  email: string;
  password: string;
  name: string;
}

const PASSWORD = "Demo#Pass2026";

export const ACCOUNTS = {
  schoolAdmin: { email: "admin@e2e.talim.test", password: PASSWORD, name: "Sade Principal" },
  /** Holds manage:students and manage:announcements only. */
  subAdmin: { email: "subadmin@e2e.talim.test", password: PASSWORD, name: "Sam Subadmin" },
  /** Class teacher of Grade 5A; teaches Mathematics 5A and English 5A. */
  teacher: { email: "teacher@e2e.talim.test", password: PASSWORD, name: "Tolu Teacher" },
  /** Teaches Basic Science 5A only (Grade 5A's other course teacher). */
  thirdTeacher: { email: "third.teacher@e2e.talim.test", password: PASSWORD, name: "Tade Third" },
  student: { email: "ada.student@e2e.talim.test", password: PASSWORD, name: "Ada Student" },
  parent: { email: "parent@e2e.talim.test", password: PASSWORD, name: "Paul Parent" },
} satisfies Record<string, Account>;

export const AUTH_DIR = "e2e/.auth";
export const authFile = (key: keyof typeof ACCOUNTS): string => `${AUTH_DIR}/${key}.json`;
