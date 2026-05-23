"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, Search, X, Check, AlertCircle } from "lucide-react";
import {
  createEnrollment,
  listEnrollments,
  StudentEnrollment,
} from "@/app/services/transit.service";
import { getAcademicYears, getTerms, AcademicYearResponse, TermResponse } from "@/app/services/academic.service";
import { getClasses, studentService, Class, Student } from "@/app/services/student.service";
import { toast } from "@/components/CustomToast";
import { cn } from "@/lib/utils";
// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function resolveStr(v: string | { _id: string; name?: string } | undefined, fallback = "—"): string {
  if (!v) return fallback;
  if (typeof v === "string") return v;
  return v.name ?? v._id;
}

function resolveClassName(v: StudentEnrollment["classId"]): string {
  if (!v) return "—";
  if (typeof v === "string") return v;
  return v.name ?? v._id;
}

function resolveStudentName(s: StudentEnrollment["studentId"]): string {
  if (!s) return "—";
  if (typeof s === "string") return s;
  const u = (s as { _id: string; userId?: { firstName?: string; lastName?: string } }).userId;
  if (!u) return s._id;
  return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || s._id;
}

function resolveId(v: string | { _id: string }): string {
  if (typeof v === "string") return v;
  return v._id;
}

const SOURCE_COLORS: Record<string, string> = {
  manual: "bg-gray-100 text-gray-600",
  promotion: "bg-purple-100 text-purple-700",
  transfer: "bg-blue-100 text-blue-700",
};

const STATUS_TABS = [
  { label: "Active", value: "active" },
  { label: "All", value: "" },
  { label: "Promoted", value: "promoted" },
  { label: "Repeated", value: "repeated" },
  { label: "Transferred Out", value: "transferred_out" },
  { label: "Transferred In", value: "transferred_in" },
  { label: "Withdrawn", value: "withdrawn" },
  { label: "Year Ended", value: "year_ended" },
  { label: "Graduated", value: "graduated" },
];

// ─── Single Enroll Modal ──────────────────────────────────────────────────────

interface SingleEnrollModalProps {
  onClose: () => void;
  onSuccess: () => void;
  students: Student[];
  classes: Class[];
  academicYears: AcademicYearResponse[];
  terms: TermResponse[];
  prefilledStudentId?: string;
}

