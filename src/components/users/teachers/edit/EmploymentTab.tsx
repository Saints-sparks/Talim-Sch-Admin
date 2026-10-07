"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EMPLOYMENT_ROLES, EMPLOYMENT_TYPES, type TeacherDraft } from "@/hooks/users/useTeacherEditor";
import { Labelled, SectionShell, type TabProps } from "./editShared";

/**
 * Employment type and role.
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
          <SelectTrigger id="employmentType">
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
          <SelectTrigger id="employmentRole">
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
