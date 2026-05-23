"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Download, Plus } from "lucide-react";
import {
  getStudentEnrollmentHistory,
  createEnrollment,
  StudentEnrollment,
} from "@/app/services/transit.service";
import { getAcademicYears, getTerms, AcademicYearResponse, TermResponse } from "@/app/services/academic.service";
import { getClasses, studentService, Class, Student } from "@/app/services/student.service";
import { toast } from "@/components/CustomToast";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function resolveStr(v: string | { _id: string; name?: string } | undefined): string {
  if (!v) return "—";
  if (typeof v === "string") return v;
  return v.name ?? v._id;
}

function resolveClassName(v: StudentEnrollment["classId"]): string {
  if (!v) return "—";
  if (typeof v === "string") return v;
  return v.name ?? v._id;
}

function resolveStudentName(s: StudentEnrollment["studentId"]): string {
  if (!s || typeof s === "string") return "";
  const u = (s as { _id: string; userId?: { firstName?: string; lastName?: string } }).userId;
  if (!u) return s._id;
  return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
}

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-500",
  transferred_out: "bg-blue-100 text-blue-700",
  graduated: "bg-purple-100 text-purple-700",
  year_ended: "bg-amber-100 text-amber-700",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  transferred_out: "Transferred Out",
  graduated: "Graduated",
  year_ended: "Year Ended",
};

const STATUS_BORDER: Record<string, string> = {
  active: "border-l-4 border-green-500",
  inactive: "border-l-4 border-gray-200",
  transferred_out: "border-l-4 border-blue-400",
  graduated: "border-l-4 border-purple-400",
  year_ended: "border-l-4 border-amber-400",
};

// ─── Single Enroll Modal (inline) ─────────────────────────────────────────────

interface EnrollModalProps {
  studentId: string;
  onClose: () => void;
  onSuccess: () => void;
  classes: Class[];
  academicYears: AcademicYearResponse[];
  terms: TermResponse[];
}

function EnrollModal({ studentId, onClose, onSuccess, classes, academicYears, terms }: EnrollModalProps) {
  const [classId, setClassId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [termId, setTermId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!classId || !academicYearId) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      await createEnrollment({ studentId, classId, academicYearId, termId: termId || undefined, source: "manual" });
      toast.success("Student enrolled successfully");
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as Error).message ?? "";
      if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("active")) {
        toast.error("Student already has an active enrollment");
      } else {
        toast.error(msg || "Failed to enroll student");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-[#030E18]">Enroll in New Class</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-[#929292]" />
          </button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#030E18] mb-1.5">Class <span className="text-red-500">*</span></label>
            <select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#003366] bg-white">
              <option value="">Select class...</option>
              {classes.map((c) => <option key={c._id} value={c._id}>{c.name} {c.gradeLevel ? `(${c.gradeLevel})` : ""}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#030E18] mb-1.5">Academic Year <span className="text-red-500">*</span></label>
            <select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#003366] bg-white">
              <option value="">Select academic year...</option>
              {academicYears.map((y) => <option key={y._id} value={y._id}>{y.year}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#030E18] mb-1.5">Term <span className="text-[#929292] font-normal">(optional)</span></label>
            <select value={termId} onChange={(e) => setTermId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#003366] bg-white">
              <option value="">Select term...</option>
              {terms.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-[#4A5568] border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !classId || !academicYearId}
            className="px-4 py-2 text-sm font-medium text-white bg-[#003366] rounded-lg hover:bg-[#003366]/90 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Enrolling..." : "Enroll"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentEnrollmentHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.studentId as string;

  const [history, setHistory] = useState<StudentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("");
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  const [classes, setClasses] = useState<Class[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearResponse[]>([]);
  const [terms, setTerms] = useState<TermResponse[]>([]);

  async function loadHistory() {
    setLoading(true);
    try {
      const data = await getStudentEnrollmentHistory(studentId);
      const list = Array.isArray(data) ? data : [];
      setHistory(list);
      // Try to extract student name from first record
      if (list.length > 0) {
        const name = resolveStudentName(list[0].studentId);
        if (name) setStudentName(name);
      }
    } catch {
      toast.error("Failed to load enrollment history");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
    Promise.all([
      getClasses().then(setClasses),
      getAcademicYears().then(setAcademicYears),
      getTerms().then(setTerms),
    ]).catch(() => {});
  }, [studentId]);

  // Try to get student name from directory if not yet set
  useEffect(() => {
    if (studentName) return;
    studentService.getStudentById(studentId)
      .then((s) => {
        if (s?.userId) {
          setStudentName(`${s.userId.firstName ?? ""} ${s.userId.lastName ?? ""}`.trim());
        }
      })
      .catch(() => {});
  }, [studentId, studentName]);

  const activeEnrollment = history.find((e) => e.status === "active");

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#4A5568]" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#030E18]">{studentName || "Student"}</h1>
              {activeEnrollment && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
              )}
            </div>
            <p className="text-sm text-[#929292]">Enrollment history</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEnrollModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg text-sm font-medium hover:bg-[#003366]/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Enroll in New Class
          </button>
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-16 text-[#929292]">
          <p className="font-medium">No enrollment history</p>
          <p className="text-sm mt-1">This student has not been enrolled in any class</p>
        </div>
      ) : (
        <div className="relative">
          {/* vertical line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />

          <div className="space-y-4">
            {history.map((e, idx) => (
              <div key={e._id} className="flex gap-4 relative">
                {/* dot */}
                <div className={cn(
                  "relative z-10 flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center",
                  e.status === "active" ? "border-green-500 bg-green-50" : "border-gray-200 bg-white"
                )}>
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    e.status === "active" ? "bg-green-500" : "bg-gray-300"
                  )} />
                </div>

                {/* card */}
                <div className={cn(
                  "flex-1 bg-white border border-gray-100 rounded-xl p-4 shadow-sm",
                  STATUS_BORDER[e.status] ?? "border-l-4 border-gray-100"
                )}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[#030E18]">{resolveClassName(e.classId)}</span>
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_BADGE[e.status] ?? "bg-gray-100 text-gray-600")}>
                          {STATUS_LABEL[e.status] ?? e.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{e.source}</span>
                      </div>
                      <p className="text-sm text-[#4A5568] mt-1">{resolveStr(e.academicYearId as string | { _id: string; name?: string })}</p>
                      {e.termId && (
                        <p className="text-xs text-[#929292]">{resolveStr(e.termId as string | { _id: string; name?: string })}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-[#929292]">{fmtDate(e.startDate ?? e.createdAt)}</p>
                      {e.endDate && (
                        <p className="text-xs text-[#929292]">— {fmtDate(e.endDate)}</p>
                      )}
                      {!e.endDate && e.status === "active" && (
                        <p className="text-xs text-green-600 font-medium">Present</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showEnrollModal && (
        <EnrollModal
          studentId={studentId}
          onClose={() => setShowEnrollModal(false)}
          onSuccess={() => { setShowEnrollModal(false); loadHistory(); }}
          classes={classes}
          academicYears={academicYears}
          terms={terms}
        />
      )}
    </div>
  );
}
