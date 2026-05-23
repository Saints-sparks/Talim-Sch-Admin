"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Loader2,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import {
  buildBulkDecisions,
  canCommit,
  cancelPromotionRun,
  commitPromotionRun,
  createPromotionRun,
  getPromotionRun,
  getValidationSummary,
  listEnrollments,
  listPromotionRuns,
  PromotionDecision,
  PromotionRun,
  PromotionValidationIssue,
  StudentEnrollment,
  validatePromotionRun,
} from "@/app/services/transit.service";
import {
  AcademicYearResponse,
  getAcademicYears,
  getTerms,
  TermResponse,
} from "@/app/services/academic.service";
import { Class, getClasses } from "@/app/services/student.service";
import { toast } from "@/components/CustomToast";
import { cn } from "@/lib/utils";

type PromotionStatus = PromotionRun["status"];
type Mode = "individual" | "bulk";
type WizardStep = 1 | 2 | 3 | 4;

interface DecisionDraft extends PromotionDecision {
  studentName: string;
}

const STATUSES: { label: string; value: "" | PromotionStatus }[] = [
  { label: "All Statuses", value: "" },
  { label: "Draft", value: "draft" },
  { label: "Validated", value: "validated" },
  { label: "Committed", value: "committed" },
  { label: "Cancelled", value: "cancelled" },
];

const STATUS_BADGES: Record<PromotionStatus, string> = {
  draft: "bg-amber-100 text-amber-700 border-amber-200",
  validated: "bg-blue-100 text-blue-700 border-blue-200",
  committed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-rose-50 text-rose-600 border-rose-100",
};

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getId(value?: string | { _id: string } | null) {
  if (!value) return "";
  return typeof value === "string" ? value : value._id;
}

function yearLabel(value: PromotionRun["fromAcademicYearId"] | string, years: AcademicYearResponse[]) {
  const id = getId(value);
  if (typeof value === "object" && value) return value.year ?? value.name ?? value._id;
  return years.find((year) => year._id === id)?.year ?? id.slice(-8) ?? "-";
}

function termLabel(value: PromotionRun["targetTermId"], terms: TermResponse[]) {
  const id = getId(value);
  if (!id) return "No target term";
  if (typeof value === "object") return value.name ?? value._id;
  return terms.find((term) => term._id === id)?.name ?? id.slice(-8);
}

function classLabel(classId: string, classes: Class[]) {
  const found = classes.find((item) => item._id === classId);
  if (!found) return classId || "-";
  return `${found.name}${found.gradeLevel ? ` (${found.gradeLevel})` : ""}`;
}

