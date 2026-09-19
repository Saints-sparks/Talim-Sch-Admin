/**
 * The add-teacher form as data: its shape, defaults, per-step validation and
 * the request bodies it produces. Kept free of React so the rules and the
 * payloads can be tested directly.
 *
 * The bodies match talimBE-V2's `RegisterUserDto` (`POST /auth/register`) and
 * `CreateTeacherDto` (`POST /teachers/:userId`). The API whitelists and
 * forbids unknown properties, so an extra field is a 400 — and no `password`
 * is ever sent: the server generates a temporary one and forces a change at
 * first sign-in.
 */
import type { CreateTeacherInput } from "@/hooks/users/useTeachers";
import type { AcademicQualification } from "@/app/services/teacher.service";
import { emailError, isBlank, nameError, phoneError } from "../../create/validation";

/** Exactly the backend's `AcademicQualification` enum. */
export const ACADEMIC_QUALIFICATIONS: readonly AcademicQualification[] = [
  "Undergraduate",
  "Graduate",
  "Postgraduate",
  "Doctorate",
];

/** The backend's `EmploymentType` enum. */
export const EMPLOYMENT_TYPES = ["Fulltime", "Parttime"] as const;

/** The employment roles the form offers (the backend also knows `NonAcademic`). */
export const EMPLOYMENT_ROLES = ["Academic"] as const;

/** Days a teacher can be marked available. */
export const AVAILABILITY_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

/** Working-hour windows the form offers. */
export const AVAILABLE_TIME_SLOTS = [
  "8:00 AM - 2:00 PM",
  "9:00 AM - 3:00 PM",
  "10:00 AM - 4:00 PM",
] as const;

/** The values offered by the years-of-experience select (0 means "not chosen"). */
export const EXPERIENCE_YEARS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20] as const;

/** `CreateTeacherDto.yearsOfExperience` — `@Min(0) @Max(50)`. */
export const EXPERIENCE_MAX = 50;

/** Zero-based wizard step: 0 account, 1 qualifications, 2 employment. */
export type TeacherStep = 0 | 1 | 2;

/** Index of the last wizard step. */
export const TEACHER_LAST_STEP: TeacherStep = 2;

/** Everything the wizard collects. */
export interface TeacherFormState {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: "" | "male" | "female" | "other";
  highestAcademicQualification: AcademicQualification;
  yearsOfExperience: number;
  specialization: string;
  employmentType: (typeof EMPLOYMENT_TYPES)[number];
  employmentRole: "Academic" | "NonAcademic";
  availabilityDays: string[];
  availableTime: string;
  isFormTeacher: boolean;
  assignedClasses: string[];
}

/** A field of the form. */
export type TeacherField = keyof TeacherFormState;

/** Field-level error messages, keyed by field. */
export type TeacherFormErrors = Partial<Record<TeacherField, string>>;

/** A fresh form. */
export const INITIAL_TEACHER_FORM: TeacherFormState = {
  email: "",
  firstName: "",
  lastName: "",
  phoneNumber: "",
  dateOfBirth: "",
  gender: "",
  highestAcademicQualification: "Graduate",
  yearsOfExperience: 0,
  specialization: "",
  employmentType: "Fulltime",
  employmentRole: "Academic",
  availabilityDays: [],
  availableTime: "",
  isFormTeacher: false,
  assignedClasses: [],
};

/** Which wizard step each field lives on. */
export const TEACHER_FIELD_STEP: Record<TeacherField, TeacherStep> = {
  email: 0,
  firstName: 0,
  lastName: 0,
  phoneNumber: 0,
  dateOfBirth: 0,
  gender: 0,
  highestAcademicQualification: 1,
  yearsOfExperience: 1,
  specialization: 1,
  employmentType: 2,
  employmentRole: 2,
  availabilityDays: 2,
  availableTime: 2,
  isFormTeacher: 2,
  assignedClasses: 2,
};

/** Field names as the admin reads them, for the "Please complete" toast. */
export const TEACHER_FIELD_LABELS: Record<TeacherField, string> = {
  email: "email address",
  firstName: "first name",
  lastName: "last name",
  phoneNumber: "phone number",
  dateOfBirth: "date of birth",
  gender: "gender",
  highestAcademicQualification: "highest qualification",
  yearsOfExperience: "years of experience",
  specialization: "specialization",
  employmentType: "employment type",
  employmentRole: "employment role",
  availabilityDays: "availability days",
  availableTime: "available time",
  isFormTeacher: "form teacher",
  assignedClasses: "assigned classes",
};

