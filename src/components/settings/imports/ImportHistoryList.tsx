"use client";

import React from "react";
import { ChevronLeft, ChevronRight, History } from "lucide-react";
import type { ImportJobList } from "@/app/services/imports.service";
import { getErrorMessage } from "@/lib/apiError";
import { formatDateTime } from "@/components/finance/formatters";
import {
  CardHeader,
  EmptyNote,
  Pill,
  ScreenError,
  ScreenLoading,
  card,
  cardFrame,
  iconButton,
  rowButton,
  table,
  tableScroll,
  td,
  th,
  theadRow,
  tr,
} from "@/components/tl";
import { IMPORT_STATUS, formatFileSize } from "./importState";

/** Props for {@link ImportHistoryList}. */
export interface ImportHistoryListProps {
  /** The page of imports, once loaded. */
  data: ImportJobList | undefined;
  isPending: boolean;
  error: unknown;
  onRetry: () => void;
  /** The import open above, marked in the list. */
  selectedId: string | null;
  /** Opens an import. */
  onOpen: (id: string) => void;
  /** 1-based page. */
  page: number;
  onPageChange: (page: number) => void;
}

/**
 * The school's past imports, newest first: the file, its status and when it
 * was uploaded and finished, with "Open" to see its report.
 *
 * @param props - See {@link ImportHistoryListProps}.
 * @param props.data - The page.
 * @param props.isPending - Whether it is loading.
 * @param props.error - The load error, if any.
 * @param props.onRetry - Reloads it.
 * @param props.selectedId - The open import.
 * @param props.onOpen - Opens one.
 * @param props.page - The page number.
 * @param props.onPageChange - Page handler.
 * @returns The card.
 */
export function ImportHistoryList({
  data,
  isPending,
  error,
  onRetry,
  selectedId,
  onOpen,
  page,
  onPageChange,
}: ImportHistoryListProps) {
  const items = data?.items ?? [];
  const pages = data ? Math.max(1, Math.ceil(data.total / Math.max(1, data.limit))) : 1;

  return (
    <section className={`${card} flex flex-col gap-4`} aria-label="Past imports">
      <CardHeader
        title="Past imports"
        subtitle="Every file uploaded for this school, newest first."
      />
      {isPending ? (
        <ScreenLoading label="Loading past imports" blocks={1} height={120} />
      ) : error ? (
        <ScreenError
          message={getErrorMessage(error, "We couldn't load the past imports.")}
          onRetry={onRetry}
        />
      ) : items.length === 0 ? (
        <EmptyNote icon={<History />} title="No imports yet" compact>
          Files you upload are listed here with their status.
        </EmptyNote>
      ) : (
        <>
          <div className={cardFrame}>
            <div className={tableScroll}>
              <table className={`${table} min-w-[640px]`}>
                <thead>
                  <tr className={theadRow}>
                    <th scope="col" className={th}>
                      File
                    </th>
                    <th scope="col" className={th}>
                      Status
                    </th>
                    <th scope="col" className={th}>
                      Uploaded
                    </th>
                    <th scope="col" className={th}>
                      Finished
                    </th>
                    <th scope="col" className={th}>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((job) => {
                    const status = IMPORT_STATUS[job.status] ?? {
                      label: job.status,
                      tone: "muted" as const,
                    };
                    const open = job.id === selectedId;
                    return (
                      <tr key={job.id} className={`${tr} ${open ? "bg-tl-select" : ""}`}>
                        <td className={td}>
                          <span
                            className="block max-w-[260px] truncate font-bold text-tl-ink"
                            title={job.fileName}
                          >
                            {job.fileName}
                          </span>
                          <span className="text-xs text-tl-muted">
                            {formatFileSize(job.fileSize)}
                          </span>
                        </td>
                        <td className={td}>
                          <Pill tone={status.tone} dot>
                            {status.label}
                          </Pill>
                        </td>
                        <td className={`${td} whitespace-nowrap`}>
                          {formatDateTime(job.createdAt)}
                        </td>
                        <td className={`${td} whitespace-nowrap`}>
                          {formatDateTime(job.finishedAt)}
                        </td>
                        <td className={`${td} text-right`}>
                          <button
                            type="button"
                            className={rowButton}
                            aria-current={open ? "true" : undefined}
                            aria-label={`View ${job.fileName}`}
                            onClick={() => onOpen(job.id)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {pages > 1 ? (
            <nav
              aria-label="Past imports pages"
              className="flex items-center justify-end gap-2 text-[13px] text-tl-muted"
            >
              <span className="tabular-nums">
                Page {page} of {pages}
              </span>
              <button
                type="button"
                className={iconButton}
                aria-label="Newer imports"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                className={iconButton}
                aria-label="Older imports"
                disabled={page >= pages}
                onClick={() => onPageChange(page + 1)}
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </nav>
          ) : null}
        </>
      )}
    </section>
  );
}

export default ImportHistoryList;
