"use client";

import type { RosterClass } from "@/hooks/users/useRosterClasses";
import { CheckboxList, SectionShell, type TabProps, type ToggleList } from "./editShared";
import { classItems, courseItems, type AssignableCourse } from "./assignmentItems";

/** Classes and courses the teacher is assigned to, and the form-teacher flag. */
export function TeacherEditAssignmentsTab({
  draft,
  setField,
  toggleInList,
  classes,
  courses,
  onSubmit,
  isSaving,
  onDeactivate,
  isDeactivated,
}: TabProps & {
  toggleInList: ToggleList;
  classes: RosterClass[];
  courses: AssignableCourse[];
}) {
  return (
    <SectionShell
      title="Assign to Classes and Courses"
      onSubmit={onSubmit}
      isSaving={isSaving}
      onDeactivate={onDeactivate}
      isDeactivated={isDeactivated}
    >
      <CheckboxList
        legend="Classes"
        emptyMessage="No classes have been created yet."
        items={classItems(classes)}
        selected={draft.assignedClasses}
        onToggle={(id) => toggleInList("assignedClasses", id)}
      />
      <CheckboxList
        legend="Courses"
        emptyMessage="No courses have been created yet."
        items={courseItems(courses)}
        selected={draft.assignedCourses}
        onToggle={(id) => toggleInList("assignedCourses", id)}
      />

      <div className="md:col-span-2 space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
          <input
            type="checkbox"
            className="rounded border-gray-300"
            checked={draft.isFormTeacher}
            onChange={(e) => setField("isFormTeacher", e.target.checked)}
          />
          Make this teacher a Form Teacher
        </label>
        <p className="text-xs text-gray-500 dark:text-slate-400">
          Saving replaces the teacher&apos;s classes and courses with exactly what is ticked here.
        </p>
      </div>
    </SectionShell>
  );
}
