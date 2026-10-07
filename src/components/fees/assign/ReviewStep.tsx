"use client";

import type { FeeItem } from "@/app/services/fees.service";
import { overrideFor, type OverrideMap } from "@/hooks/fees/assignWizard";
import { feeTypeLabel, formatDate, formatNaira, totalCapacity } from "../formatters";
import type { FeeClass } from "../types";
import { CardHeader, card, eyebrow, table } from "@/components/tl";
import {
  strongCellClass,
  tableCellClass,
  tableHeadCellClass,
  tableHeadClass,
  tableRowClass,
  tableScrollClass,
} from "../ui";

/** Props for {@link ReviewStep}. */
interface ReviewStepProps {
  /** The fee being assigned. */
  fee: FeeItem;
  /** The school's classes. */
  classes: FeeClass[];
  /** The ticked classes. */
  selectedClassIds: Set<string>;
  /** Each class's amount and due date drafts. */
  overrides: OverrideMap;
  /** What all the assignments add up to. */
  totalAmount: number;
  /** The academic year they are recorded against. */
  academicYearLabel: string;
  /** The term they are recorded against. */
  termLabel: string;
}

/**
 * Step 4: everything that is about to be charged, class by class.
 *
 * @param props - The fee, the selection, the drafts and the period labels.
 * @param props.fee - The fee.
 * @param props.classes - The classes.
 * @param props.selectedClassIds - The ticked classes.
 * @param props.overrides - The drafts.
 * @param props.totalAmount - The total expected.
 * @param props.academicYearLabel - The academic year.
 * @param props.termLabel - The term.
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
    <section className={`${card} flex flex-col gap-5`}>
      <CardHeader title="4. Review & Confirm" subtitle="Check the details before assigning this fee." />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <dl className="flex flex-col gap-3 text-sm">
          {facts.map((fact) => (
            <div key={fact.label} className="flex justify-between gap-3">
              <dt className="text-tl-muted">{fact.label}</dt>
              <dd
                className={`text-right capitalize ${
                  fact.label === "Total Expected"
                    ? "font-extrabold text-tl-brand"
                    : "font-bold text-tl-ink"
                }`}
              >
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex min-w-0 flex-col gap-2">
          <p className={eyebrow}>Classes ({selected.length})</p>
          <div className="overflow-hidden rounded-2xl border border-tl-line-soft">
            <div className={tableScrollClass}>
              <table className={table}>
                <thead>
                  <tr className={tableHeadClass}>
                    <th className={tableHeadCellClass}>Class</th>
                    <th className={tableHeadCellClass}>Students</th>
                    <th className={tableHeadCellClass}>Amount</th>
                    <th className={tableHeadCellClass}>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.map((cls) => {
                    const draft = overrideFor(overrides, fee, cls._id);
                    return (
                      <tr key={cls._id} className={tableRowClass}>
                        <td className={strongCellClass}>{cls.name}</td>
                        <td className={tableCellClass}>{cls.classCapacity ?? 0}</td>
                        <td className={`${strongCellClass} whitespace-nowrap`}>
                          {formatNaira(Number(draft.amount) || 0)}
                        </td>
                        <td className={`${tableCellClass} whitespace-nowrap`}>
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
    </section>
  );
}
