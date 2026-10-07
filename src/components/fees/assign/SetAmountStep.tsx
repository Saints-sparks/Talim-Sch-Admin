"use client";

import type { FeeItem } from "@/app/services/fees.service";
import { overrideFor, type ClassOverrideDraft, type OverrideMap } from "@/hooks/fees/assignWizard";
import type { FeeClass } from "../types";
import { CardHeader, cardFrame, fieldControl, rowButton, table } from "@/components/tl";
import { cn } from "@/lib/utils";
import {
  strongCellClass,
  tableCellClass,
  tableHeadCellClass,
  tableHeadClass,
  tableRowClass,
  tableScrollClass,
} from "../ui";

/** A compact control inside a table row. */
const cellControl = cn(fieldControl, "min-h-[44px] text-sm");

/** Props for {@link SetAmountStep}. */
interface SetAmountStepProps {
  /** The fee being assigned. */
  fee: FeeItem;
  /** The school's classes. */
  classes: FeeClass[];
  /** The ticked classes. */
  selectedClassIds: Set<string>;
  /** Each class's amount, due date and late fee drafts. */
  overrides: OverrideMap;
  /** Sets one field of one class's draft. */
  onChange: (classId: string, field: keyof ClassOverrideDraft, value: string) => void;
  /** Copies the first row's amount and due date to every row. */
  onApplyFirstToAll: () => void;
}

/**
 * Step 3: the amount, due date and late fee each class will carry.
 *
 * @param props - The fee, the selected classes and the current drafts.
 * @param props.fee - The fee.
 * @param props.classes - The classes.
 * @param props.selectedClassIds - The ticked classes.
 * @param props.overrides - The drafts.
 * @param props.onChange - Sets one field.
 * @param props.onApplyFirstToAll - Copies the first row to all.
 * @returns The step.
 */
export function SetAmountStep({
  fee,
  classes,
  selectedClassIds,
  overrides,
  onChange,
  onApplyFirstToAll,
}: SetAmountStepProps) {
  const selected = classes.filter((entry) => selectedClassIds.has(entry._id));

  return (
    <section className={cardFrame}>
      <div className="p-[clamp(18px,2.4vw,24px)] pb-4">
        <CardHeader
          title="3. Set Amount & Due Date"
          subtitle="Every class needs an amount and a due date — both start from the fee's defaults."
        />
      </div>

      <div className={tableScrollClass}>
        <table className={table}>
          <thead>
            <tr className={tableHeadClass}>
              <th className={tableHeadCellClass}>Class</th>
              <th className={tableHeadCellClass}>Students</th>
              <th className={tableHeadCellClass}>Amount (NGN)</th>
              <th className={tableHeadCellClass}>Due Date</th>
              <th className={tableHeadCellClass}>Late Fee (NGN)</th>
            </tr>
          </thead>
          <tbody>
            {selected.map((cls) => {
              const draft = overrideFor(overrides, fee, cls._id);
              return (
                <tr key={cls._id} className={tableRowClass}>
                  <td className={strongCellClass}>{cls.name}</td>
                  <td className={tableCellClass}>{cls.classCapacity ?? 0}</td>
                  <td className={cn(tableCellClass, "py-2")}>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={draft.amount}
                      onChange={(event) => onChange(cls._id, "amount", event.target.value)}
                      aria-label={`Amount for ${cls.name}`}
                      className={cn(cellControl, "w-32")}
                    />
                  </td>
                  <td className={cn(tableCellClass, "py-2")}>
                    <input
                      type="date"
                      value={draft.dueDate}
                      onChange={(event) => onChange(cls._id, "dueDate", event.target.value)}
                      aria-label={`Due date for ${cls.name}`}
                      required
                      className={cn(cellControl, "w-44")}
                    />
                  </td>
                  <td className={cn(tableCellClass, "py-2")}>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={draft.lateFeeAmount}
                      onChange={(event) => onChange(cls._id, "lateFeeAmount", event.target.value)}
                      aria-label={`Late fee for ${cls.name}`}
                      className={cn(cellControl, "w-32")}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end border-t border-tl-line-soft px-5 py-3">
        <button type="button" onClick={onApplyFirstToAll} className={rowButton}>
          Apply the first row&apos;s amount and due date to all
        </button>
      </div>
    </section>
  );
}
