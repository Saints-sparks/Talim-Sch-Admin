/**
 * Password rules shown to the user. Mirrors the backend policy
 * (`talimBE-V2/src/modules/user/service/security-config.service.ts` and
 * `security.service.ts → validatePasswordStrength`), including the exact
 * special-character set, so a password that passes here never fails there.
 */
export interface PasswordRule {
  id: "length" | "upper" | "lower" | "number" | "symbol";
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_RULES: PasswordRule[] = [
  { id: "length", label: `At least ${PASSWORD_MIN_LENGTH} characters`, test: (p) => p.length >= PASSWORD_MIN_LENGTH },
  { id: "upper", label: "An uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { id: "lower", label: "A lowercase letter", test: (p) => /[a-z]/.test(p) },
  { id: "number", label: "A number", test: (p) => /\d/.test(p) },
  { id: "symbol", label: 'A symbol such as ! @ # $ % ^ & * ( ) , . ? " : { } | < >', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

/**
 * @param password - Candidate password.
 * @returns Each rule with whether the password satisfies it.
 */
export function evaluatePassword(password: string): Array<PasswordRule & { met: boolean }> {
  return PASSWORD_RULES.map((rule) => ({ ...rule, met: rule.test(password) }));
}

/**
 * @param password - Candidate password.
 * @returns True when every rule is satisfied.
 */
export function isPasswordValid(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}
