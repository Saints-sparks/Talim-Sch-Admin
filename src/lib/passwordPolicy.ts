/**
 * Password rules shown to the user and checked before sending.
 *
 * The rules come from the server's policy (`GET /auth/password-policy`,
 * Round 4 §34, see `usePasswordPolicy`). Until it answers, or when it can't,
 * {@link DEFAULT_PASSWORD_POLICY} applies: a copy of the backend's
 * `security-config.service.ts`. The symbol check uses the exact character set
 * of `security.service.ts → validatePasswordStrength`, so a password that
 * passes here never fails there.
 */
import type { PasswordPolicy } from "@/types/round4Contract";

/** One line of the checklist, with the check behind it. */
export interface PasswordRule {
  id: "length" | "upper" | "lower" | "number" | "symbol";
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_MIN_LENGTH = 8;

/** The backend's policy, used until (or unless) the API sends its own. */
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: PASSWORD_MIN_LENGTH,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSymbol: true,
  historyCount: 3,
};

/** The symbols the backend accepts. */
const SYMBOLS = /[!@#$%^&*(),.?":{}|<>]/;

/**
 * Reads a policy from the API, keeping the default for any field that is
 * missing or of the wrong type.
 *
 * @param raw - `GET /auth/password-policy`'s body.
 * @returns A complete policy.
 */
export function normalizePasswordPolicy(raw: unknown): PasswordPolicy {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  /**
   * A yes/no field of the payload.
   *
   * @param key - The field.
   * @returns The payload's boolean, else the default's.
   */
  const bool = (key: keyof PasswordPolicy) =>
    typeof r[key] === "boolean" ? (r[key] as boolean) : (DEFAULT_PASSWORD_POLICY[key] as boolean);
  /**
   * A whole-number field of the payload.
   *
   * @param key - The field.
   * @param min - The smallest accepted value.
   * @returns The payload's number when it is a whole number of at least `min`, else the default's.
   */
  const count = (key: "minLength" | "historyCount", min: number) => {
    const value = r[key];
    return typeof value === "number" && Number.isInteger(value) && value >= min ? value : DEFAULT_PASSWORD_POLICY[key];
  };
  return {
    minLength: count("minLength", 1),
    requireUppercase: bool("requireUppercase"),
    requireLowercase: bool("requireLowercase"),
    requireNumber: bool("requireNumber"),
    requireSymbol: bool("requireSymbol"),
    historyCount: count("historyCount", 0),
  };
}

/**
 * The rules a policy asks for, in the order they are listed.
 *
 * @param policy - The server's policy; the default when absent.
 * @returns One rule per requirement.
 */
export function rulesFromPolicy(policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY): PasswordRule[] {
  const min = policy.minLength;
  const rules: PasswordRule[] = [
    { id: "length", label: `At least ${min} character${min === 1 ? "" : "s"}`, test: (p) => p.length >= min },
  ];
  if (policy.requireUppercase) rules.push({ id: "upper", label: "An uppercase letter", test: (p) => /[A-Z]/.test(p) });
  if (policy.requireLowercase) rules.push({ id: "lower", label: "A lowercase letter", test: (p) => /[a-z]/.test(p) });
  if (policy.requireNumber) rules.push({ id: "number", label: "A number", test: (p) => /\d/.test(p) });
  if (policy.requireSymbol) {
    rules.push({
      id: "symbol",
      label: 'A symbol such as ! @ # $ % ^ & * ( ) , . ? " : { } | < >',
      test: (p) => SYMBOLS.test(p),
    });
  }
  return rules;
}

/**
 * The note about reusing old passwords, which only the server can check.
 *
 * @param policy - The server's policy.
 * @returns e.g. "It can't be one of your last 3 passwords.", or null when reuse is allowed.
 */
export function passwordHistoryNote(policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY): string | null {
  const n = policy.historyCount;
  if (n <= 0) return null;
  return n === 1 ? "It can't be your current password." : `It can't be one of your last ${n} passwords.`;
}

/** The default rules (the backend's policy). */
export const PASSWORD_RULES: PasswordRule[] = rulesFromPolicy(DEFAULT_PASSWORD_POLICY);

/**
 * Checks a password against each rule, for the checklist.
 *
 * @param password - Candidate password.
 * @param rules - The rules to check; the default policy's when omitted.
 * @returns Each rule with whether the password satisfies it.
 */
export function evaluatePassword(
  password: string,
  rules: PasswordRule[] = PASSWORD_RULES
): Array<PasswordRule & { met: boolean }> {
  return rules.map((rule) => ({ ...rule, met: rule.test(password) }));
}

/**
 * Whether a password passes every rule, before it is sent.
 *
 * @param password - Candidate password.
 * @param rules - The rules to check; the default policy's when omitted.
 * @returns True when every rule is satisfied.
 */
export function isPasswordValid(password: string, rules: PasswordRule[] = PASSWORD_RULES): boolean {
  return rules.every((rule) => rule.test(password));
}
