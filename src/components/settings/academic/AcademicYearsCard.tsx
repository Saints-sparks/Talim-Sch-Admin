import { AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import type { AcademicYearResponse } from "@/app/services/academic.service";
import {
  Card,
  CardHeader,
  InputField,
  OutlineBtn,
  PrimaryBtn,
  StatusBadge,
} from "@/components/settings/ui";
import { formatSetupDate, type YearForm } from "./academicForms";
import { Collapsible, FORM_PANEL, TD, TH } from "./academicUi";

interface AcademicYearsCardProps {
  years: AcademicYearResponse[];
  canManage: boolean;
  showForm: boolean;
  form: YearForm;
  submitting: boolean;
  onToggleForm: () => void;
  onCloseForm: () => void;
  onChange: (form: YearForm) => void;
  onSubmit: (e: React.FormEvent) => void;
}

/** The academic-years table with its inline create form. */
export function AcademicYearsCard({
  years,
  canManage,
  showForm,
  form,
  submitting,
  onToggleForm,
  onCloseForm,
  onChange,
  onSubmit,
}: AcademicYearsCardProps) {
  return (
    <Card>
      <CardHeader
        title="Academic Years"
        action={
          canManage ? (
            <PrimaryBtn onClick={onToggleForm}>
              <Plus className="w-3.5 h-3.5" /> Add Academic Year
            </PrimaryBtn>
          ) : undefined
        }
      />
      <AnimatePresence>
        {showForm && canManage && (
          <Collapsible>
            <form onSubmit={onSubmit} className={FORM_PANEL}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InputField
                  label="Academic Year"
                  value={form.year}
                  onChange={(v) => onChange({ ...form, year: v })}
                  placeholder="e.g. 2027/2028"
                  required
                />
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
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="yearCurrent"
                  checked={form.isCurrent}
                  onChange={(e) => onChange({ ...form, isCurrent: e.target.checked })}
                  className="rounded border-tl-control"
                />
                <label htmlFor="yearCurrent" className="text-xs text-tl-body">
                  Set as current academic year
                </label>
              </div>
              <div className="flex gap-3">
                <OutlineBtn onClick={onCloseForm} disabled={submitting}>
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
            <tr className="border-b border-tl-line-soft bg-tl-subtle">
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
                <td colSpan={4} className="text-center py-10 text-tl-faint text-sm">
                  No academic years found
                </td>
              </tr>
            ) : (
              years.map((y) => (
                <tr key={y._id} className="border-b border-tl-line-soft hover:bg-tl-bg">
                  <td className="px-4 py-3 font-medium text-tl-ink">
                    {y.year}{" "}
                    {y.isCurrent && (
                      <span className="ml-1.5 text-xs text-tl-link font-semibold">Current</span>
                    )}
                  </td>
                  <td className={TD}>{formatSetupDate(y.startDate)}</td>
                  <td className={TD}>{formatSetupDate(y.endDate)}</td>
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
  );
}
