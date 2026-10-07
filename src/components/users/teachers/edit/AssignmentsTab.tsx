"use client";

import type { RosterClass } from "@/hooks/users/useRosterClasses";
import { fieldHint, focusRing } from "@/components/tl";
import { CheckboxList, SectionShell, type TabProps, type ToggleList } from "./editShared";
import { classItems, courseItems, type AssignableCourse } from "./assignmentItems";
import { ClassTeacherAssigner } from "./ClassTeacherAssigner";
import { ClassTeacherHint } from "../ClassTeacherHint";

/** Where the hint tells the admin to go. */
const SET_CLASS_TEACHER = "Make them its class teacher below, or on the class's page.";

/**
 * Classes and courses the teacher is assigned to, the class-teacher block and
 * the form-teacher label.
 *
 * Ticking a class assigns the teacher to it; since A6 that does not make them
 * its class teacher (only `Class.classTeacherId` does, set in the block
 * below), so ticked classes they are not the class teacher of get a hint.
 *
 * @param props - The tab props, the list toggler, the classes and courses, and who the teacher is.
 * @param props.draft - The editable profile.
 * @param props.setField - Field setter.
 * @param props.onSubmit - Saves the section.
 * @param props.isSaving - Whether it is saving.
 * @param props.onDeactivate - Deactivates the teacher.
 * @param props.isDeactivated - Whether the teacher is deactivated.
 * @param props.toggleInList - Ticks or unticks a class or course.
 * @param props.classes - The school's classes (with their class teachers).
 * @param props.courses - The school's courses.
 * @param props.classTeacherOf - Class ids this teacher is the class teacher of; omit while unknown.
 * @param props.teacherUserId - The teacher's user id, for the class-teacher block.
 * @param props.teacherProfileId - The teacher's profile id, for the class-teacher block.
 * @param props.teacherName - The teacher's name, for the copy.
 * @returns The tab.
 */
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
  classTeacherOf,
  teacherUserId,
  teacherProfileId,
  teacherName = "",
}: TabProps & {
  toggleInList: ToggleList;
  classes: RosterClass[];
  courses: AssignableCourse[];
  classTeacherOf?: ReadonlySet<string>;
  teacherUserId?: string;
  teacherProfileId?: string;
  teacherName?: string;
}) {
  const nameOf = new Map(classes.map((cls) => [cls._id, cls.name]));
  const ticked = draft.assignedClasses.map((id) => ({ id, name: nameOf.get(id) ?? "" }));

  return (
    <SectionShell
      title="Assign to Classes and Courses"
      onSubmit={onSubmit}
      isSaving={isSaving}
      onDeactivate={onDeactivate}
      isDeactivated={isDeactivated}
    >
      <div className="space-y-3">
        <CheckboxList
          legend="Classes"
          emptyMessage="No classes have been created yet."
          items={classItems(classes)}
          selected={draft.assignedClasses}
          onToggle={(id) => toggleInList("assignedClasses", id)}
        />
        {classTeacherOf && (
          <ClassTeacherHint
            assigned={ticked}
            classTeacherOf={classTeacherOf}
            action={SET_CLASS_TEACHER}
          />
        )}
      </div>
      <CheckboxList
        legend="Courses"
        emptyMessage="No courses have been created yet."
        items={courseItems(courses)}
        selected={draft.assignedCourses}
        onToggle={(id) => toggleInList("assignedCourses", id)}
      />

      {teacherUserId && teacherProfileId && (
        <ClassTeacherAssigner
          teacherUserId={teacherUserId}
          teacherProfileId={teacherProfileId}
          teacherName={teacherName}
          classes={classes}
          classTeacherOf={classTeacherOf}
        />
      )}

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-sm font-bold text-tl-ink">
          <input
            type="checkbox"
            className={`h-[18px] w-[18px] shrink-0 cursor-pointer accent-tl-brand-fill ${focusRing}`}
            checked={draft.isFormTeacher}
            onChange={(e) => setField("isFormTeacher", e.target.checked)}
            aria-describedby="form-teacher-label-hint"
          />
          Show as a Form Teacher (label only)
        </label>
        <p id="form-teacher-label-hint" className={fieldHint}>
          A label on the profile. It does not let the teacher take a register: make them a
          class&apos;s class teacher for that. Saving replaces the teacher&apos;s classes and
          courses with exactly what is ticked here.
        </p>
      </div>
    </SectionShell>
  );
}
