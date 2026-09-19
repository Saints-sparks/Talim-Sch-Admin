"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QUALIFICATIONS, type TeacherDraft } from "@/hooks/users/useTeacherEditor";
import { Labelled, SectionShell, inputClass, type TabProps } from "./editShared";

/** Highest qualification, years of experience and specialization. */
export function TeacherEditQualificationsTab({
  draft,
  setField,
  onSubmit,
  isSaving,
  onDeactivate,
  isDeactivated,
}: TabProps) {
  return (
    <SectionShell
      title="Qualifications & Experience"
      onSubmit={onSubmit}
      isSaving={isSaving}
      onDeactivate={onDeactivate}
      isDeactivated={isDeactivated}
    >
      <Labelled htmlFor="qualification" label="Highest Qualification">
        <Select
          value={draft.highestAcademicQualification}
          onValueChange={(value) =>
            setField("highestAcademicQualification", value as TeacherDraft["highestAcademicQualification"])
          }
        >
          <SelectTrigger id="qualification" className={inputClass}>
            <SelectValue placeholder="Select qualification" />
          </SelectTrigger>
          <SelectContent>
            {QUALIFICATIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Labelled>
      <Labelled htmlFor="experience" label="Years of Teaching Experience">
        <Input
          id="experience"
          type="number"
          min={0}
          max={50}
          value={draft.yearsOfExperience}
          onChange={(e) => setField("yearsOfExperience", e.target.value)}
          placeholder="Enter years"
          className={inputClass}
        />
      </Labelled>
      <div className="md:col-span-2">
        <Labelled htmlFor="specialization" label="Specialization / Subject Expertise">
          <Input
            id="specialization"
            value={draft.specialization}
            onChange={(e) => setField("specialization", e.target.value)}
            placeholder="e.g. Mathematics"
            className={inputClass}
          />
        </Labelled>
      </div>
    </SectionShell>
  );
}
