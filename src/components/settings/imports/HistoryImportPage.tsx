"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  ChevronLeft,
  Download,
  FileWarning,
  Loader2,
  RotateCcw,
  Upload,
} from "lucide-react";
import { toast } from "@/components/CustomToast";
import { ApiError, getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import { queryKeys } from "@/lib/queryKeys";
import { saveBlob } from "@/lib/download";
import {
  downloadImportErrors,
  downloadImportTemplate,
  type ImportJob,
} from "@/app/services/imports.service";
import {
  useCommitImport,
  useImportJob,
  useImportJobs,
  useUploadImport,
} from "@/hooks/settings/useHistoryImports";
import {
  Banner,
  CardHeader,
  ConfirmSheet,
  Page,
  PageHeader,
  Pill,
  ScreenError,
  card,
  ghostButton,
  primaryButton,
  quietButton,
  textLink,
} from "@/components/tl";
import { ImportDropzone } from "./ImportDropzone";
import { ImportHistoryList } from "./ImportHistoryList";
import { ImportProgressBar, ImportResultTable, IssueTable, SheetCounts } from "./ImportReport";
import {
  IMPORT_STATUS,
  canCommitImport,
  formatFileSize,
  importStage,
  type ImportStage,
} from "./importState";

/**
 * The words for a refused commit.
 *
 * @param err - What the commit threw.
 * @returns A sentence for the admin.
 */
export function commitErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.meta.code === "IMPORT_IN_PROGRESS") {
      return "Another import for your school is being written. Wait for it to finish, then try again.";
    }
    if (err.meta.code === "IMPORT_NOT_VALID") {
      return "This file can't be imported as it stands. Upload a corrected file and check it again.";
    }
  }
  return getErrorMessage(err, "We couldn't start the import. Please try again.");
}

/**
 * Downloads a file the API produces and saves it, reporting a failure.
 *
 * @param load - Fetches the file.
 * @param what - What it is, for the failure message.
 */
async function download(
  load: () => Promise<{ blob: Blob; fileName: string }>,
  what: string
): Promise<void> {
  try {
    const file = await load();
    saveBlob(file.blob, file.fileName);
  } catch (err) {
    logger.error("settings/import", `${what} download failed`, err);
    toast.error(getErrorMessage(err, `We couldn't download the ${what}.`));
  }
}

/**
 * Settings → Data → Import past records.
 *
 * Template and guide; the upload; the open import, polled while the server
 * checks or writes it (validating → invalid | valid → committing → done |
 * failed); and the school's past imports. School admins only (the route is
 * reserved for the primary admin, as the API is).
 *
 * @returns The page.
 */
