"use client";
import React, { useState, useEffect, useId } from "react";
import { useAuth } from "@/context/AuthContext";
import { useChatsContext } from "@/context/ChatsContext";
import { type ChatRoom } from "@/types/chat.types";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/CustomToast";
import { getClasses, getCoursesBySchool } from "@/app/services/subjects.service";
import { getErrorMessage } from "@/lib/apiError";
import { CreateGroupHeader, NextStepsCard, OptionSelect } from "./create-group/CreateGroupParts";
import { GroupTypePicker } from "./create-group/GroupTypePicker";
import {
  GROUP_TYPES,
  buildGroupPayload,
  classOptionLabel,
  courseOptionLabel,
  createdMessage,
  isGroupFormValid,
  namePlaceholder,
  type GroupKind,
} from "./create-group/createGroup";
import { fieldControl, fieldLabel, ghostButton, primaryButton } from "@/components/tl";
import { dialogOverlay, dialogPanel } from "./parts";

/** Props for {@link CreateGroupModal}. */
interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (room: ChatRoom) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Starts a group: step 1 picks the kind (parent, class, subject or custom),
 * step 2 names it (and picks the class or subject) and creates it. A class or
 * subject group that already exists is opened instead.
 *
 * @param props - See {@link CreateGroupModalProps}.
 * @param props.open - Whether it is shown.
 * @param props.onClose - Closes it.
 * @param props.onSuccess - Called with the room created or reused.
 * @returns The dialog, or null while closed.
 */
const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ open, onClose, onSuccess }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedKind, setSelectedKind] = useState<GroupKind | null>(null);
  const [groupName, setGroupName] = useState("");
  const [classId, setClassId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [classes, setClasses] = useState<{ _id: string; name: string; gradeLevel: string }[]>([]);
  const [courses, setCourses] = useState<{ _id: string; title: string; subjectName?: string }[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [schoolDetails, setSchoolDetails] = useState<{ id: string; name: string; logo?: string } | null>(null);

  const { user } = useAuth();
  const { createGroupChat } = useChatsContext();
  const titleId = useId();

  // Load school info when modal opens
  useEffect(() => {
    if (!open) return;
    if (user?.schoolId && user?.schoolName) {
      setSchoolDetails({ id: user.schoolId, name: user.schoolName, logo: user.schoolLogo });
    } else {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const u = JSON.parse(stored);
          if (u.schoolId && u.schoolName) {
            setSchoolDetails({ id: u.schoolId, name: u.schoolName, logo: u.schoolLogo });
          }
        }
      } catch {}
    }
  }, [open, user]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setStep(1);
      setSelectedKind(null);
      setGroupName("");
      setClassId("");
      setCourseId("");
    }
  }, [open]);

  // Fetch classes/courses when step 2 is reached and type requires them
  useEffect(() => {
    if (step !== 2 || !selectedKind) return;

    if (selectedKind === "class" && classes.length === 0) {
      setLoadingOptions(true);
      getClasses()
        .then(setClasses)
        .catch(() => toast.error("Failed to load classes"))
        .finally(() => setLoadingOptions(false));
    }

    if (selectedKind === "course" && courses.length === 0) {
      setLoadingOptions(true);
      getCoursesBySchool()
        .then(setCourses)
        .catch(() => toast.error("Failed to load subjects"))
        .finally(() => setLoadingOptions(false));
    }
  }, [step, selectedKind]);

  const handleSelectKind = (kind: GroupKind) => {
    setSelectedKind(kind);
    setStep(2);
  };

  const isFormValid = (): boolean =>
    isGroupFormValid({ kind: selectedKind, name: groupName, classId, courseId });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid() || !schoolDetails?.id) return;

    setSubmitting(true);
    try {
      const newGroup = await createGroupChat(
        buildGroupPayload({ kind: selectedKind, name: groupName, classId, courseId })
      );

      if (newGroup) {
        // An existing class / course group was opened instead of creating a duplicate.
        toast.success(createdMessage(selectedKind!, newGroup.reused));
        onClose();
        onSuccess?.(newGroup);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to create group"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const selected = GROUP_TYPES.find((g) => g.kind === selectedKind);

  return (
    <div className={`${dialogOverlay} z-50`}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className={`${dialogPanel} sm:max-w-md`}>
        <CreateGroupHeader
          step={step}
          title={selected?.label}
          subtitle={selected?.description}
          titleId={titleId}
          submitting={submitting}
          onBack={() => setStep(1)}
          onClose={onClose}
        />

        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Step 1 — Type picker */}
          {step === 1 && <GroupTypePicker onSelect={handleSelectKind} />}

          {/* Step 2 — Form */}
          {step === 2 && selected && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
              {/* Group name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`${titleId}-name`} className={fieldLabel}>
                  Group Name{" "}
                  <span aria-hidden className="text-tl-danger">
                    *
                  </span>
                </label>
                <input
                  id={`${titleId}-name`}
                  type="text"
                  className={fieldControl}
                  placeholder={namePlaceholder(selectedKind)}
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                  disabled={submitting}
                  autoFocus
                />
              </div>

              {selectedKind === "class" && (
                <OptionSelect
                  id={`${titleId}-class`}
                  label="Select Class"
                  loadingLabel="Loading classes..."
                  placeholder="-- Choose a class --"
                  loading={loadingOptions}
                  disabled={submitting}
                  value={classId}
                  onChange={setClassId}
                >
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {classOptionLabel(c)}
                    </option>
                  ))}
                </OptionSelect>
              )}

              {selectedKind === "course" && (
                <OptionSelect
                  id={`${titleId}-course`}
                  label="Select Subject / Course"
                  loadingLabel="Loading subjects..."
                  placeholder="-- Choose a subject --"
                  loading={loadingOptions}
                  disabled={submitting}
                  value={courseId}
                  onChange={setCourseId}
                >
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {courseOptionLabel(c)}
                    </option>
                  ))}
                </OptionSelect>
              )}

              {/* School display */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`${titleId}-school`} className={fieldLabel}>
                  School
                </label>
                <input
                  id={`${titleId}-school`}
                  className={cn(fieldControl, "bg-tl-subtle")}
                  value={schoolDetails?.name || "Loading…"}
                  disabled
                />
              </div>

              <NextStepsCard kind={selected.kind} color={selected.color} schoolName={schoolDetails?.name} />

              {/* Actions */}
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={`${ghostButton} flex-1`}
                  disabled={submitting}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className={`${primaryButton} flex-1`}
                  disabled={submitting || !isFormValid() || !schoolDetails?.id}
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                  {submitting ? "Creating…" : `Create ${selected.label}`}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