/**
 * Whether a server-reported field name belongs to this form.
 *
 * @param field - A field name from the API's validation details.
 * @returns True when it is one of the form's fields.
 */
export function isTeacherField(field: string): field is TeacherField {
  return Object.prototype.hasOwnProperty.call(TEACHER_FIELD_STEP, field);
}

/**
 * Validates one wizard step against the rules the API enforces.
 *
 * @param step - The step being left.
 * @param form - The current form values.
 * @returns Errors for the step's fields; empty when the step is valid.
 */
export function validateTeacherStep(step: TeacherStep, form: TeacherFormState): TeacherFormErrors {
  const errors: TeacherFormErrors = {};

  if (step === 0) {
    const email = emailError(form.email);
    if (email) errors.email = email;
    const first = nameError(form.firstName, "first name");
    if (first) errors.firstName = first;
    const last = nameError(form.lastName, "last name");
    if (last) errors.lastName = last;
    const phone = phoneError(form.phoneNumber);
    if (phone) errors.phoneNumber = phone;
    if (isBlank(form.dateOfBirth)) errors.dateOfBirth = "Choose a date of birth.";
    if (isBlank(form.gender)) errors.gender = "Choose a gender.";
  }

  if (step === 1) {
    if (isBlank(form.specialization)) errors.specialization = "Enter an area of specialization.";
    const years = form.yearsOfExperience;
    if (!Number.isInteger(years) || years < 0 || years > EXPERIENCE_MAX) {
      errors.yearsOfExperience = `Choose between 0 and ${EXPERIENCE_MAX} years.`;
    }
  }

  if (step === 2) {
    if (form.availabilityDays.length === 0) errors.availabilityDays = "Pick at least one day.";
    if (isBlank(form.availableTime)) errors.availableTime = "Pick an available time.";
  }

  return errors;
}

/**
 * The toast text for a step that failed validation.
 *
 * @param errors - The step's errors.
 * @returns "Please complete: …" naming each field in the admin's words.
 */
export function describeTeacherErrors(errors: TeacherFormErrors): string {
  const names = (Object.keys(errors) as TeacherField[]).map((field) => TEACHER_FIELD_LABELS[field]);
  return `Please complete: ${names.join(", ")}`;
}

/**
 * The lowest step holding an error, so a failed submit lands on the right page.
 *
 * @param fields - Fields with errors.
 * @returns The step to show, or `null` when there are none.
 */
export function firstStepWithError(fields: readonly TeacherField[]): TeacherStep | null {
  if (fields.length === 0) return null;
  return Math.min(...fields.map((field) => TEACHER_FIELD_STEP[field])) as TeacherStep;
}

/**
 * Builds the two request bodies from the form.
 *
 * Date of birth and gender belong to the account: the create-profile DTO
 * rejects any field it does not declare, so they go out with the registration.
 * `assignedCourses` stays empty — course links are made from course setup.
 *
 * @param form - The validated form.
 * @param schoolId - The signed-in school.
 * @returns The account body and the profile body.
 */
export function buildTeacherCreateInput(form: TeacherFormState, schoolId: string): CreateTeacherInput {
  return {
    account: {
      email: form.email.trim(),
      role: "teacher",
      schoolId,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phoneNumber: form.phoneNumber.trim() || undefined,
      ...(form.dateOfBirth ? { dateOfBirth: form.dateOfBirth } : {}),
      ...(form.gender ? { gender: form.gender } : {}),
    },
    profile: {
      highestAcademicQualification: form.highestAcademicQualification,
      yearsOfExperience: form.yearsOfExperience,
      specialization: form.specialization.trim(),
      employmentType: form.employmentType,
      employmentRole: form.employmentRole,
      availabilityDays: form.availabilityDays,
      availableTime: form.availableTime,
      isFormTeacher: form.isFormTeacher,
      assignedClasses: form.assignedClasses,
      assignedCourses: [],
    },
  };
}
