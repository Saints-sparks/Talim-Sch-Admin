"use client";

import React from "react";
import { Info } from "lucide-react";
import { Card, CardHeader, Notice, OutlineBtn, SectionHeader } from "@/components/settings/ui";
import type { SettingsSectionProps } from "@/components/settings/sections";
import { useAcademicSettings } from "@/hooks/settings/useAcademicSettings";
import { toBandDrafts, toPassMarkText, previewGrading } from "@/components/settings/grading/gradeScale";

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
 * Settings → Assessment Settings: the school's grade scale (edited under
 * Grading) and the weighting and rules the platform applies, shown read-only.
 *
 * These used to be switches that changed nothing — there is no endpoint behind
 * them, so every toggle was discarded on the next render. Configuration that
 * does persist lives in the Grading section and the Assessments module, which
 * the card and the note link to.
 *
 * @param props.onNavigate - Opens the Grading section.
 */
export function AssessmentSettingsSection({ onNavigate }: Pick<SettingsSectionProps, "onNavigate">) {
  return (
    <div className="space-y-5">
      <SectionHeader title="Assessment Settings" desc="Grading rules and assessment preferences" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SchoolScaleCard onEdit={() => onNavigate("grading")} />

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

/** The school's grade scale, read-only, with a way to the editor. */
function SchoolScaleCard({ onEdit }: { onEdit: () => void }) {
  const query = useAcademicSettings();
  const passMark = toPassMarkText(query.data?.passMark);
  const bands = query.data ? previewGrading(toBandDrafts(query.data.gradeScale), passMark).reverse() : [];

  return (
    <Card>
      <CardHeader
        title="Grading Scale"
        action={
          <OutlineBtn onClick={onEdit} className="!px-3 !py-1.5 !text-xs">
            Edit in Grading
          </OutlineBtn>
        }
      />
      <div className="p-4 overflow-x-auto">
        {query.isLoading ? (
          <div className="h-32 bg-gray-100 dark:bg-slate-700 rounded-lg animate-pulse" />
        ) : query.isError ? (
          <p className="text-xs text-gray-500 dark:text-slate-400">The school&apos;s grade scale could not be loaded.</p>
        ) : (
          <table className="w-full text-sm">
            <caption className="sr-only">The school&apos;s grade scale</caption>
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700">
                {["Grade", "Range", "Remark"].map((h) => (
                  <th key={h} scope="col" className="py-2 text-left text-xs font-semibold text-gray-500 dark:text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bands.map((b) => (
                <tr key={b.id} className="border-b border-gray-50 dark:border-slate-700 last:border-0">
                  <td className="py-2 font-semibold text-[#003366] dark:text-blue-400">{b.letter}</td>
                  <td className="py-2 text-gray-700 dark:text-slate-300 tabular-nums">{b.range}</td>
                  <td className="py-2 text-gray-700 dark:text-slate-300">{b.remark || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!query.isLoading && !query.isError && (
          <p className="mt-3 text-xs text-gray-500 dark:text-slate-400">Pass mark: {passMark}%</p>
        )}
      </div>
    </Card>
  );
}
