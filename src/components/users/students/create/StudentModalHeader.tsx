"use client";

import React from "react";
import { Check, UserRoundPlus, X } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { iconButton } from "@/components/tl";
import type { StudentStep } from "./studentForm";

const STAGES = [
  { step: 0, title: "Account", icon: "1" },
  { step: 1, title: "Profile", icon: "2" },
] as const;

/** Props for {@link StudentModalHeader}. */
interface StudentModalHeaderProps {
  /** The current step. */
  step: StudentStep;
  /** Id that names the dialog for assistive tech. */
  titleId: string;
  /** Closes the dialog. */
  onClose: () => void;
  /** Disables the close button while a create is in flight. */
  busy: boolean;
}

/**
 * The add-student dialog's sheet heading: icon, title, close button and the
 * two-stage stepper.
 *
 * @param props - Current step, title id, close handler and busy flag.
 * @param props.step - The current step.
 * @param props.titleId - The title's id.
 * @param props.onClose - Close handler.
 * @param props.busy - Whether a create is in flight.
 * @returns The header.
 */
export function StudentModalHeader({ step, titleId, onClose, busy }: StudentModalHeaderProps) {
  return (
    <div className="flex-shrink-0 border-b border-tl-line-soft px-[clamp(20px,3vw,30px)] pb-5 pt-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-tl-select text-tl-brand"
          >
            <UserRoundPlus className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-[21px] font-extrabold leading-tight tracking-[-0.4px] text-tl-ink"
            >
              Add New Student
            </h2>
            <p className="mt-1 text-[13px] text-tl-muted">
              {step === 0 ? "Setup account credentials" : "Complete student profile"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          aria-label="Close"
          className={`${iconButton} -mr-2`}
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="mt-4" data-guide="student-create-progress">
        <Tooltip
          content="Student setup has two stages: account credentials first, then class placement and parent contact details."
          side="bottom"
        >
          <ol className="flex items-center gap-2.5">
            {STAGES.map((stage, index) => {
              const reached = step >= stage.step;
              const done = step > stage.step;
              return (
                <li key={stage.step} className="flex flex-1 items-center gap-2.5">
                  <span
                    aria-hidden
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold ${
                      reached ? "bg-tl-brand-fill text-tl-on-brand" : "bg-tl-track text-tl-muted"
                    }`}
                  >
                    {done ? <Check className="h-4 w-4" /> : stage.icon}
                  </span>
                  <span
                    className={`text-[13px] font-bold ${reached ? "text-tl-ink" : "text-tl-muted"}`}
                    aria-current={step === stage.step ? "step" : undefined}
                  >
                    {stage.title}
                  </span>
                  {index < STAGES.length - 1 ? (
                    <span
                      aria-hidden
                      className={`h-0.5 flex-1 rounded ${step > stage.step ? "bg-tl-brand-fill" : "bg-tl-line"}`}
                    />
                  ) : null}
                </li>
              );
            })}
          </ol>
        </Tooltip>
      </div>
    </div>
  );
}
