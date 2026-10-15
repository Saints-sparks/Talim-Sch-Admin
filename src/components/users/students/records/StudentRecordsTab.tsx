"use client";

import React, { useEffect, useState } from "react";
import { FileText, Printer, ShieldCheck } from "lucide-react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { StudentTranscript, TranscriptIssue } from "@/app/services/student.service";
import { useIssueTranscript } from "@/hooks/users/useStudents";
import { toast } from "@/components/CustomToast";
import { ApiError, getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import {
  Banner,
  CardHeader,
  EmptyNote,
  ScreenError,
  ScreenLoading,
  ghostButton,
  primaryButton,
} from "@/components/tl";
import { TranscriptView } from "./TranscriptView";
import { termCount } from "./transcriptFormat";

/** Props for {@link StudentRecordsTab}. */
export interface StudentRecordsTabProps {
  /** The student record id. */
  studentId: string;
  /** The transcript query (the profile also reads the student's status from it). */
  transcriptQuery: UseQueryResult<StudentTranscript>;
}

/**
 * The profile's Records tab: this school's part of the student's transcript
 * (`GET /students/:id/transcript`), for current and former students alike,
 * with "Issue transcript" (a verification code, its link and a QR) and a
 * printable view. Printing prints the transcript alone (`data-print-root`).
 *
 * @param props - See {@link StudentRecordsTabProps}.
 * @param props.studentId - The student.
 * @param props.transcriptQuery - The transcript.
 * @returns The tab.
 */
export function StudentRecordsTab({ studentId, transcriptQuery }: StudentRecordsTabProps) {
  const issueMutation = useIssueTranscript();
  const [issue, setIssue] = useState<TranscriptIssue | null>(null);
  const [printWhenReady, setPrintWhenReady] = useState(false);

  // Print once the issued code is on the page, so the printout carries it.
  useEffect(() => {
    if (!printWhenReady || !issue) return;
    setPrintWhenReady(false);
    window.print();
  }, [issue, printWhenReady]);

  const runIssue = async (thenPrint: boolean) => {
    try {
      const issued = await issueMutation.mutateAsync(studentId);
      setIssue(issued);
      if (thenPrint) setPrintWhenReady(true);
      else toast.success(`Transcript issued with code ${issued.code}`);
    } catch (err) {
      logger.error("students/records", "transcript issue failed", err);
      toast.error(getErrorMessage(err, "We couldn't issue the transcript. Please try again."));
    }
  };

  if (transcriptQuery.isPending)
    return <ScreenLoading label="Loading records" blocks={2} height={160} />;

  if (transcriptQuery.isError) {
    const error = transcriptQuery.error;
    if (error instanceof ApiError && error.code === "NOT_FOUND") {
      return (
        <EmptyNote icon={<FileText />} title="No records here">
          This student has no records at your school.
        </EmptyNote>
      );
    }
    return (
      <ScreenError
        message={getErrorMessage(error, "We couldn't load this student's records.")}
        onRetry={() => transcriptQuery.refetch()}
      />
    );
  }

  const transcript = transcriptQuery.data;
  if (!transcript) return null;
  const terms = termCount(transcript);

  return (
    <div className="flex flex-col gap-5">
      <div data-print-hide>
        <CardHeader
          title="Records"
          subtitle="Your school's part of this student's transcript: every published term, in order."
          actions={
            terms > 0 ? (
              <>
                {!issue ? (
                  <button
                    type="button"
                    className={ghostButton}
                    disabled={issueMutation.isPending}
                    onClick={() => void runIssue(false)}
                  >
                    <ShieldCheck className="h-4 w-4" aria-hidden />
                    {issueMutation.isPending ? "Issuing…" : "Issue transcript"}
                  </button>
                ) : null}
                <button
                  type="button"
                  className={primaryButton}
                  disabled={issueMutation.isPending}
                  onClick={() => (issue ? window.print() : void runIssue(true))}
                >
                  <Printer className="h-4 w-4" aria-hidden /> Print / Save as PDF
                </button>
              </>
            ) : null
          }
        />
      </div>

      {issue ? (
        <div data-print-hide>
          <Banner tone="success" role="status" title={`Issued with code ${issue.code}`}>
            Anyone can check it at{" "}
            <a
              href={issue.verifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline"
            >
              {issue.verifyUrl}
            </a>
            . The printout carries the code and a QR of this link.
          </Banner>
        </div>
      ) : null}

      {terms === 0 ? (
        <EmptyNote icon={<FileText />} title="No published results yet">
          Terms appear here once their results are published (or imported from past records).
        </EmptyNote>
      ) : (
        <div data-print-root data-print-page="portrait">
          <TranscriptView transcript={transcript} issue={issue} />
        </div>
      )}
    </div>
  );
}

export default StudentRecordsTab;
