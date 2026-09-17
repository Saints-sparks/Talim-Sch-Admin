"use client";

import type { FeeItem } from "@/app/services/fees.service";
import { overrideFor, type OverrideMap } from "@/hooks/fees/assignWizard";
import { feeTypeLabel, formatDate, formatNaira, totalCapacity } from "../formatters";
import type { FeeClass } from "../types";
import {
  brandTextClass,
  cardClass,
  headingClass,
  mutedTextClass,
  tableBodyClass,
  tableHeadClass,
  tableRowClass,
  tableScrollClass,
} from "../ui";

interface ReviewStepProps {
  fee: FeeItem;
  classes: FeeClass[];
  selectedClassIds: Set<string>;
  overrides: OverrideMap;
  totalAmount: number;
  academicYearLabel: string;
  termLabel: string;
}

/**
 * Step 4: everything that is about to be charged, class by class.
 *
 * @param props - The fee, the selection, the drafts and the period labels.
 * @returns The step.
 */
export function ReviewStep({
  fee,
  classes,
  selectedClassIds,
  overrides,
  totalAmount,
  academicYearLabel,
  termLabel,
}: ReviewStepProps) {
  const selected = classes.filter((entry) => selectedClassIds.has(entry._id));
  const students = totalCapacity(selected);

  const facts = [
    { label: "Fee Name", value: fee.name },
    { label: "Academic Year", value: academicYearLabel },
    { label: "Term", value: termLabel },
    { label: "Fee Type", value: feeTypeLabel(fee.feeType) },
    { label: "Total Expected", value: formatNaira(totalAmount) },
    { label: "Total Students", value: String(students) },
  ];

  return (
    <div className={`${cardClass} p-6 space-y-5`}>
      <div>
        <h2 className={`font-semibold ${headingClass}`}>4. Review &amp; Confirm</h2>
        <p className={`text-xs mt-0.5 ${mutedTextClass}`}>
          Check the details before assigning this fee.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3 text-sm">
          {facts.map((fact) => (
            <div key={fact.label} className="flex justify-between gap-3">
              <span className={mutedTextClass}>{fact.label}</span>
              <span
                className={`font-medium text-right capitalize ${
                  fact.label === "Total Expected"
                    ? `font-bold ${brandTextClass}`
                    : "text-gray-800 dark:text-gray-100"
                }`}
              >
                {fact.value}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <p className={`text-xs font-medium uppercase tracking-wide ${mutedTextClass}`}>
            Classes ({selected.length})
          </p>
          <div className={tableScrollClass}>
            <table className="w-full text-xs">
              <thead className={tableHeadClass}>
                <tr>
                  <th className={`text-left px-3 py-2 ${mutedTextClass}`}>Class</th>
                  <th className={`text-left px-3 py-2 ${mutedTextClass}`}>Students</th>
                  <th className={`text-left px-3 py-2 ${mutedTextClass}`}>Amount</th>
                  <th className={`text-left px-3 py-2 ${mutedTextClass}`}>Due Date</th>
                </tr>
              </thead>
              <tbody className={tableBodyClass}>
                {selected.map((cls) => {
                  const draft = overrideFor(overrides, fee, cls._id);
                  return (
                    <tr key={cls._id} className={tableRowClass}>
                      <td className="px-3 py-2 font-medium text-gray-700 dark:text-gray-200">
                        {cls.name}
                      </td>
                      <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                        {cls.classCapacity ?? 0}
                      </td>
                      <td className={`px-3 py-2 font-medium ${brandTextClass}`}>
                        {formatNaira(Number(draft.amount) || 0)}
                      </td>
                      <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                        {formatDate(draft.dueDate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
