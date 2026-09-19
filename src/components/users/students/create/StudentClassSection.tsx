"use client";

import React from "react";
import type { RosterClass, RosterClassesResult } from "@/hooks/users/useRosterClasses";
import { FormField } from "../../create/FormField";
import { SelectInput, TextInput } from "../../create/Controls";
import { fieldErrorClass } from "../../create/ui";
import { StudentSectionHeading } from "./StudentSectionHeading";
import type { StudentStepProps } from "./StudentAccountStep";

interface StudentClassSectionProps extends StudentStepProps {
  /** The school's classes and their load state. */
  classes: RosterClassesResult;
  /** The class currently chosen, if any. */
  selectedClass: RosterClass | undefined;
  onSelectClass: (classId: string) => void;
}

/**
 * "Academic Information" block: the class select and the grade level it
 * fills in. The class list comes from the cached classes query, so its loading
 * and failed states are shown here rather than as an empty select. When the
 * chosen class has no grade level of its own, the admin can type one.
 *
 * @param props - Form values, errors, the classes query and the class handler.
 * @returns The block.
 */
export function StudentClassSection({
  form,
  errors,
  setField,
  classes,
  selectedClass,
  onSelectClass,
}: StudentClassSectionProps) {
  const gradeFromClass = Boolean(selectedClass?.gradeLevel);
  const needsManualGrade = Boolean(selectedClass) && !gradeFromClass;
  const emptyClasses = !classes.isPending && !classes.isError && classes.classes.length === 0;

  return (
    <div className="space-y-4">
      <StudentSectionHeading iconPath="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253">
        Academic Information
      </StudentSectionHeading>

      <div className="space-y-4">
        <FormField label="Class" htmlFor="student-class" required compact error={errors.classId}>
          <SelectInput
            id="student-class"
            size="md"
            name="classId"
            value={form.classId}
            error={errors.classId}
            disabled={classes.isPending || classes.isError}
            onValueChange={onSelectClass}
            required
          >
            <option value="" disabled>
              {classes.isPending ? "Loading classes..." : "Select a class"}
            </option>
            {classes.classes.map((classItem) => (
              <option key={classItem._id} value={classItem._id}>
                {classItem.name}
              </option>
            ))}
          </SelectInput>
          {classes.isError && (
            <p role="alert" className={fieldErrorClass}>
              We couldn&apos;t load your classes.{" "}
              <button type="button" onClick={classes.refetch} className="font-semibold underline">
                Try again
              </button>
            </p>
          )}
          {emptyClasses && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              No classes yet. Create a class first, then enrol the student in it.
            </p>
          )}
        </FormField>

        <FormField label="Grade Level" htmlFor="student-grade" required compact error={errors.gradeLevel}>
          {needsManualGrade ? (
            <TextInput
              id="student-grade"
              size="md"
              type="text"
              name="gradeLevel"
              placeholder="e.g. JSS1"
              value={form.gradeLevel}
              error={errors.gradeLevel}
              onValueChange={(value) => setField("gradeLevel", value)}
            />
          ) : (
            <div
              id="student-grade"
              className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 ${
                form.gradeLevel
                  ? "text-gray-700 dark:text-gray-200"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {form.gradeLevel || "Auto-filled when a class is selected"}
            </div>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {needsManualGrade
              ? "This class has no grade level set, so enter one."
              : "Inherited from the selected class"}
          </p>
        </FormField>
      </div>
    </div>
  );
}
