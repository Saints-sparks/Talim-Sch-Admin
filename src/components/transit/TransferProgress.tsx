"use client";

import React from "react";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TransferStatus } from "@/app/services/transit.service";
import { surface, text } from "@/components/transit/ui";
import { TRANSFER_STEPS, transferStepIndex } from "@/components/transit/transferStatus";

/**
 * The four-step stepper for a transfer still on the happy path.
 *
 * Renders nothing for a rejected or cancelled transfer — there is no progress
 * left to show, and the page shows a closing banner instead.
 */
export function TransferProgress({ status }: { status: TransferStatus }) {
  const current = transferStepIndex(status);
  if (current < 0) return null;

  return (
    <section className={cn("rounded-xl p-5 shadow-sm", surface.card)}>
      <h2 className={cn("text-sm font-semibold mb-4", text.strong)}>Progress</h2>
      <ol className="flex items-center gap-2">
        {TRANSFER_STEPS.map((step, index) => {
          const done = index <= current;
          const active = index === current;
          return (
            <li key={step.status} className="flex items-center gap-2 flex-1">
              <div className="flex flex-col items-center gap-1 flex-1">
                <span
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                    done
                      ? "bg-[#003366] dark:bg-sky-600 text-white"
                      : "bg-gray-100 dark:bg-slate-800 text-[#929292] dark:text-slate-400"
                  )}
                >
                  {done && !active ? <CheckCircle className="w-4 h-4" /> : index + 1}
                </span>
                <span
                  className={cn(
                    "text-xs text-center leading-tight",
                    done ? cn("font-medium", text.brand) : text.muted
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < TRANSFER_STEPS.length - 1 && (
                <span
                  className={cn(
                    "h-0.5 flex-1 mb-4 transition-colors",
                    index < current ? "bg-[#003366] dark:bg-sky-600" : "bg-gray-100 dark:bg-slate-800"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
