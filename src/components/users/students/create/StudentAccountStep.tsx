"use client";

import React from "react";
import { FormField } from "../../create/FormField";
import { TextInput } from "../../create/Controls";
import { InfoNotice } from "../../create/InfoNotice";
import type { StudentField, StudentFormErrors, StudentFormState } from "./studentForm";
import { StudentSectionHeading } from "./StudentSectionHeading";

/** Props every student wizard step takes. */
export interface StudentStepProps {
  /** The form's values. */
  form: StudentFormState;
  /** Inline errors by field. */
  errors: StudentFormErrors;
  /** Sets one field. */
  setField: <K extends StudentField>(field: K, value: StudentFormState[K]) => void;
}

/**
 * Step 1 of the add-student wizard: the login email and the student's name and
 * phone. The password is never collected — the API generates one.
 *
 * @param props - Form values, errors and the field setter.
 * @param props.form - The values.
 * @param props.errors - The errors.
 * @param props.setField - Field setter.
 * @returns The step.
 */
export function StudentAccountStep({ form, errors, setField }: StudentStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <StudentSectionHeading iconPath="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z">
          Login Credentials
        </StudentSectionHeading>
        <FormField label="Email Address" htmlFor="student-email" required compact error={errors.email}>
          <TextInput
            id="student-email"
            size="md"
            type="email"
            name="email"
            autoComplete="off"
            placeholder="student@example.com"
            value={form.email}
            error={errors.email}
            onValueChange={(value) => setField("email", value)}
            required
          />
        </FormField>
      </div>

      <div className="space-y-4">
        <StudentSectionHeading iconPath="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z">
          Personal Information
        </StudentSectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="First Name" htmlFor="student-first-name" required compact error={errors.firstName}>
            <TextInput
              id="student-first-name"
              size="md"
              type="text"
              name="firstName"
              placeholder="Enter first name"
              value={form.firstName}
              error={errors.firstName}
              onValueChange={(value) => setField("firstName", value)}
              required
            />
          </FormField>
          <FormField label="Last Name" htmlFor="student-last-name" required compact error={errors.lastName}>
            <TextInput
              id="student-last-name"
              size="md"
              type="text"
              name="lastName"
              placeholder="Enter last name"
              value={form.lastName}
              error={errors.lastName}
              onValueChange={(value) => setField("lastName", value)}
              required
            />
          </FormField>
        </div>
        <FormField label="Phone Number" htmlFor="student-phone" required compact error={errors.phoneNumber}>
          <TextInput
            id="student-phone"
            size="md"
            type="tel"
            name="phoneNumber"
            placeholder="+234 XXX XXX XXXX"
            value={form.phoneNumber}
            error={errors.phoneNumber}
            onValueChange={(value) => setField("phoneNumber", value)}
            required
          />
        </FormField>
      </div>

      <InfoNotice>
        A secure password will be automatically generated for the student&apos;s account. The
        login credentials will be sent to the provided email address.
      </InfoNotice>
    </div>
  );
}
