"use client";

import React from "react";
import { FormField } from "../../create/FormField";
import { TextInput } from "../../create/Controls";
import type { StudentField, StudentFormErrors, StudentFormState } from "./studentForm";
import { StudentSectionHeading } from "./StudentSectionHeading";

/** Props every student wizard step takes. */
export interface StudentStepProps {
  form: StudentFormState;
  errors: StudentFormErrors;
  setField: <K extends StudentField>(field: K, value: StudentFormState[K]) => void;
}

/**
 * Step 1 of the add-student wizard: the login email and the student's name and
 * phone. The password is never collected — the API generates one.
 *
 * @param props - Form values, errors and the field setter.
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

      <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-lg p-4">
        <div className="flex gap-3">
          <svg
            className="w-5 h-5 text-[#003366] dark:text-blue-300 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed">
            A secure password will be automatically generated for the student&apos;s account. The
            login credentials will be sent to the provided email address.
          </p>
        </div>
      </div>
    </div>
  );
}
