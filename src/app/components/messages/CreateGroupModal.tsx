"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useChatsContext } from "@/context/ChatsContext";
import { type ChatRoom } from "@/types/chat.types";
import { Loader2 } from "lucide-react";
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
  submitButtonClass,
  COLOR_MAP,
  type GroupKind,
} from "./create-group/createGroup";

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (room: ChatRoom) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

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
  const colors = selected ? COLOR_MAP[selected.color] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200 relative overflow-hidden">
        <CreateGroupHeader
          step={step}
          title={selected?.label}
          subtitle={selected?.description}
          submitting={submitting}
          onBack={() => setStep(1)}
          onClose={onClose}
        />

        {/* Step 1 — Type picker */}
        {step === 1 && <GroupTypePicker onSelect={handleSelectKind} />}

        {/* Step 2 — Form */}
        {step === 2 && selected && colors && (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Group name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Group Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">School</label>
              <input
                className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                value={schoolDetails?.name || "Loading…"}
                disabled
              />
            </div>

            <NextStepsCard kind={selected.kind} color={selected.color} schoolName={schoolDetails?.name} />

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                disabled={submitting}
              >
                Back
              </button>
              <button
                type="submit"
                className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${submitButtonClass(selected.color)}`}
                disabled={submitting || !isFormValid() || !schoolDetails?.id}
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? "Creating…" : `Create ${selected.label}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateGroupModal;
