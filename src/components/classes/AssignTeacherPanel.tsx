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
import { AlertCircle, User } from "lucide-react";
import { toast } from "@/components/CustomToast";
import { SearchSelect, type SearchOption } from "@/components/curriculum/SearchSelect";
import { ConfirmDialog } from "@/components/curriculum/ConfirmDialog";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { useClassMutations } from "@/hooks/classes/queries";
import { teacherUserId, type Teacher } from "@/app/services/teacher.service";
import { classTeacherEmail, classTeacherName, type ClassDetail } from "@/components/classes/class.model";
import { ApiError, getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import { Permission } from "@/lib/permissions";

interface AssignTeacherPanelProps {
  classData: ClassDetail;
  teachers: Teacher[];
  isLoadingTeachers: boolean;
  teachersError: unknown;
  onRetryTeachers: () => void;
  /** The class being changed; the mutation is keyed on it. */
  classId: string;
}

/** A teacher's display name, tolerating accounts with no profile yet. */
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
 * Renders the assign-teacher panel.
 *
 * @param props - See {@link AssignTeacherPanelProps}.
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
    [teachers],
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
          "The assignment did not complete. Please reload the page and check the class teacher.",
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
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center">
          <div className="p-2 bg-[#003366]/10 dark:bg-blue-950/40 rounded-lg mr-3">
            <User className="w-5 h-5 text-[#003366] dark:text-blue-300" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
            Assign Class Teacher
          </h2>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {hasCurrentTeacher && (
          <div className="bg-[#003366]/5 dark:bg-slate-800 border border-[#003366]/20 dark:border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-medium text-[#003366] dark:text-blue-300 mb-4">
              Current Class Teacher
            </h3>
            <div className="flex items-center gap-6">
              <div className="p-4 bg-[#003366]/10 dark:bg-blue-950/40 rounded-full flex-shrink-0">
                <User className="w-12 h-12 text-[#003366] dark:text-blue-300" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xl font-bold text-[#003366] dark:text-blue-200 mb-1 truncate">
                  {currentTeacherName}
                </h4>
                <p className="text-[#003366]/80 dark:text-blue-300/80 font-medium mb-2">
                  Primary Class Teacher
                </p>
                <p className="text-gray-600 dark:text-slate-400 truncate">
                  {classTeacherEmail(classData)}
                </p>
              </div>
            </div>
          </div>
        )}

        <PermissionGate
          permission={Permission.MANAGE_CLASSES}
          fallback={
            <div className="flex items-start gap-2 p-4 rounded-xl bg-gray-50 dark:bg-slate-800 text-sm text-gray-600 dark:text-slate-300">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              Your role can view the class teacher but not change them.
            </div>
          }
        >
          <>
            <div>
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
                <div className="flex items-start gap-2 mt-2 p-3 bg-red-50 dark:bg-red-950/30 rounded-xl">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-700 dark:text-red-300">
                    {getErrorMessage(teachersError, "Could not load the teacher list.")}{" "}
                    <button type="button" onClick={onRetryTeachers} className="underline">
                      Retry
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsConfirming(true)}
                disabled={!selectedId || assignTeacher.isPending}
                className="flex items-center px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] disabled:bg-gray-400 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors"
              >
                <User className="w-4 h-4 mr-2" />
                Assign Teacher
              </button>
            </div>

            <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-6">
              <h4 className="font-medium text-gray-900 dark:text-slate-100 mb-3">
                Teacher Assignment Guidelines
              </h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-slate-300">
                {[
                  "Search teachers by name or email address.",
                  "A class has one class teacher: assigning a new one removes the previous teacher's access to this class.",
                  'Use "Save Changes" for the class details — it does not change the teacher.',
                ].map((line) => (
                  <li key={line} className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-1.5 flex-shrink-0" />
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
    </div>
  );
}
