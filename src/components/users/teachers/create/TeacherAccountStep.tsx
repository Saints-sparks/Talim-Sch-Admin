"use client";

import React from "react";
import { FormField } from "../../create/FormField";
import { InfoNotice } from "../../create/InfoNotice";
import { SelectInput, TextInput } from "../../create/Controls";
import type { TeacherFormErrors, TeacherFormState, TeacherField } from "./teacherForm";
import { TeacherSectionHeading } from "./TeacherSectionHeading";

/** Props every teacher wizard step takes. */
export interface TeacherStepProps {
  form: TeacherFormState;
  errors: TeacherFormErrors;
  setField: <K extends TeacherField>(field: K, value: TeacherFormState[K]) => void;
}

/**
 * Step 1 of the add-teacher wizard: login email and personal details. The
 * password is never collected — the API emails the teacher a set-password link.
 *
 * @param props - Form values, errors and the field setter.
 * @returns The step.
 */
export function TeacherAccountStep({ form, errors, setField }: TeacherStepProps) {
  return (
    <div className="space-y-8">
      <div>
        <TeacherSectionHeading iconPath="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z">
          Login Credentials
        </TeacherSectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Email Address" htmlFor="teacher-email" required error={errors.email}>
            <TextInput
              id="teacher-email"
              size="lg"
              type="email"
              name="email"
              autoComplete="off"
              placeholder="teacher@example.com"
              value={form.email}
              error={errors.email}
              onValueChange={(value) => setField("email", value)}
              required
            />
          </FormField>
          <div className="rounded-xl border-2 border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 px-4 py-3 text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium">Password</p>
            <p className="mt-1 text-xs text-blue-800 dark:text-blue-200">
              A temporary password is generated automatically and the teacher receives an email to
              set their own before first login.
            </p>
          </div>
        </div>
      </div>

      <div>
        <TeacherSectionHeading iconPath="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z">
          Personal Information
        </TeacherSectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="First Name" htmlFor="teacher-first-name" required error={errors.firstName}>
            <TextInput
              id="teacher-first-name"
              size="lg"
              type="text"
              name="firstName"
              placeholder="Enter first name"
              value={form.firstName}
              error={errors.firstName}
              onValueChange={(value) => setField("firstName", value)}
              required
            />
          </FormField>
          <FormField label="Last Name" htmlFor="teacher-last-name" required error={errors.lastName}>
            <TextInput
              id="teacher-last-name"
              size="lg"
              type="text"
              name="lastName"
              placeholder="Enter last name"
              value={form.lastName}
              error={errors.lastName}
              onValueChange={(value) => setField("lastName", value)}
              required
            />
          </FormField>
          <FormField label="Phone Number" htmlFor="teacher-phone" required error={errors.phoneNumber}>
            <TextInput
              id="teacher-phone"
              size="lg"
              type="tel"
              name="phoneNumber"
              placeholder="+234 XXX XXX XXXX"
              value={form.phoneNumber}
              error={errors.phoneNumber}
              onValueChange={(value) => setField("phoneNumber", value)}
              required
            />
          </FormField>
          <FormField label="Date of Birth" htmlFor="teacher-dob" required error={errors.dateOfBirth}>
            <TextInput
              id="teacher-dob"
              size="lg"
              type="date"
              name="dateOfBirth"
              value={form.dateOfBirth}
              error={errors.dateOfBirth}
              onValueChange={(value) => setField("dateOfBirth", value)}
              required
            />
          </FormField>
          <FormField label="Gender" htmlFor="teacher-gender" required error={errors.gender}>
            <SelectInput
              id="teacher-gender"
              size="lg"
              name="gender"
              value={form.gender}
              error={errors.gender}
              onValueChange={(value) => setField("gender", value as TeacherFormState["gender"])}
              required
            >
              <option value="" disabled>
                Select gender
              </option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </SelectInput>
          </FormField>
        </div>
      </div>

      <InfoNotice title="Next: Academic Qualifications">
        We&apos;ll collect academic background and teaching experience information.
      </InfoNotice>
    </div>
  );
}
