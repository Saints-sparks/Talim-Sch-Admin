"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, Plus } from "lucide-react";
import { toast } from "@/components/CustomToast";
import { useAcademicSetup, useAcademicSetupActions } from "@/hooks/settings/useAcademicSetup";
import {
  Card,
  CardHeader,
  InputField,
  ModalShell,
  OutlineBtn,
  PrimaryBtn,
  SectionError,
  SectionHeader,
  SectionSkeleton,
  StatusBadge,
  ToggleRow,
} from "@/components/settings/ui";

const TITLE = "Academic Setup";
const DESC = "Manage academic years, terms and grading periods";

/**
 * Formats an ISO date for the tables.
 *
 * @param d - ISO date string.
 * @returns e.g. "01 Sep 2025", or an em dash when absent.
 */
function fmtDate(d: string): string {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

const TH = "px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400";
const TD = "px-4 py-3 text-gray-600 dark:text-slate-300";

const EMPTY_YEAR = { year: "", startDate: "", endDate: "", isCurrent: false };
const EMPTY_TERM = { name: "", startDate: "", endDate: "", isCurrent: false, academicYearId: "" };

/**
 * Settings → Academic Setup: the school's academic years and terms, which
 * term is current, and how far through the year the school is.
 *
 * @param props.canManage - False for a role without `manage:settings`: the
 *   tables stay readable, the create forms and "Set Current" disappear.
 */
export function AcademicSetupSection({ canManage }: { canManage: boolean }) {
  const { years, terms, currentYear, currentTerm, progress, isLoading, isError, error, refetch } =
    useAcademicSetup();
  const { addYear, addTerm, makeTermCurrent, submitting } = useAcademicSetupActions();

  const [showYearForm, setShowYearForm] = useState(false);
  const [showTermForm, setShowTermForm] = useState(false);
  const [yearForm, setYearForm] = useState(EMPTY_YEAR);
  const [termForm, setTermForm] = useState(EMPTY_TERM);
  const [pendingTermId, setPendingTermId] = useState("");

  if (isLoading) return <SectionSkeleton title={TITLE} desc={DESC} rows={3} />;
  if (isError) {
    return (
      <SectionError
        title={TITLE}
        desc={DESC}
        error={error}
        fallback="Failed to load academic years and terms."
        onRetry={refetch}
      />
    );
  }

  const submitYear = async (e: React.FormEvent) => {
    e.preventDefault();
    const year = yearForm.year.trim();
    if (!year) return toast.error("Academic year is required");
    if (!yearForm.startDate || !yearForm.endDate) return toast.error("Dates are required");
    if (new Date(yearForm.startDate) >= new Date(yearForm.endDate))
      return toast.error("End date must be after start date");
    if (years.some((y) => y.year === year)) return toast.error("Academic year already exists");

    try {
      await addYear({
        year,
        startDate: new Date(yearForm.startDate).toISOString(),
        endDate: new Date(yearForm.endDate).toISOString(),
        isCurrent: yearForm.isCurrent,
      });
      setYearForm(EMPTY_YEAR);
      setShowYearForm(false);
    } catch {
      // Reported by the mutation; the form keeps what was typed.
    }
  };

  const submitTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = termForm.name.trim();
    if (!name) return toast.error("Term name is required");
    if (!termForm.academicYearId) return toast.error("Academic year is required");
    if (!termForm.startDate || !termForm.endDate) return toast.error("Dates are required");
    if (new Date(termForm.startDate) >= new Date(termForm.endDate))
      return toast.error("End date must be after start date");

    try {
      await addTerm({ ...termForm, name });
      setTermForm(EMPTY_TERM);
      setShowTermForm(false);
    } catch {
      // Reported by the mutation.
    }
  };

  const confirmTermChange = async () => {
    try {
      await makeTermCurrent(pendingTermId);
    } finally {
      setPendingTermId("");
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader title={TITLE} desc={DESC} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="Current Academic Year" value={currentYear?.year} range={currentYear} />
        <SummaryCard label="Current Term" value={currentTerm?.name} range={currentTerm} />
        <Card className="p-4">
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Academic Progress</p>
          {progress ? (
            <>
              <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{progress.pct}%</p>
              <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-1.5 mt-2">
                <div
                  className="bg-[#003366] dark:bg-blue-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${progress.pct}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                {progress.daysElapsed}d elapsed · {progress.daysRemaining}d remaining
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400 dark:text-slate-500">No active year</p>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Academic Years"
          action={
            canManage ? (
              <PrimaryBtn onClick={() => setShowYearForm((v) => !v)}>
                <Plus className="w-3.5 h-3.5" /> Add Academic Year
              </PrimaryBtn>
            ) : undefined
          }
        />
        <AnimatePresence>
          {showYearForm && canManage && (
            <Collapsible>
              <form
                onSubmit={submitYear}
                className="p-5 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40 space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <InputField
                    label="Academic Year"
                    value={yearForm.year}
                    onChange={(v) => setYearForm({ ...yearForm, year: v })}
                    placeholder="e.g. 2027/2028"
                    required
                  />
                  <InputField
                    label="Start Date"
                    value={yearForm.startDate}
                    onChange={(v) => setYearForm({ ...yearForm, startDate: v })}
                    type="date"
                    required
                  />
                  <InputField
                    label="End Date"
                    value={yearForm.endDate}
                    onChange={(v) => setYearForm({ ...yearForm, endDate: v })}
                    type="date"
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="yearCurrent"
                    checked={yearForm.isCurrent}
                    onChange={(e) => setYearForm({ ...yearForm, isCurrent: e.target.checked })}
                    className="rounded border-gray-300 dark:border-slate-600"
                  />
                  <label htmlFor="yearCurrent" className="text-xs text-gray-700 dark:text-slate-300">
                    Set as current academic year
                  </label>
                </div>
                <div className="flex gap-3">
                  <OutlineBtn onClick={() => setShowYearForm(false)} disabled={submitting}>
                    Cancel
                  </OutlineBtn>
                  <PrimaryBtn type="submit" loading={submitting}>
                    Save Academic Year
                  </PrimaryBtn>
                </div>
              </form>
            </Collapsible>
          )}
        </AnimatePresence>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40">
                {["Academic Year", "Start Date", "End Date", "Status"].map((h) => (
                  <th key={h} className={TH}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {years.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-400 dark:text-slate-500 text-sm">
                    No academic years found
                  </td>
                </tr>
              ) : (
                years.map((y) => (
                  <tr
                    key={y._id}
                    className="border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/40"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-slate-100">
                      {y.year}{" "}
                      {y.isCurrent && (
                        <span className="ml-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold">
                          Current
                        </span>
                      )}
                    </td>
                    <td className={TD}>{fmtDate(y.startDate)}</td>
                    <td className={TD}>{fmtDate(y.endDate)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={y.isCurrent ? "Active" : "Completed"} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Terms"
          action={
            canManage ? (
              <PrimaryBtn onClick={() => setShowTermForm((v) => !v)} disabled={years.length === 0}>
                <Plus className="w-3.5 h-3.5" /> Add Term
              </PrimaryBtn>
            ) : undefined
          }
        />
        <AnimatePresence>
          {showTermForm && canManage && (
            <Collapsible>
              <form
                onSubmit={submitTerm}
                className="p-5 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40 space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Term Name"
                    value={termForm.name}
                    onChange={(v) => setTermForm({ ...termForm, name: v })}
                    placeholder="e.g. First Term"
                    required
                  />
                  <div>
                    <label
                      htmlFor="term-academic-year"
                      className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1"
                    >
                      Academic Year <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="term-academic-year"
                      value={termForm.academicYearId}
                      onChange={(e) => setTermForm({ ...termForm, academicYearId: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg outline-none focus:border-[#003366]"
                      required
                    >
                      <option value="">Select academic year</option>
                      {years.map((y) => (
                        <option key={y._id} value={y._id}>
                          {y.year}
                        </option>
                      ))}
                    </select>
                  </div>
                  <InputField
                    label="Start Date"
                    value={termForm.startDate}
                    onChange={(v) => setTermForm({ ...termForm, startDate: v })}
                    type="date"
                    required
                  />
                  <InputField
                    label="End Date"
                    value={termForm.endDate}
                    onChange={(v) => setTermForm({ ...termForm, endDate: v })}
                    type="date"
                    required
                  />
                </div>
                <ToggleRow
                  label="Set as current term"
                  checked={termForm.isCurrent}
                  onChange={(v) => setTermForm({ ...termForm, isCurrent: v })}
                />
                <div className="flex gap-3">
                  <OutlineBtn onClick={() => setShowTermForm(false)} disabled={submitting}>
                    Cancel
                  </OutlineBtn>
                  <PrimaryBtn type="submit" loading={submitting}>
                    Save Term
                  </PrimaryBtn>
                </div>
              </form>
            </Collapsible>
          )}
        </AnimatePresence>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40">
                {["Term Name", "Start Date", "End Date", "Status", "Is Current", "Actions"].map((h) => (
                  <th key={h} className={TH}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {terms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400 dark:text-slate-500 text-sm">
                    No terms found
                  </td>
                </tr>
              ) : (
                terms.map((t) => (
                  <tr
                    key={t._id}
                    className="border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/40"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-slate-100">{t.name}</td>
                    <td className={TD}>{fmtDate(t.startDate)}</td>
                    <td className={TD}>{fmtDate(t.endDate)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.isCurrent ? "Active" : "Upcoming"} />
                    </td>
                    <td className="px-4 py-3">
                      {t.isCurrent ? (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                          <Check className="w-3 h-3" /> Current
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {canManage && !t.isCurrent && (
                        <button
                          type="button"
                          onClick={() => setPendingTermId(t._id)}
                          className="px-2 py-1 text-xs text-[#003366] dark:text-blue-400 border border-[#003366]/20 dark:border-blue-400/30 rounded hover:bg-[#003366]/5 dark:hover:bg-blue-400/10 transition"
                        >
                          Set Current
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AnimatePresence>
        {pendingTermId && (
          <ModalShell title="Change Current Term?" onClose={() => setPendingTermId("")}>
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-gray-700 dark:text-slate-200 font-medium">
                  {terms.find((t) => t._id === pendingTermId)?.name} will become the current term.
                </p>
                {currentTerm && (
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    {currentTerm.name} will be set to Upcoming.
                  </p>
                )}
              </div>
              <div className="flex gap-3 justify-center pt-2">
                <OutlineBtn onClick={() => setPendingTermId("")} disabled={submitting}>
                  Cancel
                </OutlineBtn>
                <button
                  type="button"
                  onClick={confirmTermChange}
                  disabled={submitting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                >
                  {submitting ? "Updating…" : "Change Term"}
                </button>
              </div>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>
    </div>
  );
}

/** One of the three summary tiles at the top of the section. */
function SummaryCard({
  label,
  value,
  range,
}: {
  label: string;
  value?: string;
  range?: { startDate: string; endDate: string };
}) {
  return (
    <Card className="p-4">
      <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{value || "Not set"}</p>
      {range && (
        <>
          <StatusBadge status="Active" />
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
            {fmtDate(range.startDate)} – {fmtDate(range.endDate)}
          </p>
        </>
      )}
    </Card>
  );
}

/** The height animation both inline create-forms share. */
function Collapsible({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden"
    >
      {children}
    </motion.div>
  );
}
