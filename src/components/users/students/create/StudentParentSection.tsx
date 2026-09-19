"use client";

import React from "react";
import { FormField } from "../../create/FormField";
import { SelectInput, TextInput } from "../../create/Controls";
import { PARENT_RELATIONSHIPS, type StudentFormState } from "./studentForm";
import { StudentSectionHeading } from "./StudentSectionHeading";
import type { StudentStepProps } from "./StudentAccountStep";

/**
 * "Parent/Guardian Information" block. The API links the parent by email, or
 * creates the parent account when there is none.
 *
 * @param props - Form values, errors and the field setter.
 * @returns The block.
 */
export function StudentParentSection({ form, errors, setField }: StudentStepProps) {
  return (
    <div className="space-y-4">
      <StudentSectionHeading iconPath="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z">
        Parent/Guardian Information
      </StudentSectionHeading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="First Name" htmlFor="parent-first-name" required compact error={errors.parentFirstName}>
          <TextInput
            id="parent-first-name"
            size="md"
            type="text"
            name="parentFirstName"
            placeholder="Enter parent/guardian first name"
            value={form.parentFirstName}
            error={errors.parentFirstName}
            onValueChange={(value) => setField("parentFirstName", value)}
            required
          />
        </FormField>
        <FormField label="Last Name" htmlFor="parent-last-name" required compact error={errors.parentLastName}>
          <TextInput
            id="parent-last-name"
            size="md"
            type="text"
            name="parentLastName"
            placeholder="Enter parent/guardian last name"
            value={form.parentLastName}
            error={errors.parentLastName}
            onValueChange={(value) => setField("parentLastName", value)}
            required
          />
        </FormField>
        <FormField label="Relationship" htmlFor="parent-relationship" required compact error={errors.relationship}>
          <SelectInput
            id="parent-relationship"
            size="md"
            name="relationship"
            value={form.relationship}
            error={errors.relationship}
            onValueChange={(value) => setField("relationship", value as StudentFormState["relationship"])}
            required
          >
            <option value="" disabled>
              Select relationship
            </option>
            {PARENT_RELATIONSHIPS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </FormField>
        <FormField label="Phone Number" htmlFor="parent-phone" required compact error={errors.parentPhone}>
          <TextInput
            id="parent-phone"
            size="md"
            type="tel"
            name="parentPhone"
            placeholder="+234 XXX XXX XXXX"
            value={form.parentPhone}
            error={errors.parentPhone}
            onValueChange={(value) => setField("parentPhone", value)}
            required
          />
        </FormField>
        <FormField
          label="Email Address"
          htmlFor="parent-email"
          required
          compact
          error={errors.parentEmail}
          className="md:col-span-2"
        >
          <TextInput
            id="parent-email"
            size="md"
            type="email"
            name="parentEmail"
            autoComplete="off"
            placeholder="parent@example.com"
            value={form.parentEmail}
            error={errors.parentEmail}
            onValueChange={(value) => setField("parentEmail", value)}
            required
          />
        </FormField>
      </div>
    </div>
  );
}
