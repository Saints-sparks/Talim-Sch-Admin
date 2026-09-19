"use client";

import { Input } from "@/components/ui/input";
import { WEEK_DAYS } from "@/hooks/users/useTeacherEditor";
import { CheckboxList, Labelled, SectionShell, inputClass, type TabProps, type ToggleList } from "./editShared";

/** Available days and hours. */
export function TeacherEditAvailabilityTab({
  draft,
  setField,
  toggleInList,
  onSubmit,
  isSaving,
  onDeactivate,
  isDeactivated,
}: TabProps & { toggleInList: ToggleList }) {
  return (
    <SectionShell
      title="Teacher Availability"
      onSubmit={onSubmit}
      isSaving={isSaving}
      onDeactivate={onDeactivate}
      isDeactivated={isDeactivated}
    >
      <div className="md:col-span-2">
        <CheckboxList
          legend="Available Days"
          emptyMessage=""
          items={WEEK_DAYS.map((day) => ({ id: day, label: day }))}
          selected={draft.availabilityDays}
          onToggle={(day) => toggleInList("availabilityDays", day)}
        />
      </div>
      <div className="md:col-span-2">
        <Labelled htmlFor="availableTime" label="Available Time (optional)">
          <Input
            id="availableTime"
            value={draft.availableTime}
            onChange={(e) => setField("availableTime", e.target.value)}
            placeholder="e.g. 08:00 AM - 03:00 PM"
            className={inputClass}
          />
        </Labelled>
      </div>
    </SectionShell>
  );
}
