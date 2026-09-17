"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Permission } from "@/lib/permissions";
import type { RosterClass } from "@/hooks/users/useRosterClasses";
import {
  EMPLOYMENT_ROLES,
  EMPLOYMENT_TYPES,
  QUALIFICATIONS,
  TEACHER_GENDERS,
  WEEK_DAYS,
  type TeacherDraft,
} from "@/hooks/users/useTeacherEditor";

type SetField = <K extends keyof TeacherDraft>(field: K, value: TeacherDraft[K]) => void;
type ToggleList = (
  field: "assignedClasses" | "assignedCourses" | "availabilityDays",
  value: string,
) => void;

/** A course as the assignment picker needs it. */
export interface AssignableCourse {
  _id: string;
  title?: string;
  courseCode?: string;
  name?: string;
  code?: string;
}

const inputClass = "bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600";

function Labelled({ htmlFor, label, children }: { htmlFor: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-sm font-medium text-gray-700 dark:text-slate-300">
        {label}
      </Label>
      {children}
    </div>
  );
}

interface SectionShellProps {
  /** Section title. */
  title: string;
  /** Submits this section. */
  onSubmit: (event: React.FormEvent) => void;
  /** True while this section is saving. */
  isSaving: boolean;
  /** Deactivates the teacher. */
  onDeactivate: () => void;
  /** True when the teacher is already deactivated. */
  isDeactivated: boolean;
  children: React.ReactNode;
}

