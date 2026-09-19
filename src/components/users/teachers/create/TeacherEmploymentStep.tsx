"use client";

import React from "react";
import type { RosterClassesResult } from "@/hooks/users/useRosterClasses";
import { FormField } from "../../create/FormField";
import { InfoNotice } from "../../create/InfoNotice";
import { SelectInput } from "../../create/Controls";
import { EMPLOYMENT_ROLES, EMPLOYMENT_TYPES, type TeacherFormState } from "./teacherForm";
import { TeacherClassPicker } from "./TeacherClassPicker";
import { TeacherSchedulePanel } from "./TeacherSchedulePanel";
import { TeacherSectionHeading } from "./TeacherSectionHeading";
import type { TeacherStepProps } from "./TeacherAccountStep";

interface TeacherEmploymentStepProps extends TeacherStepProps {
  classes: RosterClassesResult;
  onToggleClass: (classId: string) => void;
  onToggleDay: (day: string) => void;
}

/**
 * Step 3 of the add-teacher wizard: employment, class assignments and
 * availability.
 *
 * @param props - Form values, errors, the classes query and the handlers.
 * @returns The step.
 */
export function TeacherEmploymentStep({
  form,
  errors,
  setField,
  classes,
  onToggleClass,
  onToggleDay,
}: TeacherEmploymentStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <TeacherSectionHeading iconPath="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6">
          Employment Information
        </TeacherSectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Employment Type" htmlFor="teacher-employment-type" required error={errors.employmentType}>
            <SelectInput
              id="teacher-employment-type"
              size="lg"
              name="employmentType"
              value={form.employmentType}
              error={errors.employmentType}
              onValueChange={(value) => setField("employmentType", value as TeacherFormState["employmentType"])}
              required
            >
              {EMPLOYMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Employment Role" htmlFor="teacher-employment-role" required error={errors.employmentRole}>
            <SelectInput
              id="teacher-employment-role"
              size="lg"
              name="employmentRole"
              value={form.employmentRole}
              error={errors.employmentRole}
              onValueChange={(value) => setField("employmentRole", value as TeacherFormState["employmentRole"])}
              required
            >
              {EMPLOYMENT_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </SelectInput>
          </FormField>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <TeacherClassPicker classes={classes} selected={form.assignedClasses} onToggle={onToggleClass} />
        <TeacherSchedulePanel form={form} errors={errors} setField={setField} onToggleDay={onToggleDay} />
      </div>

      <InfoNotice title="Ready to Create Teacher Account" tone="success">
        All required information has been collected. Click &quot;Create Teacher&quot; to finalize the
        account setup.
      </InfoNotice>
    </div>
  );
}
