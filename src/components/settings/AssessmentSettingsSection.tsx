"use client";

import React from "react";
import { Info } from "lucide-react";
import { Card, CardHeader, Notice, SectionHeader } from "@/components/settings/ui";

/** The platform grading scale, shown for reference. */
const GRADING_SCALE = [
  { grade: "A+", min: 90, max: 100 },
  { grade: "A", min: 80, max: 89 },
  { grade: "B+", min: 75, max: 79 },
  { grade: "B", min: 70, max: 74 },
  { grade: "C+", min: 65, max: 69 },
  { grade: "C", min: 60, max: 64 },
  { grade: "D+", min: 55, max: 59 },
  { grade: "D", min: 50, max: 54 },
  { grade: "E", min: 45, max: 49 },
  { grade: "F", min: 0, max: 44 },
];

/** How a final score is split between continuous assessment and the exam. */
const WEIGHTING = [
  { label: "Test Score (CA)", value: 30 },
  { label: "Exam Score", value: 70 },
];

/** Grading behaviour the platform applies to every school. */
const RULES = [
  { label: "Allow decimals in scores", value: "Allowed" },
  { label: "Auto-calculate results", value: "On", desc: "Final scores are computed from CA and exam" },
  { label: "Publish results to parents", value: "Per term", desc: "Controlled when results are released in Assessments" },
];

/**
 * Settings → Assessment Settings: the grading scale, weighting and rules the
 * platform applies, shown read-only.
 *
 * These used to be switches that changed nothing — there is no endpoint behind
 * them, so every toggle was discarded on the next render. Configuration that
 * does persist lives in the Assessments module, which the note links to.
 */
export function AssessmentSettingsSection() {
  return (
    <div className="space-y-5">
      <SectionHeader title="Assessment Settings" desc="Grading rules and assessment preferences" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Grading Scale" />
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700">
                  {["Grade", "Min (%)", "Max (%)"].map((h) => (
                    <th key={h} className="py-2 text-left text-xs font-semibold text-gray-500 dark:text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GRADING_SCALE.map((g) => (
                  <tr key={g.grade} className="border-b border-gray-50 dark:border-slate-700 last:border-0">
                    <td className="py-2 font-semibold text-[#003366] dark:text-blue-400">{g.grade}</td>
                    <td className="py-2 text-gray-700 dark:text-slate-300">{g.min}</td>
                    <td className="py-2 text-gray-700 dark:text-slate-300">{g.max}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Score Weighting" />
            <div className="p-5 space-y-3">
              {WEIGHTING.map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{s.label}</p>
                  <span className="text-sm font-bold text-[#003366] dark:text-blue-400">{s.value}%</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Grading Rules" />
            <div className="p-5 space-y-1">
              {RULES.map((r) => (
                <div
                  key={r.label}
                  className="flex items-center justify-between gap-4 py-3 border-b border-gray-50 dark:border-slate-700 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{r.label}</p>
                    {r.desc && <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{r.desc}</p>}
                  </div>
                  <span className="text-xs font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-full px-2 py-0.5 shrink-0">
                    {r.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Notice icon={<Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />}>
        These are the platform defaults. Assessment configuration that you can change lives in the{" "}
        <a href="/assessments" className="underline font-medium">
          Assessments module
        </a>
        .
      </Notice>
    </div>
  );
}
