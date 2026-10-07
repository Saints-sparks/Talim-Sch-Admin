"use client";

import React from "react";
import type { RosterClass, RosterClassesResult } from "@/hooks/users/useRosterClasses";
import { InfoNotice } from "../../create/InfoNotice";
import {
  STUDENT_FIELD_LABELS,
  validateStudentStep,
  type StudentField,
} from "./studentForm";
import { StudentClassSection } from "./StudentClassSection";
import { StudentParentSection } from "./StudentParentSection";
import type { StudentStepProps } from "./StudentAccountStep";

/** Props for {@link StudentProfileStep}. */
interface StudentProfileStepProps extends StudentStepProps {
  /** The school's classes and their load state. */
  classes: RosterClassesResult;
  /** The class currently chosen, if any. */
  selectedClass: RosterClass | undefined;
  /** Picks a class. */
  onSelectClass: (classId: string) => void;
}

/**
 * Step 2 of the add-student wizard: class placement, grade level and the
 * parent contact, with a live note of what is still missing.
 *
 * @param props - Form values, errors, the classes query and the class handler.
 * @param props.form - The values.
 * @param props.errors - The errors.
 * @param props.setField - Field setter.
 * @param props.classes - The classes query.
 * @param props.selectedClass - The chosen class.
 * @param props.onSelectClass - Class handler.
 * @returns The step.
 */
export function StudentProfileStep({
  form,
  errors,
  setField,
  classes,
  selectedClass,
  onSelectClass,
}: StudentProfileStepProps) {
  const outstanding = Object.keys(validateStudentStep(1, form)) as StudentField[];
  const complete = outstanding.length === 0;

  return (
    <div className="space-y-6">
      <StudentClassSection
        form={form}
        errors={errors}
        setField={setField}
        classes={classes}
        selectedClass={selectedClass}
        onSelectClass={onSelectClass}
      />
      <StudentParentSection form={form} errors={errors} setField={setField} />
      <InfoNotice tone={complete ? "success" : "warning"} rounded="lg">
        {complete
          ? 'All required information has been collected. Click "Create Student" to finalize the account setup.'
          : `Still needed: ${outstanding.map((field) => STUDENT_FIELD_LABELS[field]).join(", ")}.`}
      </InfoNotice>
    </div>
  );
}
