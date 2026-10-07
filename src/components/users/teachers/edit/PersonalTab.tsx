"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TEACHER_GENDERS, type TeacherDraft } from "@/hooks/users/useTeacherEditor";
import { Labelled, SectionShell, type TabProps } from "./editShared";

/**
 * Name, contact, date of birth and gender.
 *
 * @param props - The tab props.
 * @param props.draft - The editable profile.
 * @param props.setField - Field setter.
 * @param props.onSubmit - Saves the section.
 * @param props.isSaving - Whether it is saving.
 * @param props.onDeactivate - Deactivates the teacher.
 * @param props.isDeactivated - Whether the teacher is deactivated.
 * @returns The tab.
 */
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
        />
      </Labelled>
      <Labelled htmlFor="lastName" label="Last Name">
        <Input
          id="lastName"
          value={draft.lastName}
          onChange={(e) => setField("lastName", e.target.value)}
          placeholder="Enter last name"
        />
      </Labelled>
      <Labelled htmlFor="phoneNumber" label="Phone Number">
        <Input
          id="phoneNumber"
          value={draft.phoneNumber}
          onChange={(e) => setField("phoneNumber", e.target.value)}
          placeholder="e.g. +2348012345678"
        />
      </Labelled>
      <Labelled htmlFor="email" label="Email Address">
        <Input
          id="email"
          type="email"
          value={draft.email}
          onChange={(e) => setField("email", e.target.value)}
          placeholder="e.g. teacher@school.edu"
        />
      </Labelled>
      <Labelled htmlFor="dateOfBirth" label="Date of Birth">
        <Input
          id="dateOfBirth"
          type="date"
          value={draft.dateOfBirth}
          onChange={(e) => setField("dateOfBirth", e.target.value)}
        />
      </Labelled>
      <Labelled htmlFor="gender" label="Gender">
        <Select
          value={draft.gender}
          onValueChange={(value) => setField("gender", value as TeacherDraft["gender"])}
        >
          <SelectTrigger id="gender">
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
