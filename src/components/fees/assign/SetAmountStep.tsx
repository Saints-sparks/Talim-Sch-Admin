"use client";

import type { FeeItem } from "@/app/services/fees.service";
import { overrideFor, type ClassOverrideDraft, type OverrideMap } from "@/hooks/fees/assignWizard";
import type { FeeClass } from "../types";
import {
  cardClass,
  headingClass,
  inputClass,
  mutedTextClass,
  secondaryButtonClass,
  tableBodyClass,
  tableHeadCellClass,
  tableHeadClass,
  tableRowClass,
  tableScrollClass,
} from "../ui";

interface SetAmountStepProps {
  fee: FeeItem;
  classes: FeeClass[];
  selectedClassIds: Set<string>;
  overrides: OverrideMap;
  onChange: (classId: string, field: keyof ClassOverrideDraft, value: string) => void;
  onApplyFirstToAll: () => void;
}

/**
 * Step 3: the amount, due date and late fee each class will carry.
 *
 * @param props - The fee, the selected classes and the current drafts.
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
    <div className={`${cardClass} p-6 space-y-4`}>
      <div>
        <h2 className={`font-semibold ${headingClass}`}>3. Set Amount &amp; Due Date</h2>
        <p className={`text-xs mt-0.5 ${mutedTextClass}`}>
          Every class needs an amount and a due date — both start from the fee&apos;s defaults.
        </p>
      </div>

      <div className={tableScrollClass}>
        <table className="w-full text-sm">
          <thead className={tableHeadClass}>
            <tr>
              <th className={tableHeadCellClass}>Class</th>
              <th className={tableHeadCellClass}>Students</th>
              <th className={tableHeadCellClass}>Amount (NGN)</th>
              <th className={tableHeadCellClass}>Due Date</th>
              <th className={tableHeadCellClass}>Late Fee (NGN)</th>
            </tr>
          </thead>
          <tbody className={tableBodyClass}>
            {selected.map((cls) => {
              const draft = overrideFor(overrides, fee, cls._id);
              return (
                <tr key={cls._id} className={tableRowClass}>
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">
                    {cls.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {cls.classCapacity ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={draft.amount}
                      onChange={(event) => onChange(cls._id, "amount", event.target.value)}
                      aria-label={`Amount for ${cls.name}`}
                      className={`${inputClass} w-28 py-1.5`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="date"
                      value={draft.dueDate}
                      onChange={(event) => onChange(cls._id, "dueDate", event.target.value)}
                      aria-label={`Due date for ${cls.name}`}
                      required
                      className={`${inputClass} w-40 py-1.5`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={draft.lateFeeAmount}
                      onChange={(event) => onChange(cls._id, "lateFeeAmount", event.target.value)}
                      aria-label={`Late fee for ${cls.name}`}
                      className={`${inputClass} w-28 py-1.5`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onApplyFirstToAll}
          className={`flex items-center gap-1 text-xs rounded-lg px-3 py-1.5 ${secondaryButtonClass}`}
        >
          Apply the first row&apos;s amount and due date to all
        </button>
      </div>
    </div>
  );
}
