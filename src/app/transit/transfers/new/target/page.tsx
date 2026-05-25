"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/CustomToast";
import {
  createTransfer,
  getStudentSnapshot,
  StudentSnapshot,
} from "@/app/services/transit.service";
import { apiClient } from "@/lib/apiClient";
import {
  dedupeAcademicYearsByName,
  getAcademicYearLabel,
} from "@/app/services/academic.service";

interface SchoolResult {
  _id: string;
  name: string;
  address?: string;
}

interface RawStudentResult {
  _id: string;
  userId?: { firstName?: string; lastName?: string };
  firstName?: string;
  lastName?: string;
  gradeLevel?: string;
}

interface StudentResult {
  _id: string;
  firstName: string;
  lastName: string;
  gradeLevel?: string;
}

function flattenStudent(s: RawStudentResult): StudentResult {
  return {
    _id: s._id,
    firstName: s.userId?.firstName ?? s.firstName ?? "",
    lastName: s.userId?.lastName ?? s.lastName ?? "",
    gradeLevel: s.gradeLevel,
  };
}

interface ClassItem {
  _id: string;
  name: string;
  gradeLevel: string;
}

interface AcademicYear {
  _id: string;
  name?: string;
  year?: string;
  isCurrent?: boolean;
}

const STEPS = [
  "Find Source School",
  "Find Student",
  "Select Your Class & Year",
  "Review",
  "Confirm",
];

function StepHeader({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 flex-1">
          <div
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
              i < step
                ? "bg-[#003366] text-white"
                : i === step
                ? "bg-[#003366] text-white ring-2 ring-[#003366]/30"
                : "bg-gray-100 text-[#929292]"
            )}
          >
            {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div
              className={cn("h-0.5 flex-1 transition-colors", i < step ? "bg-[#003366]" : "bg-gray-100")}
            />
          )}
        </div>
      ))}
    </div>
  );
}

async function handleRes<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Request failed");
  return data as T;
}

function academicYearArray(data: AcademicYear[] | { academicYears?: AcademicYear[]; data?: AcademicYear[] }): AcademicYear[] {
  if (Array.isArray(data)) return data;
  return data.academicYears ?? data.data ?? [];
}

