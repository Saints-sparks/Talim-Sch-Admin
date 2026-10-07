"use client";

import { Input } from "@/components/ui/input";
import { WEEK_DAYS } from "@/hooks/users/useTeacherEditor";
import { CheckboxList, Labelled, SectionShell, type TabProps, type ToggleList } from "./editShared";

/**
 * Available days and hours.
 *
 * @param props - The tab props.
 * @param props.draft - The editable profile.
 * @param props.setField - Field setter.
 * @param props.onSubmit - Saves the section.
 * @param props.isSaving - Whether it is saving.
 * @param props.onDeactivate - Deactivates the teacher.
 * @param props.isDeactivated - Whether the teacher is deactivated.
 * @param props.toggleInList - Ticks or unticks a day.
 * @returns The tab.
 */
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
          />
        </Labelled>
      </div>
    </SectionShell>
  );
}
