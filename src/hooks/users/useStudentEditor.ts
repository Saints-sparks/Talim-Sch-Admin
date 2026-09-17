/**
 * Draft state for the student editor.
 *
 * The page used to edit the fetched `StudentById` object in place and post it
 * back with a cast, which is how `GRANDPARENT` and title-case genders — neither
 * accepted by the backend — reached the API. The draft here is a flat form
 * model, and `toUpdatePayload` is the one place it becomes an `UpdateStudentDto`.
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  ParentRelationship,
  StudentById,
  UpdateStudentPayload,
} from "@/app/services/student.service";

/** The relationships the backend accepts, with the labels the form shows. */
export const PARENT_RELATIONSHIPS: ReadonlyArray<{ value: ParentRelationship; label: string }> = [
  { value: "MOTHER", label: "Mother" },
  { value: "FATHER", label: "Father" },
  { value: "GUARDIAN", label: "Guardian" },
  { value: "OTHER", label: "Other" },
];

/** The genders the backend's `Gender` enum accepts, with their labels. */
export const GENDERS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

/** Everything the student editor can change. */
export interface StudentDraft {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  /** `YYYY-MM-DD`, as the date input needs it. */
  dateOfBirth: string;
  gender: string;
  userAvatar: string;
  parentFullName: string;
  parentPhone: string;
  parentEmail: string;
  relationship: ParentRelationship | "";
  classId: string;
  isActive: boolean;
}

/** The date part of whatever the API returned, for an `<input type="date">`. */
function toDateInput(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

/** A stored gender in whatever case, as one of the enum's lowercase values. */
function toGenderValue(value?: string): string {
  const lower = (value ?? "").toLowerCase();
  return GENDERS.some((option) => option.value === lower) ? lower : "";
}

/** A stored relationship, or `""` when it is not one the form offers. */
function toRelationship(value?: string): ParentRelationship | "" {
  const upper = (value ?? "").toUpperCase();
  return PARENT_RELATIONSHIPS.some((option) => option.value === upper)
    ? (upper as ParentRelationship)
    : "";
}

/** Builds the form model from the student the API returned. */
export function draftFromStudent(student: StudentById): StudentDraft {
  return {
    firstName: student.userId?.firstName ?? "",
    lastName: student.userId?.lastName ?? "",
    email: student.userId?.email ?? "",
    phoneNumber: student.userId?.phoneNumber ?? "",
    dateOfBirth: toDateInput(student.userId?.dateOfBirth),
    gender: toGenderValue(student.userId?.gender),
    userAvatar: student.userId?.userAvatar ?? "",
    parentFullName: student.parentContact?.fullName ?? "",
    parentPhone: student.parentContact?.phoneNumber ?? "",
    parentEmail: student.parentContact?.email ?? "",
    relationship: toRelationship(student.parentContact?.relationship),
    classId: student.classId?._id ?? "",
    isActive: student.isActive,
  };
}

/**
 * The draft as an `UpdateStudentDto`. Empty optional fields are left out
 * rather than sent as `""`, which the backend would store over a real value.
 *
 * @param draft - The edited form model.
 * @returns The request body.
 */
export function toUpdatePayload(draft: StudentDraft): UpdateStudentPayload {
  const payload: UpdateStudentPayload = {
    userInfo: {
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      phoneNumber: draft.phoneNumber.trim(),
      email: draft.email.trim(),
      ...(draft.dateOfBirth ? { dateOfBirth: draft.dateOfBirth } : {}),
      ...(draft.gender ? { gender: draft.gender } : {}),
      ...(draft.userAvatar ? { userAvatar: draft.userAvatar } : {}),
    },
    isActive: draft.isActive,
  };

  if (draft.classId) payload.classId = draft.classId;
  if (draft.relationship) {
    payload.parentContact = {
      fullName: draft.parentFullName.trim(),
      phoneNumber: draft.parentPhone.trim(),
      email: draft.parentEmail.trim(),
      relationship: draft.relationship,
    };
  }

  return payload;
}

/** The fields that are required but empty, in the words the admin sees. */
export function draftProblems(draft: StudentDraft): string[] {
  const problems: string[] = [];
  if (!draft.firstName.trim()) problems.push("first name");
  if (!draft.lastName.trim()) problems.push("last name");
  if (!draft.email.trim()) problems.push("email address");
  if (!draft.parentFullName.trim()) problems.push("parent/guardian name");
  if (!draft.relationship) problems.push("relationship");
  if (!draft.parentEmail.trim()) problems.push("parent/guardian email");
  return problems;
}

/** What `useStudentEditor` hands the form. */
export interface StudentEditorState {
  /** The current form model, or `null` before the student loads. */
  draft: StudentDraft | null;
  /** Changes one field. */
  setField: <K extends keyof StudentDraft>(field: K, value: StudentDraft[K]) => void;
  /** True once the admin has changed something. */
  isDirty: boolean;
}

/**
 * Keeps the editable copy of a student in sync with the fetched record.
 *
 * @param student - The student as loaded, or `undefined` while loading.
 * @returns The draft, a field setter and whether anything has changed.
 */
export function useStudentEditor(student: StudentById | undefined): StudentEditorState {
  const initial = useMemo(() => (student ? draftFromStudent(student) : null), [student]);
  const [draft, setDraft] = useState<StudentDraft | null>(initial);

  useEffect(() => {
    setDraft(initial);
  }, [initial]);

  return {
    draft,
    setField: (field, value) => setDraft((current) => (current ? { ...current, [field]: value } : current)),
    isDirty: Boolean(initial && draft && JSON.stringify(initial) !== JSON.stringify(draft)),
  };
}
