"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useChats } from "@/hooks/useChats";
import { ChatRoomType } from "@/types/chat.types";
import {
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  Loader2,
  X,
  ChevronLeft,
} from "lucide-react";
import { toast } from "react-toastify";
import { getClasses, getCoursesBySchool } from "@/app/services/subjects.service";

// ─── Types ────────────────────────────────────────────────────────────────────

type GroupKind = "parent" | "class" | "course" | "custom";

interface GroupTypeOption {
  kind: GroupKind;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  badge: string;
}

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// ─── Group type definitions ───────────────────────────────────────────────────

const GROUP_TYPES: GroupTypeOption[] = [
  {
    kind: "parent",
    label: "Parent Group",
    description: "All school parents are added automatically",
    icon: <Users className="w-5 h-5" />,
    color: "blue",
    badge: "Auto-populates",
  },
  {
    kind: "class",
    label: "Class Group",
    description: "All students in a class are added automatically",
    icon: <GraduationCap className="w-5 h-5" />,
    color: "green",
    badge: "Auto-populates",
  },
  {
    kind: "course",
    label: "Subject / Course Group",
    description: "All students enrolled in a subject are added automatically",
    icon: <BookOpen className="w-5 h-5" />,
    color: "purple",
    badge: "Auto-populates",
  },
  {
    kind: "custom",
    label: "Custom Group",
    description: "Start blank and add any members manually",
    icon: <Layers className="w-5 h-5" />,
    color: "orange",
    badge: "Manual",
  },
];

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  blue:   { bg: "bg-blue-50",   text: "text-blue-600",   border: "border-blue-500",   badge: "bg-blue-100 text-blue-700"   },
  green:  { bg: "bg-green-50",  text: "text-green-600",  border: "border-green-500",  badge: "bg-green-100 text-green-700"  },
  purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-500", badge: "bg-purple-100 text-purple-700" },
  orange: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-500", badge: "bg-orange-100 text-orange-700" },
};

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
  const { createGroupChat } = useChats();

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

  const isFormValid = (): boolean => {
    if (!groupName.trim()) return false;
    if (selectedKind === "class" && !classId) return false;
    if (selectedKind === "course" && !courseId) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid() || !schoolDetails?.id) return;

    setSubmitting(true);
    try {
      let chatRoomType: string;
      const payload: Record<string, any> = { name: groupName.trim() };

      switch (selectedKind) {
        case "parent":
          chatRoomType = ChatRoomType.ADMIN_PARENT_GROUP;
          break;
        case "class":
          chatRoomType = ChatRoomType.CLASS_GROUP;
          payload.classId = classId;
          break;
        case "course":
          chatRoomType = ChatRoomType.COURSE_GROUP;
          payload.courseId = courseId;
          break;
        case "custom":
        default:
          chatRoomType = ChatRoomType.CUSTOM_GROUP;
          break;
      }

      const newGroup = await createGroupChat({ ...payload, type: chatRoomType as any });

      if (newGroup) {
        const labels: Record<GroupKind, string> = {
          parent: "Parent group",
          class: "Class group",
          course: "Subject group",
          custom: "Group",
        };
        toast.success(`${labels[selectedKind!]} created successfully!`);
        onClose();
        onSuccess?.();
      }
    } catch (err: any) {
      const msg =
        Array.isArray(err?.response?.data?.message)
          ? err.response.data.message.join(", ")
          : err?.response?.data?.message || err?.message || "Failed to create group";
      toast.error(msg);
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors mr-1"
                disabled={submitting}
              >
                <ChevronLeft size={18} className="text-gray-500" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {step === 1 ? "Create Group" : `New ${selected?.label}`}
              </h2>
              <p className="text-xs text-gray-500">
                {step === 1
                  ? "Choose a group type"
                  : selected?.description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            disabled={submitting}
          >
            <X size={18} />
          </button>
        </div>

        {/* Step 1 — Type picker */}
        {step === 1 && (
            
          <div className="p-5 grid grid-cols-2 gap-3">
            {GROUP_TYPES.map((opt) => {
              const c = COLOR_MAP[opt.color];
              return (
                <button
                  key={opt.kind}
                  onClick={() => handleSelectKind(opt.kind)}
                  className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 border-gray-100 hover:border-gray-200 hover:${c.bg} transition-all text-left group`}
                >
                  <div className={`p-2 rounded-lg ${c.bg} ${c.text} group-hover:scale-105 transition-transform`}>
                    {opt.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">{opt.description}</p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${c.badge}`}>
                    {opt.badge}
                  </span>
                </button>
              );
            })}
          </div>
        )}

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
                placeholder={
                  selectedKind === "parent" ? "e.g., School Parents 2025" :
                  selectedKind === "class"  ? "e.g., Grade 5A Chat" :
                  selectedKind === "course" ? "e.g., Mathematics Group" :
                  "e.g., Staff Planning Team"
                }
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
                disabled={submitting}
                autoFocus
              />
            </div>

            {/* Class selector */}
            {selectedKind === "class" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Select Class <span className="text-red-500">*</span>
                </label>
                {loadingOptions ? (
                  <div className="flex items-center gap-2 py-2.5 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading classes...
                  </div>
                ) : (
                  <select
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    required
                    disabled={submitting}
                  >
                    <option value="">-- Choose a class --</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} {c.gradeLevel ? `(${c.gradeLevel})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Course selector */}
            {selectedKind === "course" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Select Subject / Course <span className="text-red-500">*</span>
                </label>
                {loadingOptions ? (
                  <div className="flex items-center gap-2 py-2.5 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading subjects...
                  </div>
                ) : (
                  <select
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    required
                    disabled={submitting}
                  >
                    <option value="">-- Choose a subject --</option>
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title}{c.subjectName ? ` — ${c.subjectName}` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
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

            {/* Info card */}
            <div className={`p-3 rounded-xl border ${colors.bg} border-opacity-50`}>
              <p className={`text-xs font-semibold ${colors.text} mb-1`}>What happens next:</p>
              <ul className={`text-xs ${colors.text} space-y-1 list-disc list-inside opacity-80`}>
                {selectedKind === "parent" && <>
                  <li>All parents in {schoolDetails?.name || "your school"} are auto-added</li>
                  <li>You are added as the group admin</li>
                  <li>New parents can be added later</li>
                </>}
                {selectedKind === "class" && <>
                  <li>All students in the selected class are auto-added</li>
                  <li>You are added as the group admin</li>
                  <li>More members can be added later</li>
                </>}
                {selectedKind === "course" && <>
                  <li>All students enrolled in the subject are auto-added</li>
                  <li>You are added as the group admin</li>
                  <li>More members can be added later</li>
                </>}
                {selectedKind === "custom" && <>
                  <li>Only you are added initially</li>
                  <li>Add any members manually from the group info panel</li>
                  <li>Full control over who can join</li>
                </>}
              </ul>
            </div>

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
                className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                  selected.color === "blue"   ? "bg-blue-600 hover:bg-blue-700" :
                  selected.color === "green"  ? "bg-green-600 hover:bg-green-700" :
                  selected.color === "purple" ? "bg-purple-600 hover:bg-purple-700" :
                  "bg-orange-500 hover:bg-orange-600"
                }`}
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
