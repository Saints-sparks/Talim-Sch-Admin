"use client";

import React from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import type { StudentStep } from "./studentForm";

const STAGES = [
  { step: 0, title: "Account", icon: "1" },
  { step: 1, title: "Profile", icon: "2" },
] as const;

interface StudentModalHeaderProps {
  step: StudentStep;
  /** Id that names the dialog for assistive tech. */
  titleId: string;
  onClose: () => void;
  /** Disables the close button while a create is in flight. */
  busy: boolean;
}

/**
 * Navy header of the add-student dialog: title, close button and the
 * two-stage stepper.
 *
 * @param props - Current step, title id, close handler and busy flag.
 * @returns The header.
 */
export function StudentModalHeader({ step, titleId, onClose, busy }: StudentModalHeaderProps) {
  return (
    <div className="bg-[#003366] px-6 py-5 text-white flex-shrink-0">
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-start gap-3">
          <div className="bg-white/20 p-2.5 rounded-lg mt-0.5">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            </svg>
          </div>
          <div>
            <h2 id={titleId} className="text-xl font-bold">
              Add New Student
            </h2>
            <p className="text-blue-100 text-sm mt-0.5">
              {step === 0 ? "Setup account credentials" : "Complete student profile"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          aria-label="Close"
          className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="relative" data-guide="student-create-progress">
        <Tooltip
          content="Student setup has two stages: account credentials first, then class placement and parent contact details."
          side="bottom"
        >
          <div className="flex items-center justify-between">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-blue-400" />
            <div
              className="absolute top-5 left-0 h-0.5 bg-white transition-all duration-300"
              style={{ width: step === 0 ? "0%" : "100%" }}
            />
            {STAGES.map((stage) => (
              <div key={stage.step} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step >= stage.step ? "bg-white text-blue-600 shadow-lg" : "bg-blue-500 text-white"
                  }`}
                >
                  {step > stage.step ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stage.icon
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div className={`text-xs font-medium ${step >= stage.step ? "text-white" : "text-blue-200"}`}>
                    {stage.title}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Tooltip>
      </div>
    </div>
  );
}