export function HistoryImportPage() {
  const client = useQueryClient();
  const [jobId, setJobId] = useState<string | null>(null);
  const [uploadingName, setUploadingName] = useState<string | null>(null);
  const [errorsPage, setErrorsPage] = useState(1);
  const [warningsPage, setWarningsPage] = useState(1);
  const [listPage, setListPage] = useState(1);
  const [confirming, setConfirming] = useState(false);
  const [templateBusy, setTemplateBusy] = useState(false);
  const [csvBusy, setCsvBusy] = useState(false);

  const upload = useUploadImport();
  const commit = useCommitImport();
  const jobQuery = useImportJob({ id: jobId, errorsPage, warningsPage });
  const listQuery = useImportJobs(listPage);
  // A previous import's data stays on screen as a placeholder while the next one loads; ignore it.
  const job: ImportJob | undefined = jobQuery.data?.id === jobId ? jobQuery.data : undefined;
  const stage: ImportStage = importStage(
    upload.isPending,
    job?.status ?? (jobId ? "validating" : null)
  );

  // Once an import has written records, every page that shows them must re-read.
  const settled = useRef<string | null>(null);
  useEffect(() => {
    if (job?.status !== "done" || settled.current === job.id) return;
    settled.current = job.id;
    for (const key of [
      queryKeys.students.all,
      queryKeys.teachers.all,
      queryKeys.parents.all,
      queryKeys.classes.all,
      queryKeys.subjects.all,
      queryKeys.courses.all,
      queryKeys.academic.all,
    ]) {
      void client.invalidateQueries({ queryKey: key });
    }
  }, [client, job?.id, job?.status]);

  const open = (id: string) => {
    setJobId(id);
    setErrorsPage(1);
    setWarningsPage(1);
  };

  const onFile = async (file: File) => {
    setUploadingName(file.name);
    try {
      const accepted = await upload.mutateAsync(file);
      open(accepted.id);
    } catch (err) {
      logger.error("settings/import", "upload failed", err);
      toast.error(getErrorMessage(err, "We couldn't upload the file. Please try again."));
    } finally {
      setUploadingName(null);
    }
  };

  const runCommit = async () => {
    if (!jobId) return;
    try {
      await commit.mutateAsync(jobId);
      setConfirming(false);
    } catch (err) {
      logger.error("settings/import", "commit failed", err);
      setConfirming(false);
      toast.error(commitErrorMessage(err));
    }
  };

  const status = job ? IMPORT_STATUS[job.status] : null;
  const counts = job?.counts;
  // A new file can be chosen whenever nothing is in flight.
  const showUpload = stage !== "uploading" && stage !== "validating" && stage !== "committing";
  const uploadTitle =
    stage === "idle"
      ? "Upload your file"
      : stage === "invalid"
        ? "Upload a corrected file"
        : "Upload another file";

  return (
    <Page>
      <div>
        <Link href="/settings?section=data-system" className={textLink}>
          <ChevronLeft className="h-4 w-4" aria-hidden /> Data &amp; System
        </Link>
      </div>
      <PageHeader
        eyebrowText="Settings · Data"
        title="Import past records"
        subtitle={
          <>
            Bring your school&apos;s past sessions into Talim: classes, subjects, teachers, students
            and every score.
            <br />
            Fill in the template, upload it, fix anything Talim finds, then confirm. Nothing is
            saved until you do.
          </>
        }
        actions={
          <>
            <Link href="/settings/import/guide" className={ghostButton}>
              <BookOpen className="h-4 w-4" aria-hidden /> Read the guide
            </Link>
            <button
              type="button"
              className={primaryButton}
              disabled={templateBusy}
              onClick={async () => {
                setTemplateBusy(true);
                await download(downloadImportTemplate, "template");
                setTemplateBusy(false);
              }}
            >
              {templateBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Download className="h-4 w-4" aria-hidden />
              )}
              Download template
            </button>
          </>
        }
      />

      {showUpload ? (
        <section className={`${card} flex flex-col gap-4`} aria-label="Upload">
          <CardHeader
            title={uploadTitle}
            subtitle="Talim checks every row first and lists any problem with its sheet, row and column."
          />
          <ImportDropzone onFile={onFile} disabled={upload.isPending} />
        </section>
      ) : null}

      {stage === "uploading" ? (
        <section className={card} aria-live="polite">
          <p className="flex items-center gap-2 text-sm font-bold text-tl-ink">
            <Upload className="h-4 w-4 text-tl-brand" aria-hidden /> Uploading{" "}
            {uploadingName ?? "your file"}…
          </p>
          <div className="mt-3">
            <ImportProgressBar progress={undefined} label="Upload" phaseText="Sending the file" />
          </div>
        </section>
      ) : null}

      {jobId && stage !== "uploading" ? (
        <section
          className={`${card} flex flex-col gap-5`}
          aria-label="Import report"
          data-testid="import-job"
        >
          <div>
            <CardHeader
              title={job?.fileName ?? "Your import"}
              subtitle={
                job ? `${formatFileSize(job.fileSize)} · ${stageSentence(stage, job)}` : "Loading…"
              }
              actions={
                status ? (
                  <Pill tone={status.tone} dot>
                    {status.label}
                  </Pill>
                ) : null
              }
            />
          </div>

          {jobQuery.isError && !job ? (
            <ScreenError
              message={getErrorMessage(jobQuery.error, "We couldn't load this import.")}
              onRetry={() => jobQuery.refetch()}
            />
          ) : null}

          {stage === "validating" ? (
            <ImportProgressBar progress={job?.progress} label="Checking the file" />
          ) : null}

          {stage === "invalid" && job ? (
            <Banner
              tone="danger"
              role="alert"
              title={`${job.errorCount.toLocaleString("en")} ${job.errorCount === 1 ? "problem" : "problems"} to fix`}
            >
              Nothing was saved. Fix each row in your file and upload it again.
            </Banner>
          ) : null}

          {stage === "valid" && job ? (
            <Banner
              tone="success"
              title="Every row checked"
              action={
                <button type="button" className={primaryButton} onClick={() => setConfirming(true)}>
                  Import
                </button>
              }
            >
              {job.warningCount > 0
                ? "Read the warnings below, then import. Warnings don't stop the import."
                : "Your file is ready. Import it to add these records to Talim."}
            </Banner>
          ) : null}

          {stage === "committing" ? (
            <ImportProgressBar progress={job?.progress} label="Importing" />
          ) : null}

          {stage === "done" && job ? (
            <Banner tone="success" role="status" title="Imported">
              Your past records are in Talim. Former students can sign in to see their results and
              transcript.
            </Banner>
          ) : null}

          {stage === "failed" && job ? (
            <Banner
              tone="warning"
              role="alert"
              title="The import stopped"
              action={
                <button
                  type="button"
                  className={ghostButton}
                  disabled={commit.isPending}
                  onClick={() => void runCommit()}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />{" "}
                  {commit.isPending ? "Starting…" : "Try again"}
                </button>
              }
            >
              {job.failure ?? "Something went wrong while writing."} Trying again picks up safely
              where it stopped.
            </Banner>
          ) : null}

          {job && stage !== "validating" ? <SheetCounts counts={counts} /> : null}

          {stage === "done" && job ? <ImportResultTable result={job.result} /> : null}

          {job && job.errorCount > 0 ? (
            <IssueTable
              title="Errors"
              issues={job.errors}
              totalCount={job.errorCount}
              onPageChange={setErrorsPage}
              action={
                <button
                  type="button"
                  className={quietButton}
                  disabled={csvBusy}
                  onClick={async () => {
                    setCsvBusy(true);
                    await download(() => downloadImportErrors(job.id), "errors");
                    setCsvBusy(false);
                  }}
                >
                  <FileWarning className="h-4 w-4" aria-hidden /> Download all errors (CSV)
                </button>
              }
            />
          ) : null}

          {job && job.warningCount > 0 ? (
            <IssueTable
              title="Warnings"
              issues={job.warnings}
              totalCount={job.warningCount}
              onPageChange={setWarningsPage}
            />
          ) : null}
        </section>
      ) : null}

      <ImportHistoryList
        data={listQuery.data}
        isPending={listQuery.isPending}
        error={listQuery.isError ? listQuery.error : null}
        onRetry={() => listQuery.refetch()}
        selectedId={jobId}
        onOpen={open}
        page={listPage}
        onPageChange={setListPage}
      />

      <ConfirmSheet
        open={confirming}
        onCancel={() => setConfirming(false)}
        onConfirm={() => void runCommit()}
        eyebrowText="Import past records"
        title="Import these records?"
        body={
          <>
            Talim will add {job?.fileName ?? "this file"} to your school&apos;s records. Past
            sessions are closed and their results published as of each term&apos;s end. Nobody is
            notified or emailed. Importing the same file again later updates these records rather
            than adding them twice.
          </>
        }
        confirmLabel="Import"
        busyLabel="Starting…"
        busy={commit.isPending}
        confirmDisabled={!canCommitImport(job?.status)}
      />
    </Page>
  );
}

/**
 * The line under the open import's name.
 *
 * @param stage - Where it stands.
 * @param job - The import.
 * @returns A short sentence.
 */
function stageSentence(stage: ImportStage, job: ImportJob): string {
  switch (stage) {
    case "validating":
      return "Checking every row…";
    case "invalid":
      return "Checked: needs fixing";
    case "valid":
      return job.warningCount ? `Checked: ${job.warningCount} warnings` : "Checked: no problems";
    case "committing":
      return "Writing your records…";
    case "done":
      return "Imported";
    case "failed":
      return "Stopped while writing";
    default:
      return "";
  }
}

export default HistoryImportPage;
