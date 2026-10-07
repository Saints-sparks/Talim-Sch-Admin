"use client";

import { FiCheck } from "react-icons/fi";
import { formatNaira } from "../formatters";
import { StatTile, card, ghostButton, primaryButton } from "@/components/tl";
import { cn } from "@/lib/utils";

/** Props for {@link SuccessStep}. */
interface SuccessStepProps {
  /** The fee that was assigned. */
  feeName: string;
  /** How many assignments the API actually created. */
  assigned: number;
  /** Classes that already carried this fee and were left alone. */
  skipped: number;
  /** Students in the selected classes. */
  studentCount: number;
  /** What the assignments add up to. */
  totalAmount: number;
  /** Back to the fees dashboard. */
  onGoBack: () => void;
  /** Starts the wizard again. */
  onAssignAnother: () => void;
}

/**
 * The confirmation shown after the assignments are created.
 *
 * @param props - What was assigned, and where to go next.
 * @param props.feeName - The fee.
 * @param props.assigned - Assignments created.
 * @param props.skipped - Classes left alone.
 * @param props.studentCount - Students reached.
 * @param props.totalAmount - The total.
 * @param props.onGoBack - Back to the dashboard.
 * @param props.onAssignAnother - Starts again.
 * @returns The success panel.
 */
export function SuccessStep({
  feeName,
  assigned,
  skipped,
  studentCount,
  totalAmount,
  onGoBack,
  onAssignAnother,
}: SuccessStepProps) {
  return (
    <section
      className={cn(card, "flex flex-col items-center gap-5 py-[clamp(28px,5vw,48px)] text-center")}
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-tl-success-bg text-tl-success">
        <FiCheck size={28} aria-hidden />
      </span>
      <div>
        <h2 className="text-[clamp(20px,2.6vw,24px)] font-extrabold tracking-[-0.4px] text-tl-ink">
          Fee Assigned Successfully!
        </h2>
        <p className="mt-1.5 max-w-lg text-sm text-tl-muted">
          {feeName} has been assigned to {assigned} class{assigned === 1 ? "" : "es"}.
          {skipped > 0 &&
            ` ${skipped} class${skipped === 1 ? "" : "es"} already had it and ${skipped === 1 ? "was" : "were"} left unchanged.`}
        </p>
      </div>

      <div className="grid w-full max-w-xl grid-cols-1 gap-3 text-left sm:grid-cols-3">
        <StatTile subtle label="Total Classes" value={assigned} />
        <StatTile subtle label="Total Students" value={studentCount} />
        <StatTile
          subtle
          label="Total Amount"
          value={formatNaira(totalAmount)}
          valueClass="text-lg text-tl-brand"
        />
      </div>

      <div className="flex flex-wrap justify-center gap-2.5">
        <button type="button" onClick={onGoBack} className={primaryButton}>
          Go to Fees Management
        </button>
        <button type="button" onClick={onAssignAnother} className={ghostButton}>
          Assign Another Fee
        </button>
      </div>
    </section>
  );
}
