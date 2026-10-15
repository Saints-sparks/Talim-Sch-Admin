/**
 * Settings → Data → Import past records: the school's imports, one import
 * (polled while the server works on it), the upload and the commit.
 */
"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { staleTimes } from "@/lib/queryKeys";
import { useSchoolId } from "@/hooks/useSchoolId";
import { settingsKeys } from "@/hooks/settings/keys";
import {
  commitImport,
  getImport,
  listImports,
  uploadImport,
  type ImportJob,
  type ImportJobAccepted,
  type ImportJobList,
} from "@/app/services/imports.service";
import { IMPORT_POLL_MS, isImportRunning } from "@/components/settings/imports/importState";

/** Imports per page of the list. */
export const IMPORT_LIST_PAGE_SIZE = 10;

/**
 * A page of the school's imports, newest first. Re-read every few seconds
 * while any import on it is still running, so its status badge moves.
 *
 * @param page - 1-based page.
 * @returns Query result.
 */
export function useImportJobs(page: number): UseQueryResult<ImportJobList> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: settingsKeys.importList(schoolId ?? "none", page),
    queryFn: () => listImports(page, IMPORT_LIST_PAGE_SIZE),
    enabled: Boolean(schoolId),
    staleTime: staleTimes.list,
    placeholderData: keepPreviousData,
    refetchInterval: (query) =>
      query.state.data?.items.some((job) => isImportRunning(job.status))
        ? IMPORT_POLL_MS * 2
        : false,
  });
}

/** Which import to read, and which page of its errors and warnings. */
export interface ImportJobParams {
  /** The import, or `null` while none is open. */
  id: string | null;
  /** Page of errors. */
  errorsPage: number;
  /** Page of warnings. */
  warningsPage: number;
}

/**
 * One import with its report. Polled every two seconds while it is being
 * checked or written, and left alone once it settles.
 *
 * @param params - See {@link ImportJobParams}.
 * @returns Query result.
 */
export function useImportJob({
  id,
  errorsPage,
  warningsPage,
}: ImportJobParams): UseQueryResult<ImportJob> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: settingsKeys.importJob(schoolId ?? "none", id ?? "none", errorsPage, warningsPage),
    queryFn: () => getImport(id as string, errorsPage, warningsPage),
    enabled: Boolean(schoolId && id),
    staleTime: staleTimes.live,
    placeholderData: keepPreviousData,
    refetchInterval: (query) =>
      isImportRunning(query.state.data?.status) ? IMPORT_POLL_MS : false,
    refetchIntervalInBackground: false,
  });
}

/**
 * Uploads a pack. The list is refreshed so the new import appears at its top.
 *
 * @returns Mutation taking the file, resolving to the new import's id.
 */
export function useUploadImport(): UseMutationResult<ImportJobAccepted, Error, File> {
  const client = useQueryClient();
  const schoolId = useSchoolId();
  return useMutation({
    mutationFn: (file: File) => uploadImport(file),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: settingsKeys.imports(schoolId ?? "none") });
    },
  });
}

/**
 * Commits a valid import (or resumes a failed one). Every cached view of the
 * school's imports is refreshed, which restarts the open import's polling.
 *
 * @returns Mutation taking the import id.
 */
export function useCommitImport(): UseMutationResult<ImportJobAccepted, Error, string> {
  const client = useQueryClient();
  const schoolId = useSchoolId();
  return useMutation({
    mutationFn: (id: string) => commitImport(id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: settingsKeys.imports(schoolId ?? "none") });
    },
  });
}
