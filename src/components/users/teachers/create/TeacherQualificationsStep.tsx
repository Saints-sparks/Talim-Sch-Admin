"use client";

import React from "react";
import { FormField } from "../../create/FormField";
import { InfoNotice } from "../../create/InfoNotice";
import { SelectInput, TextInput } from "../../create/Controls";
import {
  ACADEMIC_QUALIFICATIONS,
  EXPERIENCE_YEARS,
  type TeacherFormState,
} from "./teacherForm";
import { TeacherSectionHeading } from "./TeacherSectionHeading";
import type { TeacherStepProps } from "./TeacherAccountStep";

/**
 * Step 2 of the add-teacher wizard: highest qualification, experience and
 * specialization.
 *
 * @param props - Form values, errors and the field setter.
 * @returns The step.
 */
export function TeacherQualificationsStep({ form, errors, setField }: TeacherStepProps) {
  return (
    <div className="space-y-8">
      <div>
        <TeacherSectionHeading iconPath="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z">
          Academic Qualifications
        </TeacherSectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Highest Academic Qualification"
            htmlFor="teacher-qualification"
            required
            error={errors.highestAcademicQualification}
          >
            <SelectInput
              id="teacher-qualification"
              size="lg"
              name="highestAcademicQualification"
              value={form.highestAcademicQualification}
              error={errors.highestAcademicQualification}
              onValueChange={(value) =>
                setField(
                  "highestAcademicQualification",
                  value as TeacherFormState["highestAcademicQualification"],
                )
              }
              required
            >
              {ACADEMIC_QUALIFICATIONS.map((qualification) => (
                <option key={qualification} value={qualification}>
                  {qualification}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField
            label="Years of Experience"
            htmlFor="teacher-experience"
            required
            error={errors.yearsOfExperience}
          >
            <SelectInput
              id="teacher-experience"
              size="lg"
              name="yearsOfExperience"
              value={String(form.yearsOfExperience)}
              error={errors.yearsOfExperience}
              onValueChange={(value) => setField("yearsOfExperience", Number(value))}
              required
            >
              <option value={0}>Select years of experience</option>
              {EXPERIENCE_YEARS.map((year) => (
                <option key={year} value={year}>
                  {year} {year === 1 ? "year" : "years"}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField
            label="Area of Specialization"
            htmlFor="teacher-specialization"
            required
            error={errors.specialization}
            className="md:col-span-2"
          >
            <TextInput
              id="teacher-specialization"
              size="lg"
              type="text"
              name="specialization"
              placeholder="e.g., Mathematics, English Literature, Chemistry"
              value={form.specialization}
              error={errors.specialization}
              onValueChange={(value) => setField("specialization", value)}
            />
          </FormField>
        </div>
      </div>

      <InfoNotice title="Next: Employment Details">
        Final step - employment type, class assignments, and schedule details.
      </InfoNotice>
    </div>
  );
}
