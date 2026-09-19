/**
 * Field rules the add-teacher and add-student forms share. They mirror
 * `RegisterUserDto` in talimBE-V2 (`user/data/dtos/register-user.dto.ts`), so
 * the form fails before the API does.
 */

/** `RegisterUserDto.email` — `@IsEmail() @MaxLength(254)`. */
export const EMAIL_MAX = 254;

/** `RegisterUserDto.firstName` / `lastName` — `@MaxLength(80)`. */
export const NAME_MAX = 80;

/** `RegisterUserDto.phoneNumber` — the DTO's `@Matches` pattern, verbatim. */
export const PHONE_PATTERN = /^[+\d][\d\s()-]{6,20}$/;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * True when the string is empty or only whitespace.
 *
 * @param value - The raw field value.
 * @returns Whether nothing usable was typed.
 */
export function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

/**
 * Checks an email the way the API will.
 *
 * @param value - The raw field value.
 * @returns An error message, or `undefined` when the email is acceptable.
 */
export function emailError(value: string): string | undefined {
  const email = value.trim();
  if (email.length === 0) return "Enter an email address.";
  if (email.length > EMAIL_MAX) return `Keep the email to ${EMAIL_MAX} characters or fewer.`;
  if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address.";
  return undefined;
}

/**
 * Checks a person's first or last name.
 *
 * @param value - The raw field value.
 * @param label - "first name" or "last name", used in the message.
 * @returns An error message, or `undefined` when the name is acceptable.
 */
export function nameError(value: string, label: string): string | undefined {
  const name = value.trim();
  if (name.length === 0) return `Enter the ${label}.`;
  if (name.length > NAME_MAX) return `Keep the ${label} to ${NAME_MAX} characters or fewer.`;
  return undefined;
}

/**
 * Checks a phone number against the API's pattern.
 *
 * @param value - The raw field value.
 * @returns An error message, or `undefined` when the number is acceptable.
 */
export function phoneError(value: string): string | undefined {
  const phone = value.trim();
  if (phone.length === 0) return "Enter a phone number.";
  if (!PHONE_PATTERN.test(phone)) return "Enter a valid phone number, e.g. +234 801 234 5678.";
  return undefined;
}