function SingleEnrollModal({ onClose, onSuccess, students, classes, academicYears, terms, prefilledStudentId }: SingleEnrollModalProps) {
  const [search, setSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState(prefilledStudentId ?? "");
  const [classId, setClassId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [termId, setTermId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredStudents = students.filter((s) => {
    if (!search) return true;
    const name = `${s.userId?.firstName ?? ""} ${s.userId?.lastName ?? ""}`.toLowerCase();
    const id = (s as unknown as { studentId?: string }).studentId?.toLowerCase() ?? "";
    const q = search.toLowerCase();
    return name.includes(q) || id.includes(q);
  });

  const selectedStudent = students.find((s) => s._id === selectedStudentId);

  async function handleSubmit() {
    if (!selectedStudentId || !classId || !academicYearId) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      await createEnrollment({ studentId: selectedStudentId, classId, academicYearId, termId: termId || undefined, source: "manual" });
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-[#030E18]">Enroll Student</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-[#929292]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Student search */}
          <div>
            <label className="block text-sm font-medium text-[#030E18] mb-1.5">Student <span className="text-red-500">*</span></label>
            {selectedStudent ? (
              <div className="flex items-center justify-between p-3 border border-[#003366] rounded-lg bg-[#003366]/5">
                <span className="text-sm font-medium text-[#030E18]">
                  {selectedStudent.userId?.firstName} {selectedStudent.userId?.lastName}
                </span>
                <button onClick={() => setSelectedStudentId("")} className="text-xs text-[#929292] hover:text-red-500 transition-colors">Change</button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#929292]" />
                  <input
                    type="text"
                    placeholder="Search by name or student ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#003366] transition-colors"
                  />
                </div>
                <div className="mt-2 max-h-44 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
                  {filteredStudents.slice(0, 20).map((s) => (
                    <button
                      key={s._id}
                      onClick={() => { setSelectedStudentId(s._id); setSearch(""); }}
                      className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm font-medium text-[#030E18]">{s.userId?.firstName} {s.userId?.lastName}</span>
                      <span className="text-xs text-[#929292] ml-2">{(s as unknown as { studentId?: string }).studentId ?? ""}</span>
                    </button>
                  ))}
                  {filteredStudents.length === 0 && (
                    <p className="text-sm text-[#929292] text-center py-4">No students found</p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Class */}
          <div>
            <label className="block text-sm font-medium text-[#030E18] mb-1.5">Class <span className="text-red-500">*</span></label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#003366] transition-colors bg-white"
            >
              <option value="">Select class...</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.name} {c.gradeLevel ? `(${c.gradeLevel})` : ""}</option>
              ))}
            </select>
          </div>

          {/* Academic Year */}
          <div>
            <label className="block text-sm font-medium text-[#030E18] mb-1.5">Academic Year <span className="text-red-500">*</span></label>
            <select
              value={academicYearId}
              onChange={(e) => setAcademicYearId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#003366] transition-colors bg-white"
            >
              <option value="">Select academic year...</option>
              {academicYears.map((y) => (
                <option key={y._id} value={y._id}>{y.year}</option>
              ))}
            </select>
          </div>

          {/* Term (optional) */}
          <div>
            <label className="block text-sm font-medium text-[#030E18] mb-1.5">Term <span className="text-[#929292] font-normal">(optional)</span></label>
            <select
              value={termId}
              onChange={(e) => setTermId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#003366] transition-colors bg-white"
            >
              <option value="">Select term...</option>
              {terms.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-[#4A5568] border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedStudentId || !classId || !academicYearId}
            className="px-4 py-2 text-sm font-medium text-white bg-[#003366] rounded-lg hover:bg-[#003366]/90 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Enrolling..." : "Enroll Student"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Bulk Enroll Modal ────────────────────────────────────────────────────────

interface BulkEnrollModalProps {
  onClose: () => void;
  onSuccess: () => void;
  students: Student[];
  classes: Class[];
  academicYears: AcademicYearResponse[];
  terms: TermResponse[];
}

type BulkStep = "select" | "preview" | "result";

interface BulkResult {
  success: number;
  skipped: number;
  errors: string[];
}

function BulkEnrollModal({ onClose, onSuccess, students, classes, academicYears, terms }: BulkEnrollModalProps) {
  const [step, setStep] = useState<BulkStep>("select");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [classId, setClassId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [termId, setTermId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);

  const filtered = students.filter((s) => {
    if (!search) return true;
    const name = `${s.userId?.firstName ?? ""} ${s.userId?.lastName ?? ""}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const selectedStudents = students.filter((s) => selectedIds.has(s._id));
  const selectedClass = classes.find((c) => c._id === classId);
  const selectedYear = academicYears.find((y) => y._id === academicYearId);

  function toggleStudent(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((s) => s._id)));
    }
  }

  function canPreview() {
    return selectedIds.size > 0 && classId && academicYearId;
  }

  async function handleSubmit() {
    setSubmitting(true);
    const res: BulkResult = { success: 0, skipped: 0, errors: [] };
    for (const studentId of Array.from(selectedIds)) {
      const student = students.find((s) => s._id === studentId);
      const name = student ? `${student.userId?.firstName} ${student.userId?.lastName}` : studentId;
      try {
        await createEnrollment({ studentId, classId, academicYearId, termId: termId || undefined, source: "manual" });
        res.success++;
      } catch (err: unknown) {
        const msg = (err as Error).message ?? "";
        if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("active")) {
          res.skipped++;
        } else {
          res.errors.push(`${name}: ${msg}`);
        }
      }
    }
    setResult(res);
    setStep("result");
    setSubmitting(false);
    if (res.success > 0) onSuccess();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-[#030E18]">Bulk Enroll Students</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-[#929292]" />
          </button>
        </div>

        {/* Step: Select */}
        {step === "select" && (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Class + Year + Term row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#030E18] mb-1">Class <span className="text-red-500">*</span></label>
                  <select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#003366] bg-white">
                    <option value="">Select...</option>
                    {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#030E18] mb-1">Academic Year <span className="text-red-500">*</span></label>
                  <select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#003366] bg-white">
                    <option value="">Select...</option>
                    {academicYears.map((y) => <option key={y._id} value={y._id}>{y.year}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#030E18] mb-1">Term</label>
                  <select value={termId} onChange={(e) => setTermId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#003366] bg-white">
                    <option value="">Optional</option>
                    {terms.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Student checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-[#030E18]">Students ({selectedIds.size} selected)</label>
                  <button onClick={toggleAll} className="text-xs text-[#003366] hover:underline">
                    {selectedIds.size === filtered.length && filtered.length > 0 ? "Deselect all" : "Select all"}
                  </button>
                </div>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#929292]" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#003366] transition-colors"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
                  {filtered.map((s) => (
                    <label key={s._id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(s._id)}
                        onChange={() => toggleStudent(s._id)}
                        className="w-4 h-4 rounded border-gray-300 text-[#003366] focus:ring-[#003366]"
                      />
                      <span className="text-sm text-[#030E18]">{s.userId?.firstName} {s.userId?.lastName}</span>
                      {s.classId && <span className="text-xs text-[#929292] ml-auto">{typeof s.classId === "string" ? s.classId : s.classId.name}</span>}
                    </label>
                  ))}
                  {filtered.length === 0 && <p className="text-sm text-[#929292] text-center py-4">No students found</p>}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-[#4A5568] border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button
                onClick={() => setStep("preview")}
                disabled={!canPreview()}
                className="px-4 py-2 text-sm font-medium text-white bg-[#003366] rounded-lg hover:bg-[#003366]/90 disabled:opacity-50 transition-colors"
              >
                Preview ({selectedIds.size})
              </button>
            </div>
          </>
        )}

        {/* Step: Preview */}
        {step === "preview" && (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <p className="text-sm text-[#929292] mb-3">
                Enrolling <strong className="text-[#030E18]">{selectedStudents.length} students</strong> into{" "}
                <strong className="text-[#030E18]">{selectedClass?.name}</strong> · {selectedYear?.year}
              </p>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium text-[#929292]">Student</th>
                      <th className="px-4 py-2.5 text-left font-medium text-[#929292]">Class</th>
                      <th className="px-4 py-2.5 text-left font-medium text-[#929292]">Year</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {selectedStudents.map((s) => (
                      <tr key={s._id}>
                        <td className="px-4 py-2.5 text-[#030E18]">{s.userId?.firstName} {s.userId?.lastName}</td>
                        <td className="px-4 py-2.5 text-[#4A5568]">{selectedClass?.name ?? "—"}</td>
                        <td className="px-4 py-2.5 text-[#4A5568]">{selectedYear?.year ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-between gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setStep("select")} className="px-4 py-2 text-sm font-medium text-[#4A5568] border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Back</button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-[#003366] rounded-lg hover:bg-[#003366]/90 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Enrolling..." : `Confirm & Enroll ${selectedIds.size}`}
              </button>
            </div>
          </>
        )}

        {/* Step: Result */}
        {step === "result" && result && (
          <>
            <div className="flex-1 px-6 py-6 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-xl">
                <Check className="w-5 h-5 text-green-600 shrink-0" />
                <p className="text-sm text-green-800 font-medium">
                  {result.success} enrolled, {result.skipped} skipped (already active)
                  {result.errors.length > 0 && `, ${result.errors.length} failed`}
                </p>
              </div>
              {result.errors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-medium text-red-700 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    Failed enrollments
                  </div>
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-red-600">{e}</p>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end px-6 py-4 border-t border-gray-100">
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-white bg-[#003366] rounded-lg hover:bg-[#003366]/90 transition-colors">Done</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EnrollmentsPage() {
  const router = useRouter();
  const [activeStatus, setActiveStatus] = useState("active");
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClassId, setFilterClassId] = useState("");
  const [filterYearId, setFilterYearId] = useState("");

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearResponse[]>([]);
  const [terms, setTerms] = useState<TermResponse[]>([]);

  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  const loadEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listEnrollments({
        status: activeStatus || undefined,
        classId: filterClassId || undefined,
        academicYearId: filterYearId || undefined,
      });
      setEnrollments(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load enrollments");
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  }, [activeStatus, filterClassId, filterYearId]);

  useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments]);

  useEffect(() => {
    Promise.all([
      studentService.getStudents(1, 500).then((r) => setStudents(r.data)),
      getClasses().then(setClasses),
      getAcademicYears().then(setAcademicYears),
      getTerms().then(setTerms),
    ]).catch(() => {});
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#030E18]">Enrollments</h1>
          <p className="text-sm text-[#929292] mt-1">Manage student enrollments across classes and academic years.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-[#003366] text-[#003366] rounded-lg text-sm font-medium hover:bg-[#003366]/5 transition-colors"
          >
            <Users className="w-4 h-4" />
            Bulk Enroll
          </button>
          <button
            onClick={() => setShowSingleModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg text-sm font-medium hover:bg-[#003366]/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Enroll Student
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={filterClassId}
          onChange={(e) => setFilterClassId(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#003366] bg-white"
        >
          <option value="">All Classes</option>
          {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select
          value={filterYearId}
          onChange={(e) => setFilterYearId(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#003366] bg-white"
        >
          <option value="">All Academic Years</option>
          {academicYears.map((y) => <option key={y._id} value={y._id}>{y.year}</option>)}
        </select>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-gray-100 pb-0">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveStatus(tab.value)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
              activeStatus === tab.value
                ? "border-[#003366] text-[#003366]"
                : "border-transparent text-[#929292] hover:text-[#030E18]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : enrollments.length === 0 ? (
        <div className="text-center py-16 text-[#929292]">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No enrollments found</p>
          <p className="text-sm mt-1">Try a different filter or enroll a student</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-[#929292]">Student</th>
                <th className="px-4 py-3 text-left font-medium text-[#929292]">Class</th>
                <th className="px-4 py-3 text-left font-medium text-[#929292]">Academic Year</th>
                <th className="px-4 py-3 text-left font-medium text-[#929292]">Term</th>
                <th className="px-4 py-3 text-left font-medium text-[#929292]">Source</th>
                <th className="px-4 py-3 text-left font-medium text-[#929292]">Start Date</th>
                <th className="px-4 py-3 text-left font-medium text-[#929292]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {enrollments.map((e) => (
                <tr
                  key={e._id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/transit/enrollments/${resolveId(e.studentId)}`)}
                >
                  <td className="px-4 py-3 font-medium text-[#030E18]">{resolveStudentName(e.studentId)}</td>
                  <td className="px-4 py-3 text-[#4A5568]">{resolveClassName(e.classId)}</td>
                  <td className="px-4 py-3 text-[#4A5568]">{resolveStr(e.academicYearId as string | { _id: string; name?: string })}</td>
                  <td className="px-4 py-3 text-[#4A5568]">{e.termId ? resolveStr(e.termId as string | { _id: string; name?: string }) : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", SOURCE_COLORS[e.source] ?? "bg-gray-100 text-gray-600")}>
                      {e.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#929292]">{fmtDate(e.startDate ?? e.createdAt)}</td>
                  <td className="px-4 py-3 text-[#003366] text-xs font-medium">View →</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showSingleModal && (
        <SingleEnrollModal
          onClose={() => setShowSingleModal(false)}
          onSuccess={() => { setShowSingleModal(false); loadEnrollments(); }}
          students={students}
          classes={classes}
          academicYears={academicYears}
          terms={terms}
        />
      )}

      {showBulkModal && (
        <BulkEnrollModal
          onClose={() => setShowBulkModal(false)}
          onSuccess={() => loadEnrollments()}
          students={students}
          classes={classes}
          academicYears={academicYears}
          terms={terms}
        />
      )}
    </div>
  );
}