function studentNameFromEnrollment(enrollment?: StudentEnrollment) {
  if (!enrollment) return "";
  const student = enrollment.studentId;
  if (typeof student === "string") return student;
  const user = student.userId;
  return `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || student._id;
}

function studentIdFromEnrollment(enrollment: StudentEnrollment) {
  return getId(enrollment.studentId);
}

function classIdFromEnrollment(enrollment: StudentEnrollment) {
  return getId(enrollment.classId);
}

function issueText(issue: PromotionValidationIssue | string) {
  if (typeof issue === "string") return issue;
  return [issue.studentId, issue.field, issue.message ?? issue.reason].filter(Boolean).join(" - ");
}

function validationErrors(run?: PromotionRun | null) {
  if (!run) return [];
  if (run.validationErrors?.length) return run.validationErrors.map(issueText);
  return run.validationResult?.ineligible.map((item) => `${item.studentId} - ${item.reason}`) ?? [];
}

function validationWarnings(run?: PromotionRun | null) {
  if (!run) return [];
  if (run.validationWarnings?.length) return run.validationWarnings.map(issueText);
  return run.validationResult?.warnings ?? [];
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function SelectField({
  label,
  value,
  onChange,
  children,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase text-[#929292]">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-[#030E18] outline-none transition focus:border-[#003366] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {children}
      </select>
    </label>
  );
}

function CreatePromotionRunModal({
  academicYears,
  terms,
  classes,
  onClose,
  onCreated,
}: {
  academicYears: AcademicYearResponse[];
  terms: TermResponse[];
  classes: Class[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState<WizardStep>(1);
  const [fromAcademicYearId, setFromAcademicYearId] = useState("");
  const [toAcademicYearId, setToAcademicYearId] = useState("");
  const [targetTermId, setTargetTermId] = useState("");
  const [mode, setMode] = useState<Mode>("individual");
  const [sourceClassId, setSourceClassId] = useState("");
  const [targetClassId, setTargetClassId] = useState("");
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [decisions, setDecisions] = useState<DecisionDraft[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadStudents = useCallback(
    async (classId?: string) => {
      if (!fromAcademicYearId) return;
      setLoadingStudents(true);
      try {
        const data = await listEnrollments({
          academicYearId: fromAcademicYearId,
          classId,
          status: "active",
        });
        setEnrollments(data);
        if (mode === "bulk" && classId && targetClassId) {
          const bulk = buildBulkDecisions(data, classId, targetClassId).map((decision) => ({
            ...decision,
            studentName:
              studentNameFromEnrollment(data.find((item) => studentIdFromEnrollment(item) === decision.studentId) ?? data[0]) ??
              decision.studentId,
          }));
          setDecisions(bulk);
        }
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to load enrollments"));
      } finally {
        setLoadingStudents(false);
      }
    },
    [fromAcademicYearId, mode, targetClassId]
  );

  useEffect(() => {
    if (step === 2 && mode === "individual") loadStudents();
    if (step === 2 && mode === "bulk" && sourceClassId) loadStudents(sourceClassId);
  }, [loadStudents, mode, sourceClassId, step]);

  useEffect(() => {
    if (mode !== "bulk" || !sourceClassId || !targetClassId) return;
    const generated = buildBulkDecisions(enrollments, sourceClassId, targetClassId).map((decision) => ({
      ...decision,
      studentName:
        studentNameFromEnrollment(enrollments.find((item) => studentIdFromEnrollment(item) === decision.studentId) ?? enrollments[0]) ??
        decision.studentId,
    }));
    setDecisions(generated);
  }, [enrollments, mode, sourceClassId, targetClassId]);

  const selectedEnrollments = useMemo(
    () => enrollments.filter((enrollment) => selectedIds.has(studentIdFromEnrollment(enrollment))),
    [enrollments, selectedIds]
  );

  function toggleStudent(enrollment: StudentEnrollment, checked: boolean) {
    const studentId = studentIdFromEnrollment(enrollment);
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(studentId);
      else next.delete(studentId);
      return next;
    });

    setDecisions((current) => {
      if (!checked) return current.filter((decision) => decision.studentId !== studentId);
      if (current.some((decision) => decision.studentId === studentId)) return current;
      return [
        ...current,
        {
          studentId,
          studentName: studentNameFromEnrollment(enrollment),
          fromClassId: classIdFromEnrollment(enrollment),
          toClassId: "",
          repeatClass: false,
        },
      ];
    });
  }

  function updateDecision(studentId: string, patch: Partial<DecisionDraft>) {
    setDecisions((current) =>
      current.map((decision) => (decision.studentId === studentId ? { ...decision, ...patch } : decision))
    );
  }

  function goToReview() {
    const ready = decisions.filter((decision) => decision.studentId && decision.fromClassId && decision.toClassId);
    if (!ready.length) {
      toast.error("Add at least one complete student decision");
      return;
    }
    setDecisions(ready);
    setStep(3);
  }

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await createPromotionRun({
        fromAcademicYearId,
        toAcademicYearId,
        targetTermId: targetTermId || undefined,
        decisions: decisions.map(({ studentName: _studentName, ...decision }) => decision),
      });
      toast.success("Promotion run created successfully");
      onCreated();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to create promotion run"));
    } finally {
      setSubmitting(false);
    }
  }

  const canContinueSetup = fromAcademicYearId && toAcademicYearId && fromAcademicYearId !== toAcademicYearId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030E18]/60 p-4">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-[#030E18]">Create Promotion Run</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Setup", mode === "individual" ? "Students" : "Bulk Class", "Review", "Submit"].map((label, index) => (
                <span
                  key={label}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    step === index + 1 ? "border-[#003366] bg-[#003366] text-white" : "border-slate-200 text-[#929292]"
                  )}
                >
                  {index + 1}. {label}
                </span>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-[#929292] hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 1 && (
            <div className="grid gap-5 md:grid-cols-2">
              <SelectField label="From Academic Year" value={fromAcademicYearId} onChange={setFromAcademicYearId}>
                <option value="">Select source year</option>
                {academicYears.map((year) => (
                  <option key={year._id} value={year._id}>
                    {year.year}
                  </option>
                ))}
              </SelectField>
              <SelectField label="To Academic Year" value={toAcademicYearId} onChange={setToAcademicYearId}>
                <option value="">Select target year</option>
                {academicYears.map((year) => (
                  <option key={year._id} value={year._id}>
                    {year.year}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Target Term (optional)" value={targetTermId} onChange={setTargetTermId}>
                <option value="">No specific term</option>
                {terms
                  .filter((term) => !toAcademicYearId || term.academicYearId === toAcademicYearId)
                  .map((term) => (
                    <option key={term._id} value={term._id}>
                      {term.name}
                    </option>
                  ))}
              </SelectField>
              <div>
                <span className="mb-1.5 block text-xs font-semibold uppercase text-[#929292]">Mode</span>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Individual Students", value: "individual" as Mode },
                    { label: "Bulk Class Promotion", value: "bulk" as Mode },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        setMode(item.value);
                        setDecisions([]);
                        setSelectedIds(new Set());
                      }}
                      className={cn(
                        "rounded-lg border px-4 py-3 text-left text-sm font-medium transition",
                        mode === item.value
                          ? "border-[#003366] bg-[#003366]/5 text-[#003366]"
                          : "border-slate-200 text-[#030E18] hover:border-[#003366]/40"
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && mode === "individual" && (
            <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
              <div className="rounded-xl border border-slate-100">
                <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-[#030E18]">
                  Active enrollments
                </div>
                <div className="max-h-[430px] overflow-y-auto divide-y divide-slate-100">
                  {loadingStudents ? (
                    <div className="flex items-center gap-2 p-4 text-sm text-[#929292]">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading students
                    </div>
                  ) : (
                    enrollments.map((enrollment) => {
                      const studentId = studentIdFromEnrollment(enrollment);
                      return (
                        <label key={enrollment._id} className="flex cursor-pointer gap-3 px-4 py-3 hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(studentId)}
                            onChange={(event) => toggleStudent(enrollment, event.target.checked)}
                            className="mt-1 h-4 w-4"
                          />
                          <span>
                            <span className="block text-sm font-medium text-[#030E18]">{studentNameFromEnrollment(enrollment)}</span>
                            <span className="text-xs text-[#929292]">{classLabel(classIdFromEnrollment(enrollment), classes)}</span>
                          </span>
                        </label>
                      );
                    })
                  )}
                  {!loadingStudents && enrollments.length === 0 && (
                    <p className="p-4 text-sm text-[#929292]">No active enrollments found for this academic year.</p>
                  )}
                </div>
              </div>
              <DecisionEditor decisions={decisions} classes={classes} onChange={updateDecision} />
            </div>
          )}

          {step === 2 && mode === "bulk" && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="Source Class"
                  value={sourceClassId}
                  onChange={(value) => {
                    setSourceClassId(value);
                    setDecisions([]);
                    if (value) loadStudents(value);
                  }}
                >
                  <option value="">Select source class</option>
                  {classes.map((item) => (
                    <option key={item._id} value={item._id}>
                      {classLabel(item._id, classes)}
                    </option>
                  ))}
                </SelectField>
                <SelectField label="Target Class" value={targetClassId} onChange={setTargetClassId}>
                  <option value="">Select target class</option>
                  {classes.map((item) => (
                    <option key={item._id} value={item._id}>
                      {classLabel(item._id, classes)}
                    </option>
                  ))}
                </SelectField>
              </div>
              <div className="rounded-xl border border-slate-100">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-[#030E18]">Preview decisions</p>
                  <p className="text-xs text-[#929292]">{decisions.length} students loaded</p>
                </div>
                <DecisionEditor decisions={decisions} classes={classes} onChange={updateDecision} compact />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold text-[#030E18]">Review Decisions</p>
                <p className="text-sm text-[#929292]">{decisions.length} total student decisions</p>
              </div>
              <DecisionEditor decisions={decisions} classes={classes} onChange={updateDecision} />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
                <p className="text-lg font-semibold text-[#030E18]">Submit promotion run</p>
                <p className="mt-1 text-sm text-[#929292]">
                  {decisions.length} decisions from {academicYears.find((item) => item._id === fromAcademicYearId)?.year} to{" "}
                  {academicYears.find((item) => item._id === toAcademicYearId)?.year}
                </p>
              </div>
              <p className="text-sm text-[#4A5568]">
                The backend will preserve historical enrollment records. Validate the run from the table before committing it.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-between border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={() => (step === 1 ? onClose() : setStep((current) => (current - 1) as WizardStep))}
            disabled={submitting}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-[#030E18] hover:bg-slate-50 disabled:opacity-60"
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>
          {step < 4 ? (
            <button
              type="button"
              onClick={() => (step === 2 ? goToReview() : setStep((current) => (current + 1) as WizardStep))}
              disabled={(step === 1 && !canContinueSetup) || (step === 2 && !decisions.length)}
              className="rounded-lg bg-[#003366] px-4 py-2 text-sm font-medium text-white hover:bg-[#003366]/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {step === 3 ? "Continue to Submit" : "Next"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-[#003366] px-4 py-2 text-sm font-medium text-white hover:bg-[#003366]/90 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Run
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DecisionEditor({
  decisions,
  classes,
  onChange,
  compact,
}: {
  decisions: DecisionDraft[];
  classes: Class[];
  onChange: (studentId: string, patch: Partial<DecisionDraft>) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-slate-100", compact && "rounded-none border-0")}>
      <div className="max-h-[430px] overflow-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="sticky top-0 bg-slate-50">
            <tr className="border-b border-slate-100 text-left text-xs uppercase text-[#929292]">
              <th className="px-4 py-3 font-semibold">Student</th>
              <th className="px-4 py-3 font-semibold">From Class</th>
              <th className="px-4 py-3 font-semibold">Target Class</th>
              <th className="px-4 py-3 font-semibold">Target Grade</th>
              <th className="px-4 py-3 text-center font-semibold">Repeat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {decisions.map((decision) => (
              <tr key={decision.studentId}>
                <td className="px-4 py-3 font-medium text-[#030E18]">{decision.studentName}</td>
                <td className="px-4 py-3 text-[#4A5568]">{classLabel(decision.fromClassId, classes)}</td>
                <td className="px-4 py-3">
                  <select
                    value={decision.toClassId}
                    onChange={(event) => onChange(decision.studentId, { toClassId: event.target.value })}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#003366]"
                  >
                    <option value="">Select class</option>
                    {classes.map((item) => (
                      <option key={item._id} value={item._id}>
                        {classLabel(item._id, classes)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    value={decision.targetGradeLevel ?? ""}
                    onChange={(event) => onChange(decision.studentId, { targetGradeLevel: event.target.value || undefined })}
                    placeholder="Optional"
                    className="h-9 w-full rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-[#003366]"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={Boolean(decision.repeatClass)}
                    onChange={(event) => onChange(decision.studentId, { repeatClass: event.target.checked })}
                    className="h-4 w-4"
                  />
                </td>
              </tr>
            ))}
            {!decisions.length && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-[#929292]">
                  No student decisions selected yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ValidationResultModal({
  run,
  onClose,
  onCommit,
  pending,
}: {
  run: PromotionRun;
  onClose: () => void;
  onCommit: (run: PromotionRun) => void;
  pending: boolean;
}) {
  const errors = validationErrors(run);
  const warnings = validationWarnings(run);
  const summary = getValidationSummary(run);

  return (
    <SimpleModal title="Validation Result" onClose={onClose}>
      <div className="grid grid-cols-3 gap-3">
        <SummaryTile label="Eligible" value={summary.eligibleCount} tone="green" />
        <SummaryTile label="Errors" value={summary.errorsCount} tone="red" />
        <SummaryTile label="Warnings" value={summary.warningsCount} tone="amber" />
      </div>
      <IssueList title="Validation errors" issues={errors} tone="red" empty="No blocking validation errors." />
      <IssueList title="Validation warnings" issues={warnings} tone="amber" empty="No warnings reported." />
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-[#030E18]">
          Close
        </button>
        <button
          onClick={() => onCommit(run)}
          disabled={pending || !canCommit(run)}
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Continue to Commit
        </button>
      </div>
    </SimpleModal>
  );
}

function CommitConfirmModal({
  run,
  years,
  pending,
  onClose,
  onConfirm,
}: {
  run: PromotionRun;
  years: AcademicYearResponse[];
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const warnings = validationWarnings(run);
  return (
    <SimpleModal title="Commit Promotion Run" onClose={onClose}>
      <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
        <p>
          <span className="font-semibold text-[#030E18]">{run.decisions.length}</span> students
        </p>
        <p className="text-[#4A5568]">
          {yearLabel(run.fromAcademicYearId, years)} to {yearLabel(run.toAcademicYearId, years)}
        </p>
        <p className="text-[#4A5568]">{warnings.length} warning(s)</p>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} disabled={pending} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium">
          Back
        </button>
        <button
          onClick={onConfirm}
          disabled={pending || !canCommit(run)}
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Confirm Commit
        </button>
      </div>
    </SimpleModal>
  );
}

function CancelRunModal({
  run,
  pending,
  onClose,
  onConfirm,
}: {
  run: PromotionRun;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <SimpleModal title="Cancel Promotion Run" onClose={onClose}>
      <p className="text-sm text-[#4A5568]">
        This will cancel run <span className="font-semibold text-[#030E18]">{run._id}</span>. Committed runs cannot be cancelled.
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} disabled={pending} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium">
          Keep Run
        </button>
        <button
          onClick={onConfirm}
          disabled={pending || run.status === "committed"}
          className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Cancel Run
        </button>
      </div>
    </SimpleModal>
  );
}

function RunDetailsDrawer({
  run,
  years,
  terms,
  classes,
  loading,
  onClose,
}: {
  run: PromotionRun | null;
  years: AcademicYearResponse[];
  terms: TermResponse[];
  classes: Class[];
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-[#030E18]/50">
      <aside className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-[#030E18]">Promotion Run Details</h2>
            <p className="mt-1 text-sm text-[#929292]">{run?._id ?? "Loading run"}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-[#929292] hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        {loading || !run ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : (
          <div className="space-y-6 p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <Meta label="Status" value={run.status} badge />
              <Meta label="Students" value={String(run.decisions.length)} />
              <Meta label="From Year" value={yearLabel(run.fromAcademicYearId, years)} />
              <Meta label="To Year" value={yearLabel(run.toAcademicYearId, years)} />
              <Meta label="Target Term" value={termLabel(run.targetTermId, terms)} />
              <Meta label="Created" value={formatDate(run.createdAt)} />
              <Meta label="Validated" value={formatDate(run.validatedAt)} />
              <Meta label="Committed" value={formatDate(run.committedAt)} />
              <Meta label="Cancelled" value={formatDate(run.cancelledAt)} />
              <Meta label="Updated" value={formatDate(run.updatedAt)} />
            </div>
            {run.status === "committed" && (
              <div className="rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-700">
                This run is committed and readonly. Historical enrollment records are preserved by the transit backend.
              </div>
            )}
            <IssueList title="Validation errors" issues={validationErrors(run)} tone="red" empty="No validation errors." />
            <IssueList title="Validation warnings" issues={validationWarnings(run)} tone="amber" empty="No validation warnings." />
            <div className="overflow-hidden rounded-xl border border-slate-100">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-[#929292]">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">From Class</th>
                    <th className="px-4 py-3">To Class</th>
                    <th className="px-4 py-3">Grade</th>
                    <th className="px-4 py-3">Repeat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {run.decisions.map((decision) => (
                    <tr key={`${decision.studentId}-${decision.toClassId}`}>
                      <td className="px-4 py-3 font-medium text-[#030E18]">{decision.studentId}</td>
                      <td className="px-4 py-3 text-[#4A5568]">{classLabel(decision.fromClassId, classes)}</td>
                      <td className="px-4 py-3 text-[#4A5568]">{classLabel(decision.toClassId, classes)}</td>
                      <td className="px-4 py-3 text-[#4A5568]">{decision.targetGradeLevel ?? "-"}</td>
                      <td className="px-4 py-3 text-[#4A5568]">{decision.repeatClass ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function SimpleModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030E18]/60 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <h2 className="text-xl font-semibold text-[#030E18]">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-[#929292] hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SummaryTile({ label, value, tone }: { label: string; value: number; tone: "green" | "red" | "amber" }) {
  const tones = {
    green: "bg-green-50 text-green-700 border-green-100",
    red: "bg-red-50 text-red-700 border-red-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
  };
  return (
    <div className={cn("rounded-xl border p-4 text-center", tones[tone])}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium">{label}</p>
    </div>
  );
}

function IssueList({
  title,
  issues,
  tone,
  empty,
}: {
  title: string;
  issues: string[];
  tone: "red" | "amber";
  empty: string;
}) {
  const tones = {
    red: "border-red-100 bg-red-50 text-red-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
  };
  return (
    <div className={cn("mt-4 rounded-xl border p-4", tones[tone])}>
      <p className="text-sm font-semibold">{title}</p>
      {issues.length ? (
        <ul className="mt-2 space-y-1 text-sm">
          {issues.map((issue, index) => (
            <li key={`${issue}-${index}`}>{issue}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm opacity-80">{empty}</p>
      )}
    </div>
  );
}

function Meta({ label, value, badge }: { label: string; value: string; badge?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase text-[#929292]">{label}</p>
      {badge ? (
        <span className={cn("mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize", STATUS_BADGES[value as PromotionStatus])}>
          {value}
        </span>
      ) : (
        <p className="mt-2 text-sm font-medium text-[#030E18]">{value}</p>
      )}
    </div>
  );
}

export default function PromotionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = (searchParams.get("status") ?? "") as "" | PromotionStatus;
  const yearFilter = searchParams.get("academicYear") ?? "";

  const [runs, setRuns] = useState<PromotionRun[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearResponse[]>([]);
  const [terms, setTerms] = useState<TermResponse[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionKey, setActionKey] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [validationRun, setValidationRun] = useState<PromotionRun | null>(null);
  const [commitRun, setCommitRun] = useState<PromotionRun | null>(null);
  const [cancelRun, setCancelRun] = useState<PromotionRun | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsRun, setDetailsRun] = useState<PromotionRun | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadRuns = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listPromotionRuns(statusFilter || undefined);
      setRuns(data);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load promotion runs"));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  useEffect(() => {
    Promise.all([getAcademicYears(), getTerms(), getClasses()])
      .then(([years, termsData, classData]) => {
        setAcademicYears(years);
        setTerms(termsData);
        setClasses(classData);
      })
      .catch((error) => toast.error(getErrorMessage(error, "Failed to load promotion setup data")));
  }, []);

  const filteredRuns = useMemo(() => {
    return runs.filter((run) => !yearFilter || getId(run.fromAcademicYearId) === yearFilter || getId(run.toAcademicYearId) === yearFilter);
  }, [runs, yearFilter]);

  const stats = useMemo(
    () => ({
      open: runs.filter((run) => run.status === "draft").length,
      ready: runs.filter((run) => canCommit(run)).length,
      committed: runs.filter((run) => run.status === "committed").length,
    }),
    [runs]
  );

  function updateFilters(next: { status?: string; academicYear?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    const status = next.status ?? statusFilter;
    const academicYear = next.academicYear ?? yearFilter;
    if (status) params.set("status", status);
    else params.delete("status");
    if (academicYear) params.set("academicYear", academicYear);
    else params.delete("academicYear");
    const qs = params.toString();
    router.replace(`/transit/promotions${qs ? `?${qs}` : ""}`);
  }

  async function handleValidate(run: PromotionRun) {
    if (actionKey) return;
    setActionKey(`validate:${run._id}`);
    try {
      const updated = await validatePromotionRun(run._id);
      setValidationRun(updated);
      await loadRuns();
      toast.success("Promotion run validated");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to validate promotion run"));
    } finally {
      setActionKey("");
    }
  }

  async function handleCommit(run: PromotionRun) {
    if (actionKey || !canCommit(run)) return;
    setActionKey(`commit:${run._id}`);
    try {
      await commitPromotionRun(run._id);
      setCommitRun(null);
      setValidationRun(null);
      await loadRuns();
      toast.success("Promotion run committed successfully");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to commit promotion run"));
    } finally {
      setActionKey("");
    }
  }

  async function handleCancel(run: PromotionRun) {
    if (actionKey || run.status === "committed") return;
    setActionKey(`cancel:${run._id}`);
    try {
      await cancelPromotionRun(run._id);
      setCancelRun(null);
      await loadRuns();
      toast.success("Promotion run cancelled");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to cancel promotion run"));
    } finally {
      setActionKey("");
    }
  }

  async function openDetails(run: PromotionRun) {
    setDetailsOpen(true);
    setDetailsRun(run);
    setDetailsLoading(true);
    try {
      setDetailsRun(await getPromotionRun(run._id));
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load promotion run details"));
    } finally {
      setDetailsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#030E18]">Promotions</h1>
            <p className="mt-1 text-sm text-[#929292]">Manage student and class promotion runs across academic years</p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#003366] px-4 text-sm font-semibold text-white hover:bg-[#003366]/90"
          >
            <Plus className="h-4 w-4" />
            Create Promotion Run
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard label="Open Runs" value={stats.open} icon={<SlidersHorizontal className="h-5 w-5" />} />
          <StatsCard label="Validated Runs Ready to Commit" value={stats.ready} icon={<ShieldCheck className="h-5 w-5" />} />
          <StatsCard label="Committed Runs" value={stats.committed} icon={<CheckCircle2 className="h-5 w-5" />} />
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm md:flex-row md:items-end">
          <SelectField label="Status" value={statusFilter} onChange={(value) => updateFilters({ status: value })}>
            {STATUSES.map((status) => (
              <option key={status.value || "all"} value={status.value}>
                {status.label}
              </option>
            ))}
          </SelectField>
          <SelectField label="Academic Year" value={yearFilter} onChange={(value) => updateFilters({ academicYear: value })}>
            <option value="">All academic years</option>
            {academicYears.map((year) => (
              <option key={year._id} value={year._id}>
                {year.year}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-[#929292]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Run ID</th>
                  <th className="px-4 py-3 font-semibold">From Year</th>
                  <th className="px-4 py-3 font-semibold">To Year</th>
                  <th className="px-4 py-3 font-semibold">Total Students</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Created Date</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td colSpan={7} className="px-4 py-3">
                        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                      </td>
                    </tr>
                  ))
                ) : filteredRuns.length ? (
                  filteredRuns.map((run) => {
                    const validating = actionKey === `validate:${run._id}`;
                    const committing = actionKey === `commit:${run._id}`;
                    const cancelling = actionKey === `cancel:${run._id}`;
                    const readonly = run.status === "committed" || run.status === "cancelled";
                    return (
                      <tr key={run._id} className="hover:bg-slate-50">
                        <td className="px-4 py-4 font-medium text-[#030E18]">{run._id.slice(-10)}</td>
                        <td className="px-4 py-4 text-[#4A5568]">{yearLabel(run.fromAcademicYearId, academicYears)}</td>
                        <td className="px-4 py-4 text-[#4A5568]">{yearLabel(run.toAcademicYearId, academicYears)}</td>
                        <td className="px-4 py-4 text-[#4A5568]">{run.decisions.length}</td>
                        <td className="px-4 py-4">
                          <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold capitalize", STATUS_BADGES[run.status])}>
                            {run.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-[#929292]">{formatDate(run.createdAt)}</td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <IconButton label="View" onClick={() => openDetails(run)} disabled={Boolean(actionKey)}>
                              <Eye className="h-4 w-4" />
                            </IconButton>
                            <ActionButton onClick={() => handleValidate(run)} disabled={readonly || Boolean(actionKey)} loading={validating}>
                              Validate
                            </ActionButton>
                            <ActionButton
                              onClick={() => setCommitRun(run)}
                              disabled={!canCommit(run) || Boolean(actionKey)}
                              loading={committing}
                              tone="green"
                            >
                              Commit
                            </ActionButton>
                            <IconButton
                              label="Cancel"
                              onClick={() => setCancelRun(run)}
                              disabled={readonly || Boolean(actionKey)}
                              danger
                              loading={cancelling}
                            >
                              <Trash2 className="h-4 w-4" />
                            </IconButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-14 text-center text-[#929292]">
                      <AlertTriangle className="mx-auto mb-3 h-8 w-8 opacity-40" />
                      No promotion runs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {createOpen && (
        <CreatePromotionRunModal
          academicYears={academicYears}
          terms={terms}
          classes={classes}
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            loadRuns();
          }}
        />
      )}
      {validationRun && (
        <ValidationResultModal
          run={validationRun}
          pending={actionKey === `commit:${validationRun._id}`}
          onClose={() => setValidationRun(null)}
          onCommit={setCommitRun}
        />
      )}
      {commitRun && (
        <CommitConfirmModal
          run={commitRun}
          years={academicYears}
          pending={actionKey === `commit:${commitRun._id}`}
          onClose={() => setCommitRun(null)}
          onConfirm={() => handleCommit(commitRun)}
        />
      )}
      {cancelRun && (
        <CancelRunModal
          run={cancelRun}
          pending={actionKey === `cancel:${cancelRun._id}`}
          onClose={() => setCancelRun(null)}
          onConfirm={() => handleCancel(cancelRun)}
        />
      )}
      {detailsOpen && (
        <RunDetailsDrawer
          run={detailsRun}
          years={academicYears}
          terms={terms}
          classes={classes}
          loading={detailsLoading}
          onClose={() => {
            setDetailsOpen(false);
            setDetailsRun(null);
          }}
        />
      )}
    </div>
  );
}

function StatsCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[#929292]">{label}</p>
        <span className="rounded-lg bg-[#003366]/10 p-2 text-[#003366]">{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-bold text-[#030E18]">{value}</p>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  loading,
  tone = "primary",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: "primary" | "green";
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "inline-flex h-9 items-center gap-1 rounded-lg px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45",
        tone === "green" ? "bg-green-600 hover:bg-green-700" : "bg-[#003366] hover:bg-[#003366]/90"
      )}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
}

function IconButton({
  label,
  children,
  onClick,
  disabled,
  danger,
  loading,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border disabled:cursor-not-allowed disabled:opacity-45",
        danger ? "border-rose-100 text-rose-600 hover:bg-rose-50" : "border-slate-200 text-[#003366] hover:bg-slate-50"
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
}
