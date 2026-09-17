"use client";

import type { FeeCategory } from "@/app/services/fees.service";
import type { FeeFormValues } from "@/hooks/fees/feeForm";
import { feeTypeLabel, formatDate, totalCapacity } from "./formatters";
import type { FeeClass } from "./types";
import { brandTextClass, cardClass, headingClass, mutedTextClass } from "./ui";

/**
 * One label/value line in the summary.
 *
 * @param props - The label and its value.
 * @returns The row.
 */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span className={mutedTextClass}>{label}</span>
      <span className="font-medium text-gray-800 dark:text-gray-100 text-right">{children}</span>
    </div>
  );
}

interface FeeSummaryPanelProps {
  values: FeeFormValues;
  categories: FeeCategory[];
  classes: FeeClass[];
  selectedClassIds: Set<string>;
}

/**
 * The live summary beside the create form: what will be saved, and who it
 * will reach.
 *
 * @param props - The form values and the current class selection.
 * @returns The summary panel.
 */
export function FeeSummaryPanel({
  values,
  categories,
  classes,
  selectedClassIds,
}: FeeSummaryPanelProps) {
  const category = categories.find((entry) => entry._id === values.categoryId);
  const selectedClasses = classes.filter((entry) => selectedClassIds.has(entry._id));
  const students = totalCapacity(selectedClasses);

  return (
    <div className={`${cardClass} p-4 space-y-4 sticky top-6`}>
      <h3 className={`font-semibold ${headingClass}`}>Fee Summary</h3>

      <div className="space-y-2 text-sm">
        <Row label="Fee Name">
          <span className="block max-w-[160px] truncate">{values.name || "—"}</span>
        </Row>
        <Row label="Category">
          {category ? (
            <span className="text-xs bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300 px-2 py-0.5 rounded-full">
              {category.name}
            </span>
          ) : (
            "—"
          )}
        </Row>
        <Row label="Fee Type">
          <span className="capitalize">{feeTypeLabel(values.feeType)}</span>
        </Row>
        <Row label="Amount (NGN)">
          <span className={brandTextClass}>
            {values.defaultAmount ? Number(values.defaultAmount).toLocaleString() : "—"}
          </span>
        </Row>
        <Row label="Due Date">{formatDate(values.defaultDueDate)}</Row>
        <Row label="Late Fee">
          {values.lateFeeAmount ? Number(values.lateFeeAmount).toLocaleString() : "—"}
        </Row>
        <Row label="Status">
          <span className="capitalize">{values.status}</span>
        </Row>
      </div>

      {selectedClasses.length > 0 && (
        <>
          <hr className="border-gray-100 dark:border-gray-800" />
          <div className="space-y-2 text-sm">
            <Row label="Assigned Classes">{selectedClasses.length} Classes</Row>
            <div className="space-y-1">
              {selectedClasses.slice(0, 4).map((entry) => (
                <div key={entry._id} className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-[#003366] dark:bg-blue-400" />
                  <span className={`text-xs ${mutedTextClass}`}>
                    {entry.name} ({entry.classCapacity ?? 0} Students)
                  </span>
                </div>
              ))}
              {selectedClasses.length > 4 && (
                <p className="text-xs text-gray-400 dark:text-gray-500 pl-2">
                  +{selectedClasses.length - 4} more classes
                </p>
              )}
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/40 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-300">
            This fee will be assigned to <strong>{students} students</strong>
            <br />
            <span className="text-blue-500 dark:text-blue-400">
              Total students in the selected classes
            </span>
          </div>
        </>
      )}
    </div>
  );
}
