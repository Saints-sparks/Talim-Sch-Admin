"use client";

import React from "react";
import { Badge, BookOpen, Calendar as CalendarIcon, Clock, User, Users } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { TeacherById, TeacherClass } from "@/app/services/teacher.service";
import {
  AccentField,
  ProfileCircle,
  ProfileHeading,
  tabGridClass,
} from "./teacherProfileAtoms";
import { ClassTeacherHint } from "./ClassTeacherHint";

type ClassRow = TeacherClass;

/** How the teacher stands in a class (A6: class teacher only from `Class.classTeacherId`). */
type ClassRole = "Class Teacher" | "Assigned";

/**
 * One class the teacher is assigned to, with their role in it.
 *
 * @param props - The class and the teacher's role in it.
 * @param props.cls - The class.
 * @param props.role - "Class Teacher" or "Assigned".
 * @returns The card.
 */
function ClassCard({ cls, role }: { cls: ClassRow; role: ClassRole }) {
  const isForm = role === "Class Teacher";
  const card = isForm
    ? "from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-900/20 dark:to-emerald-900/30 dark:border-emerald-900/40"
    : "from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/20 dark:to-blue-900/30 dark:border-blue-900/40";
  const text = isForm ? "text-emerald-900 dark:text-emerald-200" : "text-blue-900 dark:text-blue-200";
  const soft = isForm ? "text-emerald-700 dark:text-emerald-300" : "text-blue-700 dark:text-blue-300";
  const pill = isForm
    ? "bg-emerald-200 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200"
    : "bg-blue-200 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200";
  const Icon = isForm ? Badge : Users;

  return (
    <div className={`bg-gradient-to-r border rounded-lg p-4 hover:shadow-md transition-all ${card}`}>
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Icon className={`w-4 h-4 ${soft}`} />
            <span className={`font-semibold ${text}`}>{cls.name}</span>
          </div>
          <div className="space-y-1">
            <div className={`flex items-center gap-2 text-sm ${soft}`}>
              <User className="w-3 h-3" />
              <span>Capacity: {cls.classCapacity ?? "—"} students</span>
            </div>
            {cls.classDescription && <p className={`text-sm ${soft}`}>{cls.classDescription}</p>}
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${pill}`}>{role}</span>
      </div>
    </div>
  );
}

function EmptyBox({
  icon: Icon,
  message,
}: {
  icon: React.ComponentType<{ className?: string }>;
  message: string;
}) {
  return (
    <div className="bg-gray-50 dark:bg-slate-700/40 border border-gray-200 dark:border-slate-600 rounded-lg p-6 text-center">
      <Icon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
      <span className="text-gray-500 dark:text-slate-400 italic">{message}</span>
    </div>
  );
}

/**
 * The classes the teacher is assigned to, which of them they are the class
 * teacher of, and their courses.
 *
 * Since A6 class-teacher (register) access comes only from
 * `Class.classTeacherId`, which the profile's `classTeacherOf` reports. The
 * older `classTeacherClasses` merges in the assigned classes, so it cannot say
 * who the class teacher is. Classes the teacher is
 * assigned to without being their class teacher get a hint.
 *
 * @param props - The teacher and the classes they are the class teacher of.
 * @param props.teacher - The teacher's profile.
 * @param props.classTeacherOf - Class ids from `Class.classTeacherId`; omit while unknown.
 * @returns The tab.
 */
export function TeacherAssignmentsTab({
  teacher,
  classTeacherOf,
}: {
  teacher: TeacherById;
  classTeacherOf?: ReadonlySet<string>;
}) {
  const courses = teacher.assignedCourses ?? [];
  // One card per class, whichever list(s) it came in.
  const classes = [
    ...new Map(
      [...(teacher.assignedClasses ?? []), ...(teacher.classTeacherClasses ?? [])].map((cls) => [cls._id, cls]),
    ).values(),
  ];
  const noClasses = classes.length === 0;
  const roleIn = (classId: string): ClassRole => (classTeacherOf?.has(classId) ? "Class Teacher" : "Assigned");
  const classTeacherNames = classes.filter((cls) => classTeacherOf?.has(cls._id)).map((cls) => cls.name);

  /**
   * The class name for a course, falling back to its id. `GET /teachers/:userId`
   * populates a course's `classId` (`{ _id, name, ... }`); other answers send
   * the bare id.
   *
   * @param classId - The course's `classId`, populated or not.
   * @returns The class's name, else its id.
   */
  const classNameFor = (classId: string | Record<string, unknown> | undefined) => {
    if (classId && typeof classId === "object") {
      const id = String(classId._id ?? "");
      const populatedName = typeof classId.name === "string" ? classId.name : "";
      return populatedName || classes.find((cls) => cls._id === id)?.name || id;
    }
    return classes.find((cls) => cls._id === classId)?.name ?? classId;
  };

  return (
    <div className="space-y-8">
      <ProfileHeading icon={BookOpen} title="Class and Subject Assignments" tone="indigo" />

      <div className={tabGridClass}>
        <ProfileCircle icon={BookOpen} tone="indigo" label="Teaching Overview">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Class Teacher Status
            </Label>
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg px-4 py-3 shadow-sm">
              <span
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                  classTeacherNames.length > 0
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                <Badge className="w-3 h-3" aria-hidden />
                {classTeacherOf === undefined
                  ? "Not reported"
                  : classTeacherNames.length > 0
                    ? `Class teacher of ${classTeacherNames.join(", ")}`
                    : "Not a class teacher"}
              </span>
              {teacher.isFormTeacher && (
                <p className="mt-2 text-xs text-gray-600 dark:text-slate-400">Labelled as a form teacher.</p>
              )}
            </div>
          </div>
        </ProfileCircle>

        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Assigned Classes</h3>
              </div>
              <div className="space-y-3">
                {classes.map((cls) => (
                  <ClassCard key={cls._id} cls={cls} role={roleIn(cls._id)} />
                ))}
                {noClasses && <EmptyBox icon={Users} message="No classes assigned" />}
                {classTeacherOf && (
                  <ClassTeacherHint
                    assigned={classes.map((cls) => ({ id: cls._id, name: cls.name }))}
                    classTeacherOf={classTeacherOf}
                    action="Set the class teacher on the class's page or in Edit Profile."
                  />
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Assigned Courses</h3>
              </div>
              <div className="space-y-3">
                {courses.length > 0 ? (
                  courses.map((course) => (
                    <div
                      key={course._id}
                      className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 dark:from-purple-900/20 dark:to-purple-900/30 dark:border-purple-900/40 rounded-lg p-4 hover:shadow-md transition-all space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="font-semibold text-purple-900 dark:text-purple-200">
                          {course.title}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Badge className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                          <span className="text-purple-700 dark:text-purple-300 font-medium">
                            Code: {course.courseCode}
                          </span>
                        </div>
                        {course.description && (
                          <p className="text-sm text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 rounded px-2 py-1">
                            {course.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                          <span className="text-purple-700 dark:text-purple-300">
                            Class: {classNameFor(course.classId)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyBox icon={BookOpen} message="No courses assigned" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The days and hours the teacher is available. */
export function TeacherAvailabilityTab({ teacher }: { teacher: TeacherById }) {
  const days = teacher.availabilityDays ?? [];

  return (
    <div className="space-y-8">
      <ProfileHeading icon={Clock} title="Teacher Availability" tone="teal" />

      <div className={tabGridClass}>
        <ProfileCircle icon={Clock} tone="teal" label="Schedule Overview">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Work Schedule</h3>
            <div className="flex items-center justify-center gap-1">
              <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-sm text-gray-600 dark:text-slate-400">Teaching Hours</span>
            </div>
          </div>
        </ProfileCircle>

        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
              <CalendarIcon className="w-4 h-4" />
              Available Days
            </Label>
            <div className="bg-gradient-to-r from-teal-50 to-teal-100 border border-teal-200 dark:from-teal-900/20 dark:to-teal-900/30 dark:border-teal-900/40 rounded-lg p-6">
              {days.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {days.map((day) => (
                    <span
                      key={day}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-teal-200 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200 rounded-full text-sm font-medium"
                    >
                      <CalendarIcon className="w-3 h-3" />
                      {day}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <CalendarIcon className="w-8 h-8 text-teal-400 mx-auto mb-2" />
                  <span className="text-teal-600 dark:text-teal-300 italic">No specific days specified</span>
                </div>
              )}
            </div>
          </div>

          {teacher.availableTime ? (
            <AccentField
              icon={Clock}
              label="Available Time"
              tone="blue"
              value={<span className="text-lg">{teacher.availableTime}</span>}
              caption="Working hours"
            />
          ) : (
            <div className="space-y-4">
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                <Clock className="w-4 h-4" />
                Available Time
              </Label>
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 dark:from-blue-900/20 dark:to-blue-900/30 dark:border-blue-900/40 rounded-lg p-6 text-center py-4">
                <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <span className="text-blue-600 dark:text-blue-300 italic">No specific time specified</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
