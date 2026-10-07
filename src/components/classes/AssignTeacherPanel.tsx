"use client";

/**
 * The "Assign Teacher" tab on the class edit screen.
 *
 * Assigning a class teacher is an authorization change, not a label: the
 * server checks the teacher belongs to this school, then detaches the previous
 * class teacher — which is what grants grading and attendance access to the
 * class. So the panel names the teacher being replaced before the write, runs
 * it behind a confirmation, and reports the server's own `error.code` rather
 * than a generic failure.
 */
import React, { useMemo, useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "@/components/CustomToast";
import { SearchSelect, type SearchOption } from "@/components/curriculum/SearchSelect";
import { ConfirmDialog } from "@/components/curriculum/ConfirmDialog";
import { PermissionGate } from "@/components/auth/PermissionGate";
import {
  Avatar,
  Banner,
  CardHeader,
  card,
  eyebrow,
  primaryButton,
  rowButton,
  sectionTitle,
  tile,
} from "@/components/tl";
import { useClassMutations } from "@/hooks/classes/queries";
import { teacherUserId, type Teacher } from "@/app/services/teacher.service";
import {
  classTeacherEmail,
  classTeacherName,
  type ClassDetail,
} from "@/components/classes/class.model";
import { ApiError, getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import { Permission } from "@/lib/permissions";

/** Props for {@link AssignTeacherPanel}. */
interface AssignTeacherPanelProps {
  /** The class. */
  classData: ClassDetail;
  /** The school's teachers, for the picker. */
  teachers: Teacher[];
  /** True while the teacher list loads. */
  isLoadingTeachers: boolean;
  /** Why the teacher list failed, if it did. */
  teachersError: unknown;
  /** Loads the teacher list again. */
  onRetryTeachers: () => void;
  /** The class being changed; the mutation is keyed on it. */
  classId: string;
}

/**
 * A teacher's display name, tolerating accounts with no profile yet.
 *
 * @param teacher - The teacher.
 * @returns The name, the email, or "Unnamed teacher".
 */
function teacherLabel(teacher: Teacher): string {
  const name = `${teacher.firstName ?? ""} ${teacher.lastName ?? ""}`.trim();
  return name || teacher.email || "Unnamed teacher";
}

/**
 * Turns the assign-teacher failure into something the administrator can act on.
 *
 * @param error - The thrown value.
 * @returns The message to show.
 */
export function assignTeacherMessage(error: unknown): string {
  const code = error instanceof ApiError ? error.code : null;
  if (code === "NOT_FOUND")
    return "That teacher is not in this school, or the class no longer exists.";
  if (code === "FORBIDDEN") return "You don't have permission to assign teachers to this class.";
  if (code === "CONFLICT")
    return getErrorMessage(error, "That teacher is already assigned elsewhere.");
  if (code === "VALIDATION_FAILED")
    return getErrorMessage(error, "That teacher cannot be assigned to this class.");
  if (code === "NETWORK_OFFLINE" || code === "REQUEST_TIMEOUT")
    return "Network error. Please check your connection and try again.";
  return getErrorMessage(error, "Failed to assign teacher.");
}

/**
 * Renders the assign-teacher panel: the current class teacher, the picker,
 * the Assign button and the guidelines, in one card.
 *
 * @param props - See {@link AssignTeacherPanelProps}.
 * @param props.classData - The class.
 * @param props.teachers - The teachers to choose from.
 * @param props.isLoadingTeachers - Whether they are loading.
 * @param props.teachersError - Why they failed.
 * @param props.onRetryTeachers - Retries the list.
 * @param props.classId - The class id.
 * @returns The tab body.
 */
export function AssignTeacherPanel({
  classData,
  teachers,
  isLoadingTeachers,
  teachersError,
  onRetryTeachers,
  classId,
}: AssignTeacherPanelProps) {
  const { assignTeacher } = useClassMutations(classId);
  const [selectedId, setSelectedId] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  const currentTeacherName = classTeacherName(classData);
  const hasCurrentTeacher = currentTeacherName !== "No teacher assigned";

  const options: SearchOption[] = useMemo(
    () =>
      teachers.map((teacher) => ({
        // The API resolves the teacher profile from the *user* id, so that is
        // what the form stores and sends.
        id: teacherUserId(teacher),
        label: teacherLabel(teacher),
        hint: teacher.email ?? "",
      })),
    [teachers]
  );

  const selected = options.find((option) => option.id === selectedId) ?? null;

  const handleAssign = async () => {
    if (!selectedId) return;
    try {
      const updated = await assignTeacher.mutateAsync(selectedId);
      setIsConfirming(false);

      // The route answers 200 even when the write did not take; say so rather
      // than claiming a success the class page will contradict.
      if (!updated?.classTeacherId) {
        toast.warning(
          "The assignment did not complete. Please reload the page and check the class teacher."
        );
        return;
      }

      toast.success(`${selected?.label ?? "The teacher"} has been assigned as class teacher!`);
      setSelectedId("");
    } catch (error) {
      logger.error("classes", "Failed to assign class teacher", error);
      setIsConfirming(false);
      toast.error(assignTeacherMessage(error));
    }
  };

  return (
    <section className={card}>
      <CardHeader
        title="Assign Class Teacher"
        subtitle="The class teacher takes the morning register and sees the class's grades and attendance."
      />

      <div className="mt-[18px] flex flex-col gap-[18px]">
        {hasCurrentTeacher && (
          <div className="flex flex-col gap-3 rounded-2xl border border-tl-line-soft bg-tl-subtle p-4">
            <h3 className={eyebrow}>Current Class Teacher</h3>
            <div className="flex flex-wrap items-center gap-4">
              <Avatar id={currentTeacherName} name={currentTeacherName} size={56} />
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-[19px] font-extrabold tracking-[-0.3px] text-tl-ink">
                  {currentTeacherName}
                </h4>
                <p className="text-sm font-bold text-tl-brand">Primary Class Teacher</p>
                <p className="truncate text-sm text-tl-muted">{classTeacherEmail(classData)}</p>
              </div>
            </div>
          </div>
        )}

        <PermissionGate
          permission={Permission.MANAGE_CLASSES}
          fallback={
            <Banner tone="muted">Your role can view the class teacher but not change them.</Banner>
          }
        >
          <>
            <div className="flex flex-col gap-2">
              <SearchSelect
                id="assign-teacher"
                label="Search and Select Teacher"
                options={options}
                value={selectedId}
                onChange={setSelectedId}
                isLoading={isLoadingTeachers}
                loadingLabel="Loading teachers..."
                emptyLabel="No teachers available"
                placeholder="Search teachers by name or email..."
                disabled={assignTeacher.isPending}
              />
              {Boolean(teachersError) && (
                <Banner
                  tone="danger"
                  action={
                    <button type="button" onClick={onRetryTeachers} className={rowButton}>
                      Retry
                    </button>
                  }
                >
                  {getErrorMessage(teachersError, "Could not load the teacher list.")}
                </Banner>
              )}
            </div>

            <div className="flex justify-end border-t border-tl-line-soft pt-[18px]">
              <button
                type="button"
                onClick={() => setIsConfirming(true)}
                disabled={!selectedId || assignTeacher.isPending}
                className={primaryButton}
              >
                <UserPlus className="h-4 w-4" aria-hidden />
                Assign Teacher
              </button>
            </div>

            <div className={tile}>
              <h4 className={sectionTitle}>Teacher Assignment Guidelines</h4>
              <ul className="mt-3 flex flex-col gap-2 text-sm text-tl-body">
                {[
                  "Search teachers by name or email address.",
                  "A class has one class teacher: assigning a new one removes the previous teacher's access to this class.",
                  'Use "Save Changes" for the class details — it does not change the teacher.',
                ].map((line) => (
                  <li key={line} className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="tl-dot-info mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
                    />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </>
        </PermissionGate>
      </div>

      <ConfirmDialog
        isOpen={isConfirming}
        title="Assign class teacher"
        message={
          hasCurrentTeacher
            ? `Make ${selected?.label ?? "this teacher"} the class teacher of ${classData.name}? ${currentTeacherName} will lose access to this class.`
            : `Make ${selected?.label ?? "this teacher"} the class teacher of ${classData.name}?`
        }
        confirmLabel="Assign teacher"
        pendingLabel="Assigning..."
        isPending={assignTeacher.isPending}
        onConfirm={handleAssign}
        onCancel={() => setIsConfirming(false)}
      />
    </section>
  );
}
