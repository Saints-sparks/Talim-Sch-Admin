"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/legacy/image";
import {
  CheckCircle2,
  Circle,
  Lock,
  ArrowRight,
  Loader2,
  Trophy,
  Sparkles,
  CalendarDays,
  Building2,
  UserRound,
  Users,
  BookOpen,
  BookMarked,
  Megaphone,
  Clock,
  ClipboardList,
  LayoutDashboard,
} from "lucide-react";
import { toast } from "@/components/CustomToast";
import { useOnboarding, ONBOARDING_STEPS, OnboardingStepId } from "@/context/OnboardingContext";
import { Tooltip } from "@/components/ui/Tooltip";
import { getSchoolId } from "@/app/services/school.service";
import {
  createAcademicYear,
  createTerm,
  getTerms,
  getAcademicYears,
  type TermResponse,
  type AcademicYearResponse,
} from "@/app/services/academic.service";
import { createClass } from "@/app/services/student.service";
import { getClasses } from "@/app/services/school.service";
import { createSubject, createCourse, getSubjectsBySchool } from "@/app/services/subjects.service";
import { assessmentService } from "@/app/services/assessment.service";
import AddTeacherModal from "@/components/AddTeacherModal";
import AddStudentModal from "@/components/AddStudentModal";
import treelogo from "../../../../public/img/treelogo.svg";

