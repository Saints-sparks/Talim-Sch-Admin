/**
 * Settings → Data & System: CSV exports of the school's records.
 */
"use client";

import { useState } from "react";
import { toast } from "@/components/CustomToast";
import { getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import {
  downloadAsCsv,
  fetchExportData,
  type ExportType,
} from "@/app/services/school-settings.service";

/** What {@link useDataExport} returns. */
export interface DataExport {
  /** The export currently running, or `null`. */
  exporting: ExportType | null;
  /**
   * Fetches one dataset and saves it as a CSV.
   *
   * @param type - Which dataset to export.
   * @param label - How to name it in messages, e.g. "Students".
   */
  run: (type: ExportType, label: string) => Promise<void>;
}

/**
 * Downloads an export as a CSV, reporting an empty dataset and any failure
 * rather than leaving the card spinning.
 *
 * @returns The running export and the function that starts one.
 */
export function useDataExport(): DataExport {
  const [exporting, setExporting] = useState<ExportType | null>(null);

  const run = async (type: ExportType, label: string) => {
    if (exporting) return;
    setExporting(type);
    try {
      const result = await fetchExportData(type);
      if (!result.data.length) {
        toast.error(result.message || `No ${label.toLowerCase()} data to export`);
        return;
      }
      downloadAsCsv(result.data, `${type}-export-${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success(`${label} exported (${result.count} records)`);
    } catch (err) {
      logger.error("settings/export", `${type} export failed`, err);
      toast.error(getErrorMessage(err, `Failed to export ${label.toLowerCase()}`));
    } finally {
      setExporting(null);
    }
  };

  return { exporting, run };
}