/** One tab of the editor: its fields, an Update button and the deactivate action. */
function SectionShell({
  title,
  onSubmit,
  isSaving,
  onDeactivate,
  isDeactivated,
  children,
}: SectionShellProps) {
  return (
    <form onSubmit={onSubmit}>
      <div className="space-y-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between pt-6 border-t border-gray-200 dark:border-slate-700">
          <PermissionGate permission={Permission.MANAGE_TEACHERS}>
            <Button
              type="button"
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={onDeactivate}
              disabled={isDeactivated}
            >
              {isDeactivated ? "Already Deactivated" : "Deactivate Teacher"}
            </Button>
          </PermissionGate>
          <Button type="submit" className="bg-blue-900 hover:bg-blue-800 px-8" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

interface TabProps {
  draft: TeacherDraft;
  setField: SetField;
  onSubmit: (event: React.FormEvent) => void;
  isSaving: boolean;
  onDeactivate: () => void;
  isDeactivated: boolean;
}

/** Name, contact, date of birth and gender. */
export function TeacherEditPersonalTab({
  draft,
  setField,
  onSubmit,
  isSaving,
  onDeactivate,
  isDeactivated,
}: TabProps) {
  return (
    <SectionShell
      title="Personal Details"
      onSubmit={onSubmit}
      isSaving={isSaving}
      onDeactivate={onDeactivate}
      isDeactivated={isDeactivated}
    >
      <Labelled htmlFor="firstName" label="First Name">
        <Input
          id="firstName"
          value={draft.firstName}
          onChange={(e) => setField("firstName", e.target.value)}
          placeholder="Enter first name"
          className={inputClass}
        />
      </Labelled>
      <Labelled htmlFor="lastName" label="Last Name">
        <Input
          id="lastName"
          value={draft.lastName}
          onChange={(e) => setField("lastName", e.target.value)}
          placeholder="Enter last name"
          className={inputClass}
        />
      </Labelled>
      <Labelled htmlFor="phoneNumber" label="Phone Number">
        <Input
          id="phoneNumber"
          value={draft.phoneNumber}
          onChange={(e) => setField("phoneNumber", e.target.value)}
          placeholder="e.g. +2348012345678"
          className={inputClass}
        />
      </Labelled>
      <Labelled htmlFor="email" label="Email Address">
        <Input
          id="email"
          type="email"
          value={draft.email}
          onChange={(e) => setField("email", e.target.value)}
          placeholder="e.g. teacher@school.edu"
          className={inputClass}
        />
      </Labelled>
      <Labelled htmlFor="dateOfBirth" label="Date of Birth">
        <Input
          id="dateOfBirth"
          type="date"
          value={draft.dateOfBirth}
          onChange={(e) => setField("dateOfBirth", e.target.value)}
          className={inputClass}
        />
      </Labelled>
      <Labelled htmlFor="gender" label="Gender">
        <Select
          value={draft.gender}
          onValueChange={(value) => setField("gender", value as TeacherDraft["gender"])}
        >
          <SelectTrigger id="gender" className={inputClass}>
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            {TEACHER_GENDERS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Labelled>
    </SectionShell>
  );
}

/** Highest qualification, years of experience and specialization. */
export function TeacherEditQualificationsTab({
  draft,
  setField,
  onSubmit,
  isSaving,
  onDeactivate,
  isDeactivated,
}: TabProps) {
  return (
    <SectionShell
      title="Qualifications & Experience"
      onSubmit={onSubmit}
      isSaving={isSaving}
      onDeactivate={onDeactivate}
      isDeactivated={isDeactivated}
    >
      <Labelled htmlFor="qualification" label="Highest Qualification">
        <Select
          value={draft.highestAcademicQualification}
          onValueChange={(value) =>
            setField("highestAcademicQualification", value as TeacherDraft["highestAcademicQualification"])
          }
        >
          <SelectTrigger id="qualification" className={inputClass}>
            <SelectValue placeholder="Select qualification" />
          </SelectTrigger>
          <SelectContent>
            {QUALIFICATIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Labelled>
      <Labelled htmlFor="experience" label="Years of Teaching Experience">
        <Input
          id="experience"
          type="number"
          min={0}
          max={50}
          value={draft.yearsOfExperience}
          onChange={(e) => setField("yearsOfExperience", e.target.value)}
          placeholder="Enter years"
          className={inputClass}
        />
      </Labelled>
      <div className="md:col-span-2">
        <Labelled htmlFor="specialization" label="Specialization / Subject Expertise">
          <Input
            id="specialization"
            value={draft.specialization}
            onChange={(e) => setField("specialization", e.target.value)}
            placeholder="e.g. Mathematics"
            className={inputClass}
          />
        </Labelled>
      </div>
    </SectionShell>
  );
}

/** Employment type and role. */
export function TeacherEditEmploymentTab({
  draft,
  setField,
  onSubmit,
  isSaving,
  onDeactivate,
  isDeactivated,
}: TabProps) {
  return (
    <SectionShell
      title="Employment Details"
      onSubmit={onSubmit}
      isSaving={isSaving}
      onDeactivate={onDeactivate}
      isDeactivated={isDeactivated}
    >
      <Labelled htmlFor="employmentType" label="Employment Type">
        <Select
          value={draft.employmentType}
          onValueChange={(value) => setField("employmentType", value as TeacherDraft["employmentType"])}
        >
          <SelectTrigger id="employmentType" className={inputClass}>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {EMPLOYMENT_TYPES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Labelled>
      <Labelled htmlFor="employmentRole" label="Employment Role">
        <Select
          value={draft.employmentRole}
          onValueChange={(value) => setField("employmentRole", value as TeacherDraft["employmentRole"])}
        >
          <SelectTrigger id="employmentRole" className={inputClass}>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {EMPLOYMENT_ROLES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Labelled>
    </SectionShell>
  );
}

function CheckboxList({
  legend,
  emptyMessage,
  items,
  selected,
  onToggle,
}: {
  legend: string;
  emptyMessage: string;
  items: Array<{ id: string; label: string }>;
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{legend}</legend>
      <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 p-3 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400">{emptyMessage}</p>
        ) : (
          items.map((item) => (
            <label key={item.id} className="flex items-center gap-3 text-sm text-gray-700 dark:text-slate-200">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={selected.includes(item.id)}
                onChange={() => onToggle(item.id)}
              />
              <span>{item.label}</span>
            </label>
          ))
        )}
      </div>
    </fieldset>
  );
}

/** Classes and courses the teacher is assigned to, and the form-teacher flag. */
export function TeacherEditAssignmentsTab({
  draft,
  setField,
  toggleInList,
  classes,
  courses,
  onSubmit,
  isSaving,
  onDeactivate,
  isDeactivated,
}: TabProps & {
  toggleInList: ToggleList;
  classes: RosterClass[];
  courses: AssignableCourse[];
}) {
  return (
    <SectionShell
      title="Assign to Classes and Courses"
      onSubmit={onSubmit}
      isSaving={isSaving}
      onDeactivate={onDeactivate}
      isDeactivated={isDeactivated}
    >
      <CheckboxList
        legend="Classes"
        emptyMessage="No classes have been created yet."
        items={classes.map((cls) => ({ id: cls._id, label: cls.name }))}
        selected={draft.assignedClasses}
        onToggle={(id) => toggleInList("assignedClasses", id)}
      />
      <CheckboxList
        legend="Courses"
        emptyMessage="No courses have been created yet."
        items={courses.map((course) => ({
          id: course._id,
          label: `${course.courseCode ?? course.code ?? ""} ${course.title ?? course.name ?? ""}`.trim(),
        }))}
        selected={draft.assignedCourses}
        onToggle={(id) => toggleInList("assignedCourses", id)}
      />

      <div className="md:col-span-2 space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
          <input
            type="checkbox"
            className="rounded border-gray-300"
            checked={draft.isFormTeacher}
            onChange={(e) => setField("isFormTeacher", e.target.checked)}
          />
          Make this teacher a Form Teacher
        </label>
        <p className="text-xs text-gray-500 dark:text-slate-400">
          Saving replaces the teacher&apos;s classes and courses with exactly what is ticked here.
        </p>
      </div>
    </SectionShell>
  );
}

/** Available days and hours. */
export function TeacherEditAvailabilityTab({
  draft,
  setField,
  toggleInList,
  onSubmit,
  isSaving,
  onDeactivate,
  isDeactivated,
}: TabProps & { toggleInList: ToggleList }) {
  return (
    <SectionShell
      title="Teacher Availability"
      onSubmit={onSubmit}
      isSaving={isSaving}
      onDeactivate={onDeactivate}
      isDeactivated={isDeactivated}
    >
      <div className="md:col-span-2">
        <CheckboxList
          legend="Available Days"
          emptyMessage=""
          items={WEEK_DAYS.map((day) => ({ id: day, label: day }))}
          selected={draft.availabilityDays}
          onToggle={(day) => toggleInList("availabilityDays", day)}
        />
      </div>
      <div className="md:col-span-2">
        <Labelled htmlFor="availableTime" label="Available Time (optional)">
          <Input
            id="availableTime"
            value={draft.availableTime}
            onChange={(e) => setField("availableTime", e.target.value)}
            placeholder="e.g. 08:00 AM - 03:00 PM"
            className={inputClass}
          />
        </Labelled>
      </div>
    </SectionShell>
  );
}