// ─── Step icon map ───────────────────────────────────────────────────────────
const STEP_ICONS: Record<OnboardingStepId, React.ReactNode> = {
  "school-profile": <Building2 className="h-5 w-5" />,
  "personal-profile": <UserRound className="h-5 w-5" />,
  "academic-year": <CalendarDays className="h-5 w-5" />,
  "create-class": <Building2 className="h-5 w-5" />,
  "add-teacher": <UserRound className="h-5 w-5" />,
  "add-student": <Users className="h-5 w-5" />,
  "create-subject": <BookOpen className="h-5 w-5" />,
  "create-course": <BookMarked className="h-5 w-5" />,
  "create-announcement": <Megaphone className="h-5 w-5" />,
  "timetable-entry": <Clock className="h-5 w-5" />,
  "create-assessment": <ClipboardList className="h-5 w-5" />,
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface ClassItem { _id: string; name: string; }
interface SubjectItem { _id: string; name: string; code: string; }

export default function OnboardingSetup() {
  const router = useRouter();
  const { isStepComplete, isStepLocked, markStepComplete, progressPercent, completedCount, totalCount, phase1Completed, isFullyComplete } = useOnboarding();

  const [activeStep, setActiveStep] = useState<OnboardingStepId>("academic-year");

  // Redirect if Phase 1 not done
  useEffect(() => {
    if (!phase1Completed) router.replace("/onboarding");
  }, [phase1Completed, router]);

  // Auto-advance to first incomplete phase-2 step
  useEffect(() => {
    const first = ONBOARDING_STEPS.find(
      (s) => s.phase === 2 && !isStepComplete(s.id) && !isStepLocked(s.id)
    );
    if (first) setActiveStep(first.id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const phase2Steps = ONBOARDING_STEPS.filter((s) => s.phase === 2);

  return (
    <div className="min-h-screen bg-[#F2F2F2] flex flex-col">
      {/* ── Top header ── */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Image src={treelogo} alt="Talim" width={32} height={32} />
          <span className="font-bold text-[#030E18]">School Setup</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
            <span className="font-semibold text-[#003366]">{completedCount}</span>
            <span>/ {totalCount} steps complete</span>
          </div>
          <Tooltip content="Shows how many setup steps you've completed. Required steps must be done before full access is available." side="top">
          <div className="w-32 sm:w-48 bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-[#003366] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          </Tooltip>
          <span className="text-sm font-bold text-[#003366]">{progressPercent}%</span>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 max-w-6xl mx-auto w-full gap-6 p-6">
        {/* Left: step list */}
        <aside className="w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden sticky top-24">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Setup checklist</p>
            </div>
            <ul className="py-2">
              {phase2Steps.map((step) => {
                const done = isStepComplete(step.id);
                const locked = !done && isStepLocked(step.id);
                const active = activeStep === step.id;
                return (
                  <li key={step.id}>
                    <button
                      onClick={() => !locked && setActiveStep(step.id)}
                      disabled={locked}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        active
                          ? "bg-[#EAF2FB] text-[#003366]"
                          : done
                          ? "text-gray-500 hover:bg-gray-50"
                          : locked
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="shrink-0">
                        {done ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : locked ? (
                          <Tooltip content="Complete the required step(s) above before unlocking this one." side="right">
                          <span><Lock className="h-4 w-4 text-gray-300" /></span>
                          </Tooltip>
                        ) : (
                          <Circle className={`h-4 w-4 ${active ? "text-[#003366]" : "text-gray-300"}`} />
                        )}
                      </span>
                      <span className={`text-sm leading-tight ${active ? "font-semibold" : "font-medium"}`}>
                        {step.label}
                      </span>
                      {!step.required && (
                        <span className="ml-auto text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full shrink-0">
                          Optional
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* Right: active step content */}
        <main className="flex-1 min-w-0">
          {isFullyComplete ? (
            <CompletionCard onDashboard={() => router.push("/dashboard")} />
          ) : (
            <StepContent
              stepId={activeStep}
              onComplete={(id) => {
                markStepComplete(id);
                // Advance to next incomplete step
                const remaining = ONBOARDING_STEPS.filter(
                  (s) => s.phase === 2 && s.id !== id && !isStepComplete(s.id) && !isStepLocked(s.id)
                );
                if (remaining.length > 0) setActiveStep(remaining[0].id);
              }}
              onSkip={(id) => {
                markStepComplete(id);
                const remaining = ONBOARDING_STEPS.filter(
                  (s) => s.phase === 2 && s.id !== id && !isStepComplete(s.id) && !isStepLocked(s.id)
                );
                if (remaining.length > 0) setActiveStep(remaining[0].id);
              }}
              isComplete={isStepComplete(activeStep)}
            />
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Step content dispatcher ─────────────────────────────────────────────────
function StepContent({
  stepId,
  onComplete,
  onSkip,
  isComplete,
}: {
  stepId: OnboardingStepId;
  onComplete: (id: OnboardingStepId) => void;
  onSkip: (id: OnboardingStepId) => void;
  isComplete: boolean;
}) {
  const step = ONBOARDING_STEPS.find((s) => s.id === stepId)!;

  if (isComplete) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col items-center text-center gap-4">
        <CheckCircle2 className="h-14 w-14 text-green-500" />
        <div>
          <h2 className="text-xl font-bold text-gray-900">{step.label} — Done!</h2>
          <p className="text-sm text-gray-500 mt-1">{step.description}</p>
        </div>
      </div>
    );
  }

  switch (stepId) {
    case "academic-year": return <AcademicYearStep onComplete={() => onComplete("academic-year")} />;
    case "create-class": return <CreateClassStep onComplete={() => onComplete("create-class")} />;
    case "add-teacher": return <AddTeacherStep onComplete={() => onComplete("add-teacher")} />;
    case "add-student": return <AddStudentStep onComplete={() => onComplete("add-student")} />;
    case "create-subject": return <CreateSubjectStep onComplete={() => onComplete("create-subject")} />;
    case "create-course": return <CreateCourseStep onComplete={() => onComplete("create-course")} />;
    case "create-announcement": return <CreateAnnouncementStep onComplete={() => onComplete("create-announcement")} onSkip={() => onSkip("create-announcement")} />;
    case "timetable-entry": return <TimetableStep onComplete={() => onComplete("timetable-entry")} onSkip={() => onSkip("timetable-entry")} />;
    case "create-assessment": return <CreateAssessmentStep onComplete={() => onComplete("create-assessment")} onSkip={() => onSkip("create-assessment")} />;
    default: return null;
  }
}

// ─── Shared card wrapper ─────────────────────────────────────────────────────
function StepCard({
  stepId,
  children,
}: {
  stepId: OnboardingStepId;
  children: React.ReactNode;
}) {
  const step = ONBOARDING_STEPS.find((s) => s.id === stepId)!;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
        <div className="p-2 bg-[#EAF2FB] rounded-xl text-[#003366]">{STEP_ICONS[stepId]}</div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">{step.label}</h2>
          <p className="text-sm text-gray-500">{step.description}</p>
        </div>
        {!step.required && (
          <span className="ml-auto text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full shrink-0">
            Optional
          </span>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── 1. Academic Year & Term ─────────────────────────────────────────────────
function AcademicYearStep({ onComplete }: { onComplete: () => void }) {
  const [subStep, setSubStep] = useState<"year" | "term">("year");
  const [createdYearId, setCreatedYearId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [detecting, setDetecting] = useState(true);

  const [yearForm, setYearForm] = useState({ year: "", startDate: "", endDate: "", isCurrent: true });
  const [termForm, setTermForm] = useState({ name: "", startDate: "", endDate: "", isCurrent: true });

  // On mount: check if academic year / term already exist from settings or a prior session
  useEffect(() => {
    (async () => {
      try {
        const [years, terms] = await Promise.all([getAcademicYears(), getTerms()]);
        if (terms.length > 0) {
          // Both year and term exist — auto-complete this step
          onComplete();
        } else if (years.length > 0) {
          // Academic year exists but no term yet — skip to term creation
          const current = years.find((y: AcademicYearResponse) => y.isCurrent) ?? years[0];
          setCreatedYearId(current._id);
          setSubStep("term");
        }
      } catch {
        // Network error — let the user fill in manually
      } finally {
        setDetecting(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleYearSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearForm.year || !yearForm.startDate || !yearForm.endDate) {
      toast.error("Please fill in all fields."); return;
    }
    setSubmitting(true);
    try {
      const res = await createAcademicYear(yearForm);
      const yearId = res._id || (res as any).id;
      if (!yearId) throw new Error("Server returned no ID for the academic year. Please try again.");
      setCreatedYearId(yearId);
      setSubStep("term");
      toast.success("Academic year created! Now add your first term.");
    } catch (err: any) {
      toast.error(err.message || "Failed to create academic year.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTermSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termForm.name || !termForm.startDate || !termForm.endDate) {
      toast.error("Please fill in all fields."); return;
    }
    if (!createdYearId) {
      toast.error("Session error — go back to step 1 and re-create the academic year."); return;
    }
    setSubmitting(true);
    try {
      await createTerm({ ...termForm, academicYearId: createdYearId });
      toast.success("Term created! Academic year setup complete.");
      onComplete();
    } catch (err: any) {
      toast.error(err.message || "Failed to create term.");
    } finally {
      setSubmitting(false);
    }
  };

  if (detecting) {
    return (
      <StepCard stepId="academic-year">
        <div className="flex items-center gap-3 py-4 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking existing data…
        </div>
      </StepCard>
    );
  }

  return (
    <StepCard stepId="academic-year">
      {/* Sub-step indicator */}
      <div className="flex items-center gap-2 mb-6">
        <SubStepBadge num={1} active={subStep === "year"} done={subStep === "term"} label="Academic Year" />
        <div className="flex-1 h-0.5 bg-gray-200">
          <div className={`h-full bg-[#003366] transition-all duration-500 ${subStep === "term" ? "w-full" : "w-0"}`} />
        </div>
        <SubStepBadge num={2} active={subStep === "term"} done={false} label="First Term" />
      </div>

      {subStep === "year" ? (
        <form onSubmit={handleYearSubmit} className="space-y-4 max-w-sm">
          <Tooltip content='Example: "2025/2026". This groups all your terms, assessments, and timetables for the school year.' side="right">
          <Field label="Academic year name" hint="e.g. 2024/2025">
            <input value={yearForm.year} onChange={(e) => setYearForm({ ...yearForm, year: e.target.value })}
              placeholder="2024/2025" className={inputCls} required />
          </Field>
          </Tooltip>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date">
              <input type="date" value={yearForm.startDate} onChange={(e) => setYearForm({ ...yearForm, startDate: e.target.value })} className={inputCls} required />
            </Field>
            <Field label="End date">
              <input type="date" value={yearForm.endDate} onChange={(e) => setYearForm({ ...yearForm, endDate: e.target.value })} className={inputCls} required />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={yearForm.isCurrent} onChange={(e) => setYearForm({ ...yearForm, isCurrent: e.target.checked })} className="rounded" />
            Set as current academic year
          </label>
          <PrimaryBtn loading={submitting}>Create Academic Year <ArrowRight className="h-4 w-4" /></PrimaryBtn>
        </form>
      ) : (
        <form onSubmit={handleTermSubmit} className="space-y-4 max-w-sm">
          <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
            Academic year created. Now add your first term.
          </p>
          <Tooltip content='Example: "First Term" or "Spring Term". Set it as the current term once created.' side="right">
          <Field label="Term name" hint="e.g. First Term">
            <input value={termForm.name} onChange={(e) => setTermForm({ ...termForm, name: e.target.value })}
              placeholder="First Term" className={inputCls} required />
          </Field>
          </Tooltip>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date">
              <input type="date" value={termForm.startDate} onChange={(e) => setTermForm({ ...termForm, startDate: e.target.value })} className={inputCls} required />
            </Field>
            <Field label="End date">
              <input type="date" value={termForm.endDate} onChange={(e) => setTermForm({ ...termForm, endDate: e.target.value })} className={inputCls} required />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={termForm.isCurrent} onChange={(e) => setTermForm({ ...termForm, isCurrent: e.target.checked })} className="rounded" />
            Set as current term
          </label>
          <PrimaryBtn loading={submitting}><CheckCircle2 className="h-4 w-4" /> Create Term & Finish</PrimaryBtn>
        </form>
      )}
    </StepCard>
  );
}

const GRADE_LEVELS = Array.from({ length: 15 }, (_, i) => `Grade ${i + 1}`);

// ─── 2. Create Class ─────────────────────────────────────────────────────────
function CreateClassStep({ onComplete }: { onComplete: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", gradeLevel: "", classCapacity: "", classDescription: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Class name is required."); return; }
    if (!form.gradeLevel) { toast.error("Please select a grade level."); return; }
    setSubmitting(true);
    try {
      await createClass(form);
      toast.success("Class created successfully!");
      onComplete();
    } catch (err: any) {
      toast.error(err.message || "Failed to create class.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StepCard stepId="create-class">
      <p className="text-sm text-gray-500 mb-4 max-w-sm">
        A class groups students of the same grade together. You can have multiple classes per grade — e.g. <span className="font-medium">Grade 7A</span> and <span className="font-medium">Grade 7B</span>.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        <Field label="Grade level">
          <select value={form.gradeLevel} onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })} className={inputCls} required>
            <option value="">Select grade…</option>
            {GRADE_LEVELS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
        <Tooltip content='The class name identifies this specific group within the grade — e.g. "Grade 7A" or "Grade 7 Gold".' side="right">
        <Field label="Class name" hint="e.g. Grade 7A">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Grade 7A" className={inputCls} required />
        </Field>
        </Tooltip>
        <Tooltip content="Maximum number of students that can be enrolled in this class." side="right">
        <Field label="Capacity" hint="Maximum number of students">
          <input type="number" value={form.classCapacity} onChange={(e) => setForm({ ...form, classCapacity: e.target.value })} placeholder="30" className={inputCls} />
        </Field>
        </Tooltip>
        <Field label="Description (optional)">
          <textarea value={form.classDescription} onChange={(e) => setForm({ ...form, classDescription: e.target.value })} placeholder="Brief description…" rows={3} className={inputCls} />
        </Field>
        <PrimaryBtn loading={submitting}><CheckCircle2 className="h-4 w-4" /> Create Class</PrimaryBtn>
      </form>
    </StepCard>
  );
}

// ─── 3. Add Teacher ──────────────────────────────────────────────────────────
function AddTeacherStep({ onComplete }: { onComplete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <StepCard stepId="add-teacher">
      <p className="text-sm text-gray-600 mb-6 max-w-sm">
        Register a teacher account. They will receive a login email and can be assigned to classes and courses.
      </p>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-11 px-6 bg-[#003366] hover:bg-[#002244] text-white text-sm font-semibold rounded-lg transition-colors"
      >
        <UserRound className="h-4 w-4" /> Add Teacher
      </button>
      {open && (
        <AddTeacherModal
          onClose={() => setOpen(false)}
          onSuccess={async () => {
            setOpen(false);
            toast.success("Teacher added!");
            onComplete();
          }}
        />
      )}
    </StepCard>
  );
}

// ─── 4. Add Student ──────────────────────────────────────────────────────────
function AddStudentStep({ onComplete }: { onComplete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <StepCard stepId="add-student">
      <p className="text-sm text-gray-600 mb-6 max-w-sm">
        Enrol your first student and assign them to a class. You can always add more from the Students section.
      </p>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-11 px-6 bg-[#003366] hover:bg-[#002244] text-white text-sm font-semibold rounded-lg transition-colors"
      >
        <Users className="h-4 w-4" /> Add Student
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <AddStudentModal
              onClose={() => {
                setOpen(false);
                onComplete();
              }}
            />
          </div>
        </div>
      )}
    </StepCard>
  );
}

// ─── 5. Create Subject ───────────────────────────────────────────────────────
function CreateSubjectStep({ onComplete }: { onComplete: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", code: "" });
  const schoolId = getSchoolId() ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) { toast.error("Name and code are required."); return; }
    setSubmitting(true);
    try {
      await createSubject({ name: form.name.trim(), code: form.code.trim(), schoolId });
      toast.success("Subject created!");
      onComplete();
    } catch (err: any) {
      toast.error(err.message || "Failed to create subject.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StepCard stepId="create-subject">
      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        <Field label="Subject name" hint="e.g. Mathematics">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Mathematics" className={inputCls} required />
        </Field>
        <Field label="Subject code" hint="e.g. MATH101">
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="MATH101" className={inputCls} required />
        </Field>
        <PrimaryBtn loading={submitting}><CheckCircle2 className="h-4 w-4" /> Create Subject</PrimaryBtn>
      </form>
    </StepCard>
  );
}

// ─── 6. Create Course ────────────────────────────────────────────────────────
function CreateCourseStep({ onComplete }: { onComplete: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [form, setForm] = useState({ title: "", description: "", courseCode: "", subjectId: "", classId: "" });

  useEffect(() => {
    Promise.all([getClasses(), getSubjectsBySchool()])
      .then(([cls, subs]) => {
        setClasses(cls);
        setSubjects(subs);
        if (subs.length > 0) setForm((f) => ({ ...f, subjectId: subs[0]._id }));
        if (cls.length > 0) setForm((f) => ({ ...f, classId: cls[0]._id }));
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.subjectId || !form.classId) {
      toast.error("Title, subject and class are required."); return;
    }
    setSubmitting(true);
    try {
      const schoolId = getSchoolId() ?? "";
      await createCourse({ title: form.title, description: form.description, courseCode: form.courseCode, subjectId: form.subjectId, classId: form.classId, schoolId } as any);
      toast.success("Course created!");
      onComplete();
    } catch (err: any) {
      toast.error(err.message || "Failed to create course.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StepCard stepId="create-course">
      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        <Field label="Course title" hint="e.g. Advanced Mathematics">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Advanced Mathematics" className={inputCls} required />
        </Field>
        <Field label="Course code" hint="Optional">
          <input value={form.courseCode} onChange={(e) => setForm({ ...form, courseCode: e.target.value.toUpperCase() })} placeholder="ADV-MATH" className={inputCls} />
        </Field>
        <Field label="Subject">
          <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className={inputCls} required>
            <option value="">Select subject</option>
            {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="Assign to class">
          <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className={inputCls} required>
            <option value="">Select class</option>
            {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Description (optional)">
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Brief description…" className={inputCls} />
        </Field>
        <PrimaryBtn loading={submitting}><CheckCircle2 className="h-4 w-4" /> Create Course</PrimaryBtn>
      </form>
    </StepCard>
  );
}

// ─── 7. Create Announcement ──────────────────────────────────────────────────
function CreateAnnouncementStep({ onComplete, onSkip }: { onComplete: () => void; onSkip: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", content: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) { toast.error("Title and content are required."); return; }
    setSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken") ?? "";
      const user = JSON.parse(localStorage.getItem("user") ?? "{}");
      const { API_ENDPOINTS } = await import("@/app/lib/api/config");
      const res = await fetch(API_ENDPOINTS.CREATE_ANNOUNCEMENT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: form.title.trim(), content: form.content.trim(), senderId: user.userId }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Announcement posted!");
      onComplete();
    } catch {
      toast.error("Failed to post announcement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StepCard stepId="create-announcement">
      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        <Field label="Title">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Welcome to the new term!" className={inputCls} required />
        </Field>
        <Field label="Message">
          <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} placeholder="Write your announcement here…" className={inputCls} required />
        </Field>
        <div className="flex gap-3">
          <PrimaryBtn loading={submitting}><Megaphone className="h-4 w-4" /> Post Announcement</PrimaryBtn>
          <Tooltip content="You can complete this step later from the main app. It won't block your access." side="top"><button type="button" onClick={onSkip} className="text-sm text-gray-400 hover:text-gray-600 underline">Skip for now</button></Tooltip>
        </div>
      </form>
    </StepCard>
  );
}

// ─── 8. Timetable Entry ──────────────────────────────────────────────────────
function TimetableStep({ onComplete, onSkip }: { onComplete: () => void; onSkip: () => void }) {
  const router = useRouter();
  return (
    <StepCard stepId="timetable-entry">
      <p className="text-sm text-gray-600 mb-6 max-w-sm">
        The timetable builder lets you schedule course sessions by day and time slot. You can drag and drop courses into time slots and export to Excel.
      </p>
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => { onComplete(); router.push("/timetable"); }}
          className="flex items-center gap-2 h-11 px-6 bg-[#003366] hover:bg-[#002244] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Clock className="h-4 w-4" /> Go to Timetable
        </button>
        <button onClick={onSkip} className="text-sm text-gray-400 hover:text-gray-600 underline self-center">
          Skip for now
        </button>
      </div>
    </StepCard>
  );
}

// ─── 9. Create Assessment ────────────────────────────────────────────────────
function CreateAssessmentStep({ onComplete, onSkip }: { onComplete: () => void; onSkip: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [terms, setTerms] = useState<TermResponse[]>([]);
  const [form, setForm] = useState({ name: "", description: "", termId: "", startDate: "", endDate: "", status: "pending" as const });

  useEffect(() => {
    getTerms().then(setTerms).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.termId) { toast.error("Name and term are required."); return; }
    setSubmitting(true);
    try {
      await assessmentService.createAssessment(form);
      toast.success("Assessment created!");
      onComplete();
    } catch (err: any) {
      toast.error(err.message || "Failed to create assessment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StepCard stepId="create-assessment">
      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        <Field label="Assessment name" hint="e.g. Mid-Term Exam">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Mid-Term Exam" className={inputCls} required />
        </Field>
        <Field label="Term">
          <select value={form.termId} onChange={(e) => setForm({ ...form, termId: e.target.value })} className={inputCls} required>
            <option value="">Select term</option>
            {terms.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date">
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={inputCls} />
          </Field>
          <Field label="End date">
            <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={inputCls} />
          </Field>
        </div>
        <div className="flex gap-3">
          <PrimaryBtn loading={submitting}><ClipboardList className="h-4 w-4" /> Create Assessment</PrimaryBtn>
          <Tooltip content="You can complete this step later from the main app. It won't block your access." side="top"><button type="button" onClick={onSkip} className="text-sm text-gray-400 hover:text-gray-600 underline">Skip for now</button></Tooltip>
        </div>
      </form>
    </StepCard>
  );
}

// ─── Completion card ─────────────────────────────────────────────────────────
function CompletionCard({ onDashboard }: { onDashboard: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-10 flex flex-col items-center text-center gap-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-[#EAF2FB] flex items-center justify-center">
          <Trophy className="h-10 w-10 text-[#003366]" />
        </div>
        <Sparkles className="h-6 w-6 text-yellow-400 absolute -top-1 -right-1" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">You're all set!</h2>
        <p className="text-gray-500 mt-2 max-w-sm">
          Your school is fully configured. You can manage everything from the dashboard or come back to any section at any time.
        </p>
      </div>
      <button
        onClick={onDashboard}
        className="flex items-center gap-2 h-12 px-8 bg-[#003366] hover:bg-[#002244] text-white font-semibold rounded-xl transition-colors"
      >
        <LayoutDashboard className="h-5 w-5" /> Go to Dashboard
      </button>
    </div>
  );
}

// ─── Shared small components ─────────────────────────────────────────────────
const inputCls =
  "w-full h-10 px-3 border border-[#E5E7EB] bg-[#F9FAFB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/30 focus:border-[#003366] transition-all";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#030E18] mb-1.5">
        {label}{hint && <span className="text-gray-400 font-normal ml-1">— {hint}</span>}
      </label>
      {children}
    </div>
  );
}

function PrimaryBtn({ loading, children, ...rest }: { loading?: boolean; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex items-center gap-2 h-11 px-6 bg-[#003366] hover:bg-[#002244] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
}

function SubStepBadge({ num, active, done, label }: { num: number; active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${done ? "bg-green-500 text-white" : active ? "bg-[#003366] text-white" : "border-2 border-gray-300 text-gray-400"}`}>
        {done ? "✓" : num}
      </div>
      <span className={`text-xs font-medium ${active ? "text-[#003366]" : "text-gray-400"}`}>{label}</span>
    </div>
  );
}
