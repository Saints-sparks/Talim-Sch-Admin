/**
 * Draft state for the teacher editor.
 *
 * The API splits a teacher across five endpoints, so the editor saves one tab
 * at a time. This holds the whole record as one flat form model and turns each
 * tab into exactly the body its endpoint accepts.
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  AcademicQualification,
  TeacherAssignmentsPayload,
  TeacherAvailabilityPayload,
  TeacherById,
  TeacherEmploymentPayload,
  TeacherPersonalDetailsPayload,
  TeacherQualificationsPayload,
} from "@/app/services/teacher.service";

/** The qualifications the backend's `AcademicQualification` enum accepts. */
export const QUALIFICATIONS: readonly AcademicQualification[] = [
  "Undergraduate",
  "Graduate",
  "Postgraduate",
  "Doctorate",
];

/** Employment types, with the labels the form shows. */
export const EMPLOYMENT_TYPES = [
  { value: "Fulltime", label: "Full-time" },
  { value: "Parttime", label: "Part-time" },
] as const;

/** Employment roles, with the labels the form shows. */
export const EMPLOYMENT_ROLES = [
  { value: "Academic", label: "Academic Staff" },
  { value: "NonAcademic", label: "Non-Academic Staff" },
] as const;

/** The days availability can be set for, in week order. */
export const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

/** The genders the backend's `Gender` enum accepts, with their labels. */
export const TEACHER_GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
] as const;

/** Everything the teacher editor can change. */
export interface TeacherDraft {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  /** `YYYY-MM-DD`, as the date input needs it. */
  dateOfBirth: string;
  gender: "" | "male" | "female" | "other";
  highestAcademicQualification: AcademicQualification | "";
  specialization: string;
  /** Kept as a string so the number input can be cleared. */
  yearsOfExperience: string;
  employmentType: "" | "Fulltime" | "Parttime";
  employmentRole: "" | "Academic" | "NonAcademic";
  assignedClasses: string[];
  assignedCourses: string[];
  isFormTeacher: boolean;
  availabilityDays: string[];
  availableTime: string;
}

function toDateInput(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function toGender(value?: string): TeacherDraft["gender"] {
  const lower = (value ?? "").toLowerCase();
  return lower === "male" || lower === "female" || lower === "other" ? lower : "";
}

function toQualification(value?: string): TeacherDraft["highestAcademicQualification"] {
  return QUALIFICATIONS.includes(value as AcademicQualification)
    ? (value as AcademicQualification)
    : "";
}

/** Builds the form model from the teacher the API returned. */
export function draftFromTeacher(teacher: TeacherById): TeacherDraft {
  const classIds = [
    ...(teacher.assignedClasses ?? []),
    ...(teacher.classTeacherClasses ?? []),
  ]
    .map((cls) => cls._id)
    .filter(Boolean);

  return {
    firstName: teacher.userId?.firstName ?? "",
    lastName: teacher.userId?.lastName ?? "",
    email: teacher.userId?.email ?? "",
    phoneNumber: teacher.userId?.phoneNumber ?? "",
    dateOfBirth: toDateInput(teacher.userId?.dateOfBirth),
    gender: toGender(teacher.userId?.gender),
    highestAcademicQualification: toQualification(teacher.highestAcademicQualification),
    specialization: teacher.specialization ?? "",
    yearsOfExperience: teacher.yearsOfExperience?.toString() ?? "",
    employmentType:
      teacher.employmentType === "Fulltime" || teacher.employmentType === "Parttime"
        ? teacher.employmentType
        : "",
    employmentRole:
      teacher.employmentRole === "Academic" || teacher.employmentRole === "NonAcademic"
        ? teacher.employmentRole
        : "",
    // The API can return the same class in both lists; a duplicate id in the
    // assignment payload is rejected.
    assignedClasses: Array.from(new Set(classIds)),
    assignedCourses: (teacher.assignedCourses ?? []).map((course) => course._id).filter(Boolean),
    isFormTeacher: teacher.isFormTeacher ?? false,
    availabilityDays: teacher.availabilityDays ?? [],
    availableTime: teacher.availableTime ?? "",
  };
}

/** The personal-details body for `PATCH /teachers/:userId/personal-details`. */
export function personalPayload(draft: TeacherDraft): TeacherPersonalDetailsPayload {
  return {
    firstName: draft.firstName.trim(),
    lastName: draft.lastName.trim(),
    email: draft.email.trim(),
    ...(draft.phoneNumber.trim() ? { phoneNumber: draft.phoneNumber.trim() } : {}),
    ...(draft.dateOfBirth ? { dateOfBirth: draft.dateOfBirth } : {}),
    ...(draft.gender ? { gender: draft.gender } : {}),
  };
}

/** The qualifications body for `PATCH /teachers/:userId/qualification-details`. */
export function qualificationsPayload(draft: TeacherDraft): TeacherQualificationsPayload {
  const years = Number.parseInt(draft.yearsOfExperience, 10);
  return {
    ...(draft.highestAcademicQualification
      ? { highestAcademicQualification: draft.highestAcademicQualification }
      : {}),
    ...(draft.specialization.trim() ? { specialization: draft.specialization.trim() } : {}),
    ...(Number.isFinite(years) ? { yearsOfExperience: years } : {}),
  };
}

/** The employment body for `PUT /teachers/:userId/employment`. */
export function employmentPayload(draft: TeacherDraft): TeacherEmploymentPayload {
  return {
    ...(draft.employmentType ? { employmentType: draft.employmentType } : {}),
    ...(draft.employmentRole ? { employmentRole: draft.employmentRole } : {}),
  };
}

/** The assignments body for `PATCH /teachers/:userId/class-course-assignments`. */
export function assignmentsPayload(draft: TeacherDraft): TeacherAssignmentsPayload {
  return {
    assignedClasses: draft.assignedClasses,
    assignedCourses: draft.assignedCourses,
    isFormTeacher: draft.isFormTeacher,
  };
}

/** The availability body for `PATCH /teachers/:userId/availability`. */
export function availabilityPayload(draft: TeacherDraft): TeacherAvailabilityPayload {
  return {
    availabilityDays: draft.availabilityDays,
    ...(draft.availableTime.trim() ? { availableTime: draft.availableTime.trim() } : {}),
  };
}

/** What `useTeacherEditor` hands the form. */
export interface TeacherEditorState {
  /** The current form model, or `null` before the teacher loads. */
  draft: TeacherDraft | null;
  /** Changes one field. */
  setField: <K extends keyof TeacherDraft>(field: K, value: TeacherDraft[K]) => void;
  /** Adds or removes one id from a list field. */
  toggleInList: (field: "assignedClasses" | "assignedCourses" | "availabilityDays", value: string) => void;
}

/**
 * Keeps the editable copy of a teacher in sync with the fetched record.
 *
 * @param teacher - The teacher as loaded, or `undefined` while loading.
 * @returns The draft and its setters.
 */
export function useTeacherEditor(teacher: TeacherById | undefined): TeacherEditorState {
  const initial = useMemo(() => (teacher ? draftFromTeacher(teacher) : null), [teacher]);
  const [draft, setDraft] = useState<TeacherDraft | null>(initial);

  useEffect(() => {
    setDraft(initial);
  }, [initial]);

  return {
    draft,
    setField: (field, value) => setDraft((current) => (current ? { ...current, [field]: value } : current)),
    toggleInList: (field, value) =>
      setDraft((current) => {
        if (!current) return current;
        const list = current[field];
        return {
          ...current,
          [field]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
        };
      }),
  };
}
