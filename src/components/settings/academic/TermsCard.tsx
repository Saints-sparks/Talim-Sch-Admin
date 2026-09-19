import { AnimatePresence } from "framer-motion";
import { Check, Plus } from "lucide-react";
import type { AcademicYearResponse, TermResponse } from "@/app/services/academic.service";
import {
  Card,
  CardHeader,
  InputField,
  OutlineBtn,
  PrimaryBtn,
  StatusBadge,
  ToggleRow,
} from "@/components/settings/ui";
import { formatSetupDate, type TermForm } from "./academicForms";
import { Collapsible, FORM_PANEL, TD, TH } from "./academicUi";

interface TermsCardProps {
  years: AcademicYearResponse[];
  terms: TermResponse[];
  canManage: boolean;
  showForm: boolean;
  form: TermForm;
  submitting: boolean;
  onToggleForm: () => void;
  onCloseForm: () => void;
  onChange: (form: TermForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSetCurrent: (termId: string) => void;
}

/** The terms table with its inline create form and the "Set Current" action. */
export function TermsCard({
  years,
  terms,
  canManage,
  showForm,
  form,
  submitting,
  onToggleForm,
  onCloseForm,
  onChange,
  onSubmit,
  onSetCurrent,
}: TermsCardProps) {
  return (
    <Card>
      <CardHeader
        title="Terms"
        action={
          canManage ? (
            <PrimaryBtn onClick={onToggleForm} disabled={years.length === 0}>
              <Plus className="w-3.5 h-3.5" /> Add Term
            </PrimaryBtn>
          ) : undefined
        }
      />
      <AnimatePresence>
        {showForm && canManage && (
          <Collapsible>
            <form onSubmit={onSubmit} className={FORM_PANEL}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Term Name"
                  value={form.name}
                  onChange={(v) => onChange({ ...form, name: v })}
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
                    value={form.academicYearId}
                    onChange={(e) => onChange({ ...form, academicYearId: e.target.value })}
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
                  value={form.startDate}
                  onChange={(v) => onChange({ ...form, startDate: v })}
                  type="date"
                  required
                />
                <InputField
                  label="End Date"
                  value={form.endDate}
                  onChange={(v) => onChange({ ...form, endDate: v })}
                  type="date"
                  required
                />
              </div>
              <ToggleRow
                label="Set as current term"
                checked={form.isCurrent}
                onChange={(v) => onChange({ ...form, isCurrent: v })}
              />
              <div className="flex gap-3">
                <OutlineBtn onClick={onCloseForm} disabled={submitting}>
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
                  <td className={TD}>{formatSetupDate(t.startDate)}</td>
                  <td className={TD}>{formatSetupDate(t.endDate)}</td>
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
                        onClick={() => onSetCurrent(t._id)}
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
  );
}