export default function TargetTransferWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 0 — find source school
  const [schoolSearch, setSchoolSearch] = useState("");
  const [schools, setSchools] = useState<SchoolResult[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [selectedSourceSchool, setSelectedSourceSchool] = useState<SchoolResult | null>(null);

  // Step 1 — find student in that school
  const [studentSearch, setStudentSearch] = useState("");
  const [allStudents, setAllStudents] = useState<StudentResult[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null);
  const [snapshot, setSnapshot] = useState<StudentSnapshot | null>(null);

  // Step 2 — your own class & year
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [reason, setReason] = useState("");

  // Search schools
  useEffect(() => {
    if (!schoolSearch || schoolSearch.length < 2) {
      setSchools([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoadingSchools(true);
      try {
        const res = await apiClient.get(`/schools/search?query=${encodeURIComponent(schoolSearch)}`);
        const data = await handleRes<SchoolResult[]>(res);
        setSchools(Array.isArray(data) ? data : []);
      } catch {
        setSchools([]);
      } finally {
        setLoadingSchools(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [schoolSearch]);

  // Load students for the selected source school
  useEffect(() => {
    if (!selectedSourceSchool) {
      setAllStudents([]);
      return;
    }
    setLoadingStudents(true);
    apiClient
      .get(`/students/by-school?page=1&limit=500`)
      .then((r) => handleRes<{ data: RawStudentResult[] } | RawStudentResult[]>(r))
      .then((data) => {
        const raw = Array.isArray(data) ? data : (data as { data: RawStudentResult[] }).data ?? [];
        setAllStudents(raw.map(flattenStudent));
      })
      .catch(() => setAllStudents([]))
      .finally(() => setLoadingStudents(false));
  }, [selectedSourceSchool]);

  // Fetch snapshot when student selected
  useEffect(() => {
    if (!selectedStudent) return;
    getStudentSnapshot(selectedStudent._id).then(setSnapshot).catch(() => setSnapshot(null));
  }, [selectedStudent]);

  // Load your own school classes & years
  useEffect(() => {
    if (step !== 2) return;
    Promise.all([
      apiClient.get("/classes").then((r) => handleRes<ClassItem[]>(r)),
      apiClient
        .get("/academic-year-term/academic-year/school")
        .then((r) => handleRes<AcademicYear[] | { academicYears?: AcademicYear[]; data?: AcademicYear[] }>(r)),
    ])
      .then(([cls, yrs]) => {
        setClasses(Array.isArray(cls) ? cls : []);
        setAcademicYears(dedupeAcademicYearsByName(academicYearArray(yrs)));
      })
      .catch(() => {});
  }, [step]);

  async function submit() {
    if (!selectedStudent || !selectedClass || !selectedYear) return;
    setSubmitting(true);
    try {
      await createTransfer({
        studentId: selectedStudent._id,
        targetClassId: selectedClass._id,
        targetAcademicYearId: selectedYear._id,
        reason: reason || undefined,
        initiatedBy: "target",
      });
      toast.success("Pull transfer request submitted successfully");
      router.push("/transit/transfers");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to submit transfer request");
    } finally {
      setSubmitting(false);
    }
  }

  const canNext = [
    !!selectedSourceSchool,
    !!selectedStudent,
    !!(selectedClass && selectedYear),
    true,
  ][step];

  return (
    <div className="p-6">
      <button
        onClick={() => (step === 0 ? router.back() : setStep(step - 1))}
        className="flex items-center gap-2 text-sm text-[#929292] hover:text-[#030E18] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {step === 0 ? "Back" : "Previous Step"}
      </button>

      <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[#030E18] mb-1">Pull Transfer</h1>
      <p className="text-sm text-[#929292] mb-6">
        Request a student from another Talim school to join your school
      </p>

      <StepHeader step={step} total={STEPS.length} />

      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-[#030E18] mb-4">{STEPS[step]}</h2>

        {/* Step 0: Source School */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#929292]" />
              <input
                type="text"
                placeholder="Search for the student's current school..."
                value={schoolSearch}
                onChange={(e) => setSchoolSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#003366] transition-colors"
              />
            </div>

            {loadingSchools && (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />
                ))}
              </div>
            )}

            {!loadingSchools && schools.length > 0 && (
              <div className="divide-y divide-gray-50 border border-gray-100 rounded-lg overflow-hidden">
                {schools.map((s) => (
                  <button
                    key={s._id}
                    onClick={() => setSelectedSourceSchool(s)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors",
                      selectedSourceSchool?._id === s._id && "bg-[#003366]/5"
                    )}
                  >
                    <div>
                      <p className="text-sm font-medium text-[#030E18]">{s.name}</p>
                      {s.address && <p className="text-xs text-[#929292]">{s.address}</p>}
                    </div>
                    {selectedSourceSchool?._id === s._id && (
                      <Check className="w-4 h-4 text-[#003366] ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {selectedSourceSchool && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-100 text-sm text-green-700">
                Selected: <span className="font-semibold">{selectedSourceSchool.name}</span>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Find Student */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-[#929292]">
              Searching students at{" "}
              <span className="font-medium text-[#030E18]">{selectedSourceSchool?.name}</span>
            </p>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#929292]" />
              <input
                type="text"
                placeholder="Search by name or student ID..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#003366] transition-colors"
              />
            </div>

            {loadingStudents && (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />
                ))}
              </div>
            )}

            {!loadingStudents && (() => {
              const q = studentSearch.toLowerCase();
              const filtered = allStudents.filter(
                (s) =>
                  !q ||
                  `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
                  s.gradeLevel?.toLowerCase().includes(q)
              );
              return filtered.length > 0 ? (
                <div className="divide-y divide-gray-50 border border-gray-100 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  {filtered.map((s) => (
                    <button
                      key={s._id}
                      onClick={() => setSelectedStudent(s)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors",
                        selectedStudent?._id === s._id && "bg-[#003366]/5"
                      )}
                    >
                      <div className="w-8 h-8 bg-[#003366]/10 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-[#003366]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#030E18]">
                          {s.firstName} {s.lastName}
                        </p>
                        <p className="text-xs text-[#929292]">
                          {s.gradeLevel ?? ""}
                        </p>
                      </div>
                      {selectedStudent?._id === s._id && (
                        <Check className="w-4 h-4 text-[#003366] ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              ) : allStudents.length > 0 && studentSearch ? (
                <p className="text-sm text-[#929292] text-center py-4">No students match your search</p>
              ) : allStudents.length === 0 ? (
                <p className="text-sm text-[#929292] text-center py-4">No students found at this school</p>
              ) : null;
            })()}

            {selectedStudent && snapshot && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs font-semibold text-[#003366] mb-2">Academic Snapshot</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-[#4A5568]">
                  <span>Current class: {snapshot.student.currentClass?.name ?? "—"}</span>
                  <span>
                    Attendance:{" "}
                    {Object.entries(snapshot.attendanceSummary)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(", ") || "—"}
                  </span>
                  <span>Recent grades: {snapshot.recentGrades.length} records</span>
                  <span>Enrollment history: {snapshot.enrollmentHistory.length} records</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Your Class & Year */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-[#929292] mb-2">
                Class to enroll student in
              </label>
              <div className="grid grid-cols-2 gap-2">
                {classes.length === 0 ? (
                  <p className="col-span-2 text-sm text-[#929292]">No classes found</p>
                ) : (
                  classes.map((c) => (
                    <button
                      key={c._id}
                      onClick={() => setSelectedClass(c)}
                      className={cn(
                        "px-3 py-2.5 text-left text-sm rounded-lg border transition-colors",
                        selectedClass?._id === c._id
                          ? "border-[#003366] bg-[#003366]/5 text-[#003366] font-medium"
                          : "border-gray-200 text-[#4A5568] hover:border-[#003366]/30"
                      )}
                    >
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs opacity-70">{c.gradeLevel}</p>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#929292] mb-2">Academic Year</label>
              <div className="grid grid-cols-2 gap-2">
                {academicYears.length === 0 ? (
                  <p className="col-span-2 text-sm text-[#929292]">No academic years found</p>
                ) : (
                  academicYears.map((y) => (
                    <button
                      key={y._id}
                      onClick={() => setSelectedYear(y)}
                      className={cn(
                        "px-3 py-2.5 text-sm rounded-lg border transition-colors",
                        selectedYear?._id === y._id
                          ? "border-[#003366] bg-[#003366]/5 text-[#003366] font-medium"
                          : "border-gray-200 text-[#4A5568] hover:border-[#003366]/30"
                      )}
                    >
                      {getAcademicYearLabel(y)}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#929292] mb-2">
                Reason for Transfer <span className="font-normal">(optional)</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Why are you requesting this student?"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#003366] transition-colors resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && selectedStudent && selectedSourceSchool && selectedClass && selectedYear && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-[#929292]">Student</span>
                <span className="text-sm font-medium text-[#030E18]">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#929292]">From School</span>
                <span className="text-sm font-medium text-[#030E18]">{selectedSourceSchool.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#929292]">Enroll Into</span>
                <span className="text-sm font-medium text-[#030E18]">
                  {selectedClass.name} ({selectedClass.gradeLevel})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#929292]">Academic Year</span>
                <span className="text-sm font-medium text-[#030E18]">{getAcademicYearLabel(selectedYear)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#929292]">Transfer Type</span>
                <span className="text-sm font-medium text-indigo-600">Pull (target initiated)</span>
              </div>
              {reason && (
                <div className="flex justify-between">
                  <span className="text-sm text-[#929292]">Reason</span>
                  <span className="text-sm font-medium text-[#030E18] text-right max-w-[60%]">
                    {reason}
                  </span>
                </div>
              )}
            </div>
            <p className="text-sm text-[#929292]">
              Submitting this request will notify the source school ({selectedSourceSchool.name}).
              The transfer will proceed once both schools have approved.
            </p>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#030E18]">Ready to Submit</h3>
              <p className="text-sm text-[#929292] mt-1">
                This pull request will be sent to {selectedSourceSchool?.name} for approval
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm text-[#929292] hover:text-[#030E18] disabled:opacity-30 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {step < STEPS.length - 1 ? (
          <button
            disabled={!canNext}
            onClick={() => setStep(step + 1)}
            className="flex items-center gap-2 px-5 py-2 bg-[#003366] text-white rounded-lg text-sm font-medium hover:bg-[#003366]/90 disabled:opacity-40 transition-colors"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            disabled={submitting}
            onClick={submit}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Pull Request"}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
      </div>
    </div>
  );
}
