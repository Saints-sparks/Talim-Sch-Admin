/**
 * Setup steps 7 to 9 — the optional ones: a first announcement, a timetable
 * entry and a first assessment. Each can be skipped without blocking access.
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Clock, Loader2, Megaphone } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "@/components/CustomToast";
import { Tooltip } from "@/components/ui/Tooltip";
import { Field, PrimaryBtn, inputCls } from "@/components/onboarding/OnboardingAtoms";
import { StepCard } from "@/components/onboarding/steps/StepCard";
import { useTerms } from "@/hooks/queries/reference";
import { useSchoolId } from "@/hooks/useSchoolId";
import { api } from "@/lib/apiClient";
import { API_URLS } from "@/app/lib/api/config";
import type { Announcement } from "@/app/services/announcement.service";
import { assessmentService } from "@/app/services/assessment.service";
import { queryKeys, staleTimes } from "@/lib/queryKeys";
import { getErrorMessage } from "@/lib/apiError";

/** The link that lets an optional step be passed over. */
function SkipLink({ onSkip }: { onSkip: () => void }) {
  return (
    <Tooltip content="You can complete this step later from the main app. It won't block your access." side="top">
      <button
        type="button"
        onClick={onSkip}
        className="text-sm text-gray-400 hover:text-gray-600 underline self-center dark:text-slate-500 dark:hover:text-slate-300"
      >
        Skip for now
      </button>
    </Tooltip>
  );
}

// ─── 7. Create Announcement ───────────────────────────────────────────────────

/**
 * @param props.onComplete - Marks the step done.
 * @param props.onSkip - Passes over the step.
 * @returns The announcement step.
 */
export function CreateAnnouncementStep({
  onComplete,
  onSkip,
}: {
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [form, setForm] = useState({ title: "", content: "" });

  const mutation = useMutation({
    // The server takes the sender from the session; no senderId from storage.
    mutationFn: (body: Announcement) => api.post(API_URLS.NOTIFICATION.CREATE_ANNOUNCEMENT, body),
    onSuccess: () => {
      toast.success("Announcement posted!");
      onComplete();
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to post the announcement.")),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Give the announcement a title.");
    if (!form.content.trim()) return toast.error("Write the announcement message.");
    mutation.mutate({ title: form.title.trim(), content: form.content.trim() });
  };

  return (
    <StepCard stepId="create-announcement">
      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        <Field label="Title">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Welcome to the new term!"
            className={inputCls}
            required
          />
        </Field>
        <Field label="Message">
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={4}
            placeholder="Write your announcement here…"
            className={`${inputCls} h-auto`}
            required
          />
        </Field>
        <div className="flex gap-3">
          <PrimaryBtn loading={mutation.isPending}>
            <Megaphone className="h-4 w-4" /> Post Announcement
          </PrimaryBtn>
          <SkipLink onSkip={onSkip} />
        </div>
      </form>
    </StepCard>
  );
}

// ─── 8. Timetable entry ───────────────────────────────────────────────────────

/**
 * @param props.onComplete - Marks the step done.
 * @param props.onSkip - Passes over the step.
 * @returns The timetable step.
 */
export function TimetableStep({
  onComplete,
  onSkip,
}: {
  onComplete: () => void;
  onSkip: () => void;
}) {
  const router = useRouter();
  return (
    <StepCard stepId="timetable-entry">
      <p className="text-sm text-gray-600 mb-6 max-w-sm dark:text-slate-300">
        The timetable builder lets you schedule course sessions by day and time slot. You can drag
        and drop courses into time slots and export to Excel.
      </p>
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => {
            onComplete();
            router.push("/timetable");
          }}
          className="flex items-center gap-2 h-11 px-6 bg-[#003366] hover:bg-[#002244] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Clock className="h-4 w-4" /> Go to Timetable
        </button>
        <SkipLink onSkip={onSkip} />
      </div>
    </StepCard>
  );
}

// ─── 9. Create Assessment ─────────────────────────────────────────────────────

/** The assessment form's fields, matching `CreateAssessmentDto`. */
interface AssessmentForm {
  name: string;
  description: string;
  termId: string;
  startDate: string;
  endDate: string;
}

/**
 * @param props.onComplete - Marks the step done.
 * @param props.onSkip - Passes over the step.
 * @returns The assessment step.
 */
export function CreateAssessmentStep({
  onComplete,
  onSkip,
}: {
  onComplete: () => void;
  onSkip: () => void;
}) {
  const schoolId = useSchoolId();
  const terms = useTerms();
  const [form, setForm] = useState<AssessmentForm>({
    name: "",
    description: "",
    termId: "",
    startDate: "",
    endDate: "",
  });

  // One row is enough to answer "does this school have an assessment yet?".
  const existing = useQuery({
    queryKey: [...queryKeys.academic.all, schoolId ?? "none", "assessments", "probe"] as const,
    queryFn: () => assessmentService.getAssessmentsBySchool(1, 1),
    enabled: Boolean(schoolId),
    staleTime: staleTimes.list,
  });

  const hasAssessments = (existing.data?.assessments?.length ?? 0) > 0;

  useEffect(() => {
    if (hasAssessments) onComplete();
  }, [hasAssessments, onComplete]);

  const mutation = useMutation({
    mutationFn: assessmentService.createAssessment.bind(assessmentService),
    onSuccess: () => {
      toast.success("Assessment created!");
      onComplete();
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to create the assessment.")),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Give the assessment a name.");
    if (!form.termId) return toast.error("Choose the term it belongs to.");
    if (!form.startDate || !form.endDate) return toast.error("Start and end dates are required.");
    if (new Date(form.startDate) >= new Date(form.endDate)) {
      return toast.error("The end date must be after the start date.");
    }
    mutation.mutate({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      termId: form.termId,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      status: "pending",
    });
  };

  const loading = terms.isLoading || existing.isLoading;

  return (
    <StepCard stepId="create-assessment">
      {loading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-gray-500 dark:text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking existing assessments and terms…
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
          {terms.isError && (
            <p role="alert" className="text-xs text-amber-600 dark:text-amber-400">
              Terms could not be loaded.{" "}
              <button type="button" className="font-semibold underline" onClick={() => void terms.refetch()}>
                Try again
              </button>
            </p>
          )}
          <Field label="Assessment name" hint="e.g. Mid-Term Exam">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Mid-Term Exam"
              className={inputCls}
              required
            />
          </Field>
          <Field label="Term">
            <select
              value={form.termId}
              onChange={(e) => setForm({ ...form, termId: e.target.value })}
              className={inputCls}
              required
            >
              <option value="">Select term</option>
              {(terms.data ?? []).map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
            {(terms.data?.length ?? 0) === 0 && !terms.isError && (
              <p className="text-xs text-amber-600 mt-1 dark:text-amber-400">
                No terms yet — finish the &ldquo;Academic Year &amp; Terms&rdquo; step first.
              </p>
            )}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date">
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className={inputCls}
                required
              />
            </Field>
            <Field label="End date">
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className={inputCls}
                required
              />
            </Field>
          </div>
          <div className="flex gap-3">
            <PrimaryBtn loading={mutation.isPending}>
              <ClipboardList className="h-4 w-4" /> Create Assessment
            </PrimaryBtn>
            <SkipLink onSkip={onSkip} />
          </div>
        </form>
      )}
    </StepCard>
  );
}
