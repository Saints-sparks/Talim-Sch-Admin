"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import {
  type SearchSchoolResult,
} from "@/app/services/transit.service";
import { useCreateTransfer } from "@/hooks/transit/useTransfers";
import { useSchoolStudents, type StudentOption } from "@/hooks/transit/useTransitReference";
import { useStudentSnapshot } from "@/hooks/transit/useStudentSnapshot";
import { toast } from "@/components/CustomToast";
import { getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { text } from "@/components/transit/ui";
import { TransferWizardShell } from "@/components/transit/TransferWizard";
import { StudentPicker } from "@/components/transit/StudentPicker";
import { SchoolPicker } from "@/components/transit/SchoolPicker";
import { StudentSnapshotCard } from "@/components/transit/StudentSnapshotCard";
import { ReviewRow } from "@/components/transit/ReviewRow";

/** The wizard's steps, in order. */
const STEPS = ["Select Student", "Select Target School", "Review", "Confirm"];

/**
 * Push transfer: this school releases one of its own students to another
 * Talim school.
 *
 * Creating the request is itself the release — the API records the source
 * approval on creation — so the student's record travels with it and the
 * receiving school picks the class and academic year on acceptance.
 */
export default function SourceTransferWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [student, setStudent] = useState<StudentOption | null>(null);
  const [school, setSchool] = useState<SearchSchoolResult | null>(null);
  const [reason, setReason] = useState("");

  const students = useSchoolStudents();
  const snapshot = useStudentSnapshot(student?._id ?? null);
  const createTransfer = useCreateTransfer();

  async function submit() {
    if (!student || !school) return;
    try {
      await createTransfer.mutateAsync({
        studentId: student._id,
        targetSchoolId: school._id,
        reason: reason.trim() || undefined,
        initiatedBy: "source",
      });
      toast.success("Transfer request submitted");
      router.push("/transit/transfers");
    } catch (err) {
      logger.error("transit", "push transfer submit failed", err);
      toast.error(getErrorMessage(err, "Couldn't submit the transfer request"));
    }
  }

  const canContinue = [Boolean(student), Boolean(school), true, Boolean(student && school)][step];

  return (
    <TransferWizardShell
      title="Push Transfer"
      description="Transfer a student from your school to another Talim school"
      steps={STEPS}
      step={step}
      onStepChange={setStep}
      canContinue={Boolean(canContinue)}
      submitting={createTransfer.isPending}
      submitLabel="Submit Transfer"
      onSubmit={submit}
      onExit={() => router.push("/transit/transfers")}
    >
      {step === 0 && (
        <div className="space-y-4">
          <StudentPicker
            students={students.data ?? []}
            isLoading={students.isLoading}
            isError={students.isError}
            error={students.error}
            onRetry={() => students.refetch()}
            selectedId={student?._id}
            onSelect={setStudent}
          />
          {student && (
            <StudentSnapshotCard snapshot={snapshot.data} isLoading={snapshot.isLoading} />
          )}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <SchoolPicker
            placeholder="Search for a school..."
            selected={school}
            onSelect={setSchool}
          />
          <div>
            <label htmlFor="push-reason" className={cn("block text-xs font-medium mb-2", text.muted)}>
              Reason for Transfer <span className="font-normal">(optional)</span>
            </label>
            <textarea
              id="push-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              placeholder="Enter the reason for transferring this student..."
              className="w-full px-3 py-2.5 text-sm rounded-lg resize-none border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#030E18] dark:text-slate-100 focus:outline-none focus:border-[#003366] dark:focus:border-sky-500 transition-colors"
            />
          </div>
        </div>
      )}

      {step === 2 && student && school && (
        <div className="space-y-4">
          <div className="rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-slate-800/50">
            <ReviewRow label="Student" value={`${student.firstName} ${student.lastName}`.trim()} />
            <ReviewRow label="Target School" value={school.name} />
            {reason && <ReviewRow label="Reason" value={reason} />}
          </div>
          <p className={cn("text-sm", text.muted)}>
            Submitting this request releases the student to {school.name} and sends their academic
            record with it. They stay enrolled here until the receiving school accepts, and that
            school assigns the class and academic year.
          </p>
        </div>
      )}

      {step === 3 && (
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-green-100 dark:bg-green-500/15">
            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className={cn("text-lg font-semibold", text.strong)}>Ready to Submit</h3>
            <p className={cn("text-sm mt-1", text.muted)}>
              Submit to send the transfer request to {school?.name}
            </p>
          </div>
        </div>
      )}
    </TransferWizardShell>
  );
}
