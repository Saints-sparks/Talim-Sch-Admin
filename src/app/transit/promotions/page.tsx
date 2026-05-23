"use client";

import { useEffect, useState, useCallback } from "react";
import { TrendingUp, Plus, X, ChevronRight, AlertTriangle, CheckCircle } from "lucide-react";
import {
  listPromotionRuns,
  commitPromotionRun,
  cancelPromotionRun,
  createPromotionRun,
  validatePromotionRun,
  PromotionRun,
  PromotionDecision,
} from "@/app/services/transit.service";
import { getAcademicYears, AcademicYearResponse, getTerms, TermResponse } from "@/app/services/academic.service";
import { getClasses, studentService, Class, Student } from "@/app/services/student.service";
import { toast } from "@/components/CustomToast";
import { cn } from "@/lib/utils";

// ─── helpers ──────────────────────────────────────────────────────────────────

type RunStatus = PromotionRun["status"];

const STATUS_COLORS: Record<RunStatus, string> = {
  draft: "bg-amber-100 text-amber-700",
  validated: "bg-blue-100 text-blue-700",
  committed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Wizard Types ─────────────────────────────────────────────────────────────

type WizardStep = 1 | 2 | 3 | 4;

interface DecisionRow {
  studentId: string;
  studentName: string;
  fromClassId: string;
  fromClassName: string;
  toClassId: string;
  repeatClass: boolean;
}

// ─── Create Promotion Wizard ──────────────────────────────────────────────────

interface WizardProps {
  onClose: () => void;
  onCreated: (run: PromotionRun) => void;
  academicYears: AcademicYearResponse[];
  terms: TermResponse[];
  classes: Class[];
  students: Student[];
}

function PromotionWizard({ onClose, onCreated, academicYears, terms, classes, students }: WizardProps) {
  const [step, setStep] = useState<WizardStep>(1);

  // Step 1
  const [fromYearId, setFromYearId] = useState("");
  const [toYearId, setToYearId] = useState("");
  const [targetTermId, setTargetTermId] = useState("");

  // Step 2
  const [decisions, setDecisions] = useState<DecisionRow[]>([]);
  const [decisionSearch, setDecisionSearch] = useState("");

  // Step 3 / 4
  const [draftRun, setDraftRun] = useState<PromotionRun | null>(null);
  const [validating, setValidating] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialise decisions when step 2 is entered
  const initDecisions = useCallback(() => {
    const rows: DecisionRow[] = students.map((s) => {
      const fromClassId = typeof s.classId === "string" ? s.classId : (s.classId as Class)?._id ?? "";
      const fromClassName = typeof s.classId === "string" ? s.classId : (s.classId as Class)?.name ?? "";
      return {
        studentId: s._id,
        studentName: `${s.userId?.firstName ?? ""} ${s.userId?.lastName ?? ""}`.trim(),
        fromClassId,
        fromClassName,
        toClassId: "",
        repeatClass: false,
      };
    });
    setDecisions(rows);
  }, [students]);

  useEffect(() => {
    if (step === 2 && decisions.length === 0) {
      initDecisions();
    }
  }, [step, decisions.length, initDecisions]);

  function setAllToNextGrade() {
    // Build gradeLevel → next class map by sorting classes numerically
    const sorted = [...classes].sort((a, b) => {
      const na = parseInt(a.gradeLevel ?? "0");
      const nb = parseInt(b.gradeLevel ?? "0");
      return na - nb;
    });
    const gradeToClass: Record<string, Class> = {};
    sorted.forEach((c) => { gradeToClass[c.gradeLevel] = c; });

    setDecisions((prev) =>
      prev.map((d) => {
        const currentClass = classes.find((c) => c._id === d.fromClassId);
        if (!currentClass) return d;
        const currentGrade = parseInt(currentClass.gradeLevel ?? "0");
        const nextClass = sorted.find((c) => parseInt(c.gradeLevel ?? "0") === currentGrade + 1);
        return { ...d, toClassId: nextClass?._id ?? d.toClassId };
      })
    );
  }

  function updateDecision(studentId: string, field: keyof DecisionRow, value: string | boolean) {
    setDecisions((prev) =>
      prev.map((d) => (d.studentId === studentId ? { ...d, [field]: value } : d))
    );
  }

  const filteredDecisions = decisions.filter((d) =>
    !decisionSearch || d.studentName.toLowerCase().includes(decisionSearch.toLowerCase())
  );

  const readyDecisions = decisions.filter((d) => d.toClassId);

  async function handleCreateAndValidate() {
    if (readyDecisions.length === 0) {
      toast.error("Add at least one student decision before continuing");
      return;
    }
    setValidating(true);
    try {
      const payload: PromotionDecision[] = readyDecisions.map((d) => ({
        studentId: d.studentId,
        fromClassId: d.fromClassId,
        toClassId: d.toClassId,
        repeatClass: d.repeatClass,
      }));
      const run = await createPromotionRun({
        fromAcademicYearId: fromYearId,
        toAcademicYearId: toYearId,
        targetTermId: targetTermId || undefined,
        decisions: payload,
      });
      setDraftRun(run);
      setStep(3);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to create promotion run");
    } finally {
      setValidating(false);
    }
  }

  async function handleValidate() {
    if (!draftRun) return;
    setValidating(true);
    try {
      const run = await validatePromotionRun(draftRun._id);
      setDraftRun(run);
      setStep(4);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Validation failed");
    } finally {
      setValidating(false);
    }
  }

  async function handleCommit() {
    if (!draftRun) return;
    setCommitting(true);
    try {
      const run = await commitPromotionRun(draftRun._id);
      toast.success("Promotion run committed successfully");
      onCreated(run);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to commit");
    } finally {
      setCommitting(false);
    }
  }

  async function handleSaveDraft() {
    if (!draftRun) return;
    setSaving(true);
    // Run is already created as draft; just close and add to list
    setTimeout(() => {
      setSaving(false);
      toast.success("Draft saved");
      onCreated(draftRun);
    }, 300);
  }

  const stepLabels: Record<WizardStep, string> = {
    1: "Academic Years",
    2: "Decisions",
    3: "Review",
    4: "Confirm",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-[#030E18]">Create Promotion Run</h2>
            <div className="flex items-center gap-1.5 mt-1.5">
              {([1, 2, 3, 4] as WizardStep[]).map((s) => (
                <div key={s} className="flex items-center gap-1.5">
                  <div className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold",
                    s < step ? "bg-[#003366] text-white" :
                    s === step ? "bg-[#003366] text-white ring-2 ring-[#003366]/30" :
                    "bg-gray-100 text-[#929292]"
                  )}>
                    {s < step ? <CheckCircle className="w-3.5 h-3.5" /> : s}
                  </div>
                  <span className={cn("text-xs", s === step ? "text-[#003366] font-medium" : "text-[#929292]")}>
                    {stepLabels[s]}
                  </span>
                  {s < 4 && <ChevronRight className="w-3 h-3 text-gray-300" />}
                </div>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-[#929292]" />
          </button>
        </div>

        {/* Step 1 — Academic Years */}
        {step === 1 && (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-[#030E18] mb-1.5">From Academic Year <span className="text-red-500">*</span></label>
                  <select value={fromYearId} onChange={(e) => setFromYearId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#003366] bg-white">
                    <option value="">Select...</option>
                    {academicYears.map((y) => <option key={y._id} value={y._id}>{y.year}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#030E18] mb-1.5">To Academic Year <span className="text-red-500">*</span></label>
                  <select value={toYearId} onChange={(e) => setToYearId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#003366] bg-white">
                    <option value="">Select...</option>
                    {academicYears.map((y) => <option key={y._id} value={y._id}>{y.year}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#030E18] mb-1.5">Target Term <span className="text-[#929292] font-normal">(optional)</span></label>
                <select value={targetTermId} onChange={(e) => setTargetTermId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#003366] bg-white">
                  <option value="">No specific term</option>
                  {terms.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-[#4A5568] border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button
                onClick={() => setStep(2)}
                disabled={!fromYearId || !toYearId}
                className="px-4 py-2 text-sm font-medium text-white bg-[#003366] rounded-lg hover:bg-[#003366]/90 disabled:opacity-50 transition-colors"
              >
                Next: Build Decisions
              </button>
            </div>
          </>
        )}

        {/* Step 2 — Build Decisions */}
        {step === 2 && (
          <>
            <div className="flex-1 overflow-hidden flex flex-col px-6 py-4 gap-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="relative flex-1 min-w-48">
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={decisionSearch}
                    onChange={(e) => setDecisionSearch(e.target.value)}
                    className="w-full pl-3 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#003366] transition-colors"
                  />
                </div>
                <button
                  onClick={setAllToNextGrade}
                  className="px-3 py-2 text-xs font-medium text-[#003366] border border-[#003366] rounded-lg hover:bg-[#003366]/5 transition-colors whitespace-nowrap"
                >
                  Set all to next grade
                </button>
                <span className="text-xs text-[#929292]">{readyDecisions.length}/{decisions.length} assigned</span>
              </div>

              <div className="flex-1 overflow-y-auto border border-gray-100 rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium text-[#929292]">Student</th>
                      <th className="px-4 py-2.5 text-left font-medium text-[#929292]">Current Class</th>
                      <th className="px-4 py-2.5 text-left font-medium text-[#929292] w-8"></th>
                      <th className="px-4 py-2.5 text-left font-medium text-[#929292]">Target Class</th>
                      <th className="px-4 py-2.5 text-center font-medium text-[#929292]">Repeat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredDecisions.map((d) => (
                      <tr key={d.studentId} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-[#030E18]">{d.studentName}</td>
                        <td className="px-4 py-2.5 text-[#4A5568]">{d.fromClassName || "—"}</td>
                        <td className="px-4 py-2.5 text-[#929292]">→</td>
                        <td className="px-4 py-2.5">
                          <select
                            value={d.toClassId}
                            onChange={(e) => updateDecision(d.studentId, "toClassId", e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-[#003366] bg-white"
                          >
                            <option value="">Select target...</option>
                            {classes.map((c) => <option key={c._id} value={c._id}>{c.name} {c.gradeLevel ? `(G${c.gradeLevel})` : ""}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={d.repeatClass}
                            onChange={(e) => updateDecision(d.studentId, "repeatClass", e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-between gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setStep(1)} className="px-4 py-2 text-sm font-medium text-[#4A5568] border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Back</button>
              <button
                onClick={handleCreateAndValidate}
                disabled={validating || readyDecisions.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-[#003366] rounded-lg hover:bg-[#003366]/90 disabled:opacity-50 transition-colors"
              >
                {validating ? "Creating..." : `Review (${readyDecisions.length} students)`}
              </button>
            </div>
          </>
        )}

        {/* Step 3 — Review / Validate */}
        {step === 3 && draftRun && (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-[#030E18]">{draftRun.decisions.length} student decisions ready</p>
                  <p className="text-xs text-[#929292] mt-0.5">Run ID: {draftRun._id}</p>
                </div>
                <span className={cn("ml-auto px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLORS[draftRun.status])}>
                  {draftRun.status}
                </span>
              </div>
              <p className="text-sm text-[#929292]">
                Click <strong className="text-[#030E18]">Validate</strong> to check for eligibility issues before committing.
                You can also save as a draft and validate later.
              </p>
            </div>
            <div className="flex justify-between gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={handleSaveDraft} disabled={saving} className="px-4 py-2 text-sm font-medium text-[#4A5568] border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
                {saving ? "Saving..." : "Save Draft"}
              </button>
              <button
                onClick={handleValidate}
                disabled={validating}
                className="px-4 py-2 text-sm font-medium text-white bg-[#003366] rounded-lg hover:bg-[#003366]/90 disabled:opacity-50 transition-colors"
              >
                {validating ? "Validating..." : "Validate"}
              </button>
            </div>
          </>
        )}

        {/* Step 4 — Confirm (validation result) */}
        {step === 4 && draftRun && (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              {draftRun.validationResult ? (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-center">
                      <p className="text-2xl font-bold text-green-700">{draftRun.validationResult.eligible.length}</p>
                      <p className="text-xs text-green-600 mt-0.5">Eligible</p>
                    </div>
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-center">
                      <p className="text-2xl font-bold text-red-700">{draftRun.validationResult.ineligible.length}</p>
                      <p className="text-xs text-red-600 mt-0.5">Ineligible</p>
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-center">
                      <p className="text-2xl font-bold text-amber-700">{draftRun.validationResult.warnings.length}</p>
                      <p className="text-xs text-amber-600 mt-0.5">Warnings</p>
                    </div>
                  </div>

                  {draftRun.validationResult.ineligible.length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-red-700">
                        <AlertTriangle className="w-4 h-4" />
                        Ineligible students
                      </div>
                      {draftRun.validationResult.ineligible.map((item, i) => (
                        <p key={i} className="text-xs text-red-600">{item.studentId}: {item.reason}</p>
                      ))}
                    </div>
                  )}

                  {draftRun.validationResult.warnings.length > 0 && (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl space-y-1.5">
                      <p className="text-sm font-medium text-amber-700">Warnings</p>
                      {draftRun.validationResult.warnings.map((w, i) => (
                        <p key={i} className="text-xs text-amber-600">{w}</p>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-[#929292]">Validation result not available.</p>
              )}
            </div>
            <div className="flex justify-between gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={handleSaveDraft} disabled={saving || committing} className="px-4 py-2 text-sm font-medium text-[#4A5568] border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
                {saving ? "Saving..." : "Save Draft"}
              </button>
              <button
                onClick={handleCommit}
                disabled={committing || saving}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {committing ? "Committing..." : `Commit (${draftRun.validationResult?.eligible.length ?? draftRun.decisions.length} eligible)`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PromotionsPage() {
  const [runs, setRuns] = useState<PromotionRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  const [academicYears, setAcademicYears] = useState<AcademicYearResponse[]>([]);
  const [terms, setTerms] = useState<TermResponse[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    listPromotionRuns()
      .then(setRuns)
      .catch(() => toast.error("Failed to load promotion runs"))
      .finally(() => setLoading(false));

    Promise.all([
      getAcademicYears().then(setAcademicYears),
      getTerms().then(setTerms),
      getClasses().then(setClasses),
      studentService.getStudents(1, 500).then((r) => setStudents(r.data)),
    ]).catch(() => {});
  }, []);

  async function handleCommit(run: PromotionRun) {
    setActionId(run._id);
    try {
      const updated = await commitPromotionRun(run._id);
      setRuns((prev) => prev.map((r) => (r._id === run._id ? updated : r)));
      toast.success("Promotion run committed successfully");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to commit promotion run");
    } finally {
      setActionId(null);
    }
  }

  async function handleCancel(run: PromotionRun) {
    setActionId(run._id);
    try {
      const updated = await cancelPromotionRun(run._id);
      setRuns((prev) => prev.map((r) => (r._id === run._id ? updated : r)));
      toast.success("Promotion run cancelled");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to cancel promotion run");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#030E18]">Promotions</h1>
          <p className="text-sm text-[#929292] mt-1">Promote students to the next class at end of an academic year</p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg text-sm font-medium hover:bg-[#003366]/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Promotion Run
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : runs.length === 0 ? (
        <div className="text-center py-20 text-[#929292]">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No promotion runs yet</p>
          <p className="text-sm mt-1">Create a promotion run to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => (
            <div key={run._id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLORS[run.status])}>
                      {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                    </span>
                    <span className="text-xs text-[#929292]">Created {fmt(run.createdAt)}</span>
                  </div>
                  <p className="text-sm text-[#4A5568]">
                    {run.decisions.length} student decision{run.decisions.length !== 1 ? "s" : ""}
                  </p>
                  {run.validationResult && (
                    <p className="text-xs text-[#929292] mt-1">
                      {run.validationResult.eligible.length} eligible ·{" "}
                      {run.validationResult.ineligible.length} ineligible
                      {run.validationResult.warnings.length > 0
                        ? ` · ${run.validationResult.warnings.length} warning(s)`
                        : ""}
                    </p>
                  )}
                </div>
                {run.status !== "committed" && run.status !== "cancelled" && (
                  <div className="flex gap-2 shrink-0">
                    {run.status === "validated" && (
                      <button
                        disabled={actionId === run._id}
                        onClick={() => handleCommit(run)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {actionId === run._id ? "..." : "Commit"}
                      </button>
                    )}
                    {["draft", "validated"].includes(run.status) && (
                      <button
                        disabled={actionId === run._id}
                        onClick={() => handleCancel(run)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
                      >
                        {actionId === run._id ? "..." : "Cancel"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showWizard && (
        <PromotionWizard
          onClose={() => setShowWizard(false)}
          onCreated={(run) => {
            setRuns((prev) => [run, ...prev]);
            setShowWizard(false);
          }}
          academicYears={academicYears}
          terms={terms}
          classes={classes}
          students={students}
        />
      )}
    </div>
  );
}
