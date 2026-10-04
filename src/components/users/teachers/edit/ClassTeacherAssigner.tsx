"use client";

import { useId, useMemo, useState } from "react";
import { toast } from "@/components/CustomToast";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { ConfirmDialog } from "@/components/finance/ModalShell";
import { assignTeacherMessage } from "@/components/classes/AssignTeacherPanel";
import { useAssignClassTeacher } from "@/hooks/classes/queries";
import { logger } from "@/lib/logger";
import { Permission } from "@/lib/permissions";
import {
  REGISTER_RULE,
  classTeacherDisplayName,
  classTeacherRef,
  type ClassWithTeacher,
} from "../classTeacher";

/** Props of {@link ClassTeacherAssigner}. */
export interface ClassTeacherAssignerProps {
  /** The teacher's user id (what the assign route takes). */
  teacherUserId: string;
  /** The teacher's profile id, to tell which classes are already theirs. */
  teacherProfileId: string;
  /** The teacher's name, for the copy. */
  teacherName: string;
  /** The school's classes, with their class teachers. */
  classes: readonly ClassWithTeacher[];
  /**
   * Class ids the teacher is the class teacher of (the profile's
   * `classTeacherOf`); the class list decides when it is absent.
   */
  classTeacherOf?: ReadonlySet<string>;
}

/**
 * The teacher editor's "Class teacher" block: which classes this teacher is
 * the class teacher of, and making them the class teacher of another. The
 * write is `PUT /classes/:id/assign-teacher`, which sets
 * `Class.classTeacherId`, the only source of class-teacher (register) access
 * since A6; ticking a class above only assigns the teacher to it.
 *
 * Changing a class teacher is a class change, so the control needs
 * `manage:classes`, as on the class's own page; it confirms first, naming the
 * class teacher being replaced.
 *
 * @param props - See {@link ClassTeacherAssignerProps}.
 * @returns The block.
 */
export function ClassTeacherAssigner({
  teacherUserId,
  teacherProfileId,
  teacherName,
  classes,
  classTeacherOf,
}: ClassTeacherAssignerProps) {
  const assign = useAssignClassTeacher();
  const [classId, setClassId] = useState("");
  const [confirming, setConfirming] = useState(false);
  const selectId = useId();

  const isMine = useMemo(
    () => (cls: ClassWithTeacher) =>
      classTeacherOf
        ? classTeacherOf.has(cls._id)
        : Boolean(teacherProfileId) && classTeacherRef(cls) === teacherProfileId,
    [classTeacherOf, teacherProfileId]
  );
  const mine = useMemo(() => classes.filter(isMine), [classes, isMine]);
  const others = useMemo(() => classes.filter((cls) => !isMine(cls)), [classes, isMine]);
  const chosen = others.find((cls) => cls._id === classId);
  const replacing = chosen
    ? classTeacherDisplayName(chosen) ||
      (classTeacherRef(chosen) ? "the current class teacher" : "")
    : "";

  const run = async () => {
    if (!chosen) return;
    try {
      const updated = await assign.mutateAsync({ classId: chosen._id, teacherUserId });
      if (!updated?.classTeacherId) {
        toast.warning("The change did not complete. Reload the class and check its class teacher.");
      } else {
        toast.success(`${teacherName || "The teacher"} is now ${chosen.name}'s class teacher.`);
        setClassId("");
      }
    } catch (error) {
      logger.error("teachers/class-teacher", "assign failed", error);
      toast.error(assignTeacherMessage(error));
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="md:col-span-2 space-y-3 rounded-lg border border-gray-200 dark:border-slate-600 p-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Class teacher</h3>
        <p className="text-xs text-gray-600 dark:text-slate-400 mt-0.5">{REGISTER_RULE}</p>
      </div>
      <p className="text-sm text-gray-800 dark:text-slate-200">
        {mine.length > 0
          ? `Class teacher of ${mine.map((cls) => cls.name).join(", ")}.`
          : "Not the class teacher of any class."}
      </p>

      <PermissionGate
        permission={Permission.MANAGE_CLASSES}
        fallback={
          <p className="text-xs text-gray-600 dark:text-slate-400">
            An admin with Manage Classes sets class teachers, here or on the class&apos;s page.
          </p>
        }
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label
              htmlFor={selectId}
              className="block text-xs font-medium text-gray-700 dark:text-slate-300"
            >
              Make class teacher of
            </label>
            <select
              id={selectId}
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
              className="min-w-[12rem] rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-slate-100"
            >
              <option value="">Choose a class</option>
              {others.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                  {classTeacherDisplayName(cls) ? ` (now ${classTeacherDisplayName(cls)})` : ""}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            disabled={!chosen || assign.isPending}
            onClick={() => setConfirming(true)}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-50"
          >
            Make class teacher
          </button>
        </div>
      </PermissionGate>

      {confirming && chosen && (
        <ConfirmDialog
          title={`Make ${teacherName || "this teacher"} ${chosen.name}'s class teacher?`}
          message={
            replacing
              ? `${teacherName || "This teacher"} will take ${chosen.name}'s register instead of ${replacing}, who loses class-teacher access to it.`
              : `${teacherName || "This teacher"} will be able to take ${chosen.name}'s register.`
          }
          confirmLabel="Make class teacher"
          busy={assign.isPending}
          onConfirm={() => void run()}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
