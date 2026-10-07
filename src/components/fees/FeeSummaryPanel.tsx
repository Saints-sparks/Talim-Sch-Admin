"use client";

import type { FeeCategory } from "@/app/services/fees.service";
import type { FeeFormValues } from "@/hooks/fees/feeForm";
import { feeTypeLabel, formatDate, totalCapacity } from "./formatters";
import type { FeeClass } from "./types";
import { Banner, Pill, card, sectionTitle } from "@/components/tl";

/**
 * One label/value line in the summary.
 *
 * @param props - The label and its value.
 * @param props.label - The label.
 * @param props.children - The value.
 * @returns The row.
 */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-tl-muted">{label}</span>
      <span className="text-right font-bold text-tl-ink">{children}</span>
    </div>
  );
}

/** Props for {@link FeeSummaryPanel}. */
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
 * @param props.values - The form values.
 * @param props.categories - The school's categories.
 * @param props.classes - The school's classes.
 * @param props.selectedClassIds - The ticked classes.
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
    <section className={`${card} flex flex-col gap-4 lg:sticky lg:top-6`}>
      <h2 className={sectionTitle}>Fee Summary</h2>

      <div className="flex flex-col gap-2.5 text-sm">
        <Row label="Fee Name">
          <span className="block max-w-[160px] truncate">{values.name || "—"}</span>
        </Row>
        <Row label="Category">
          {category ? (
            <Pill tone="accent">{category.name}</Pill>
          ) : (
            "—"
          )}
        </Row>
        <Row label="Fee Type">
          <span className="capitalize">{feeTypeLabel(values.feeType)}</span>
        </Row>
        <Row label="Amount (NGN)">
          <span className="text-tl-brand">
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
          <hr className="border-tl-line-soft" />
          <div className="flex flex-col gap-2 text-sm">
            <Row label="Assigned Classes">{selectedClasses.length} Classes</Row>
            <ul className="flex flex-col gap-1">
              {selectedClasses.slice(0, 4).map((entry) => (
                <li key={entry._id} className="flex items-center gap-2">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-tl-brand" />
                  <span className="text-[13px] text-tl-muted">
                    {entry.name} ({entry.classCapacity ?? 0} Students)
                  </span>
                </li>
              ))}
              {selectedClasses.length > 4 && (
                <li className="pl-3.5 text-[13px] text-tl-muted">
                  +{selectedClasses.length - 4} more classes
                </li>
              )}
            </ul>
          </div>
          <Banner tone="info" title={<>This fee will be assigned to {students} students</>}>
            Total students in the selected classes
          </Banner>
        </>
      )}
    </section>
  );
}
