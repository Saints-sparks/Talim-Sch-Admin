"use client";

import type { AcademicYearResponse, TermResponse } from "@/app/services/academic.service";
import type { FeeCategory } from "@/app/services/fees.service";
import type { FeeItemStatus, FeeType } from "@/app/services/fees.service";
import {
  FEE_DESCRIPTION_MAX,
  FEE_NAME_MAX,
  FEE_STATUSES,
  FEE_TYPES,
  type FeeFormErrors,
  type FeeFormValues,
} from "@/hooks/fees/feeForm";
import { cardClass, headingClass, inputClass, mutedTextClass } from "./ui";

const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

/**
 * The message under a field that failed validation.
 *
 * @param props - The message, if any.
 * @returns The message, or null.
 */
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-500 mt-1">{message}</p>;
}

interface FeeInformationSectionProps {
  values: FeeFormValues;
  errors: FeeFormErrors;
  setField: <K extends keyof FeeFormValues>(key: K, value: FeeFormValues[K]) => void;
  categories: FeeCategory[];
  categoriesLoading: boolean;
  academicYears: AcademicYearResponse[];
  /** Already filtered to the chosen academic year. */
  terms: TermResponse[];
  disabled?: boolean;
}

/**
 * Section 1 of the fee form: what the fee is, when it falls due and how much.
 *
 * @param props - The form values, their errors and the reference lists the
 *   selects need.
 * @returns The section.
 */
export function FeeInformationSection({
  values,
  errors,
  setField,
  categories,
  categoriesLoading,
  academicYears,
  terms,
  disabled = false,
}: FeeInformationSectionProps) {
  return (
    <div className={`${cardClass} p-6 space-y-5`}>
      <div>
        <h2 className={`text-base font-semibold ${headingClass}`}>1. Fee Information</h2>
        <p className={`text-xs mt-0.5 ${mutedTextClass}`}>Enter the basic details of the fee.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={labelClass} htmlFor="fee-name">
            Fee Name <span className="text-red-500">*</span>
          </label>
          <input
            id="fee-name"
            type="text"
            value={values.name}
            maxLength={FEE_NAME_MAX}
            disabled={disabled}
            onChange={(event) => setField("name", event.target.value)}
            placeholder="e.g. Annual Tuition Fee"
            className={inputClass}
            aria-invalid={Boolean(errors.name)}
          />
          <FieldError message={errors.name} />
        </div>

        <div>
          <label className={labelClass} htmlFor="fee-category">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="fee-category"
            value={values.categoryId}
            disabled={disabled || categoriesLoading}
            onChange={(event) => setField("categoryId", event.target.value)}
            className={inputClass}
            aria-invalid={Boolean(errors.categoryId)}
          >
            <option value="">{categoriesLoading ? "Loading categories..." : "Select category"}</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
          <FieldError message={errors.categoryId} />
          {!categoriesLoading && categories.length === 0 && (
            <p className={`text-xs mt-1 ${mutedTextClass}`}>
              No categories yet — create one on the Fee Categories tab first.
            </p>
          )}
        </div>

        <div>
          <label className={labelClass} htmlFor="fee-description">
            Description (Optional)
          </label>
          <input
            id="fee-description"
            type="text"
            value={values.description}
            maxLength={FEE_DESCRIPTION_MAX}
            disabled={disabled}
            onChange={(event) => setField("description", event.target.value)}
            placeholder="Brief description..."
            className={inputClass}
          />
          <FieldError message={errors.description} />
        </div>

        <div>
          <label className={labelClass} htmlFor="fee-status">
            Status
          </label>
          <select
            id="fee-status"
            value={values.status}
            disabled={disabled}
            onChange={(event) => setField("status", event.target.value as FeeItemStatus)}
            className={inputClass}
          >
            {FEE_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <p className={`text-xs mt-1 ${mutedTextClass}`}>
            Active fees count on the dashboard and can be used for collection.
          </p>
        </div>

        <div>
          <label className={labelClass} htmlFor="fee-academic-year">
            Academic Year
          </label>
          <select
            id="fee-academic-year"
            value={values.academicYearId}
            disabled={disabled}
            onChange={(event) => {
              setField("academicYearId", event.target.value);
              setField("termId", "");
            }}
            className={inputClass}
          >
            <option value="">All years</option>
            {academicYears.map((year) => (
              <option key={year._id} value={year._id}>
                {year.year}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="fee-term">
            Term
          </label>
          <select
            id="fee-term"
            value={values.termId}
            disabled={disabled || terms.length === 0}
            onChange={(event) => setField("termId", event.target.value)}
            className={inputClass}
          >
            <option value="">
              {terms.length === 0 ? "No terms for this year" : "All terms"}
            </option>
            {terms.map((term) => (
              <option key={term._id} value={term._id}>
                {term.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Fee Type <span className="text-red-500">*</span>
        </span>
        <div className="flex gap-4 flex-wrap">
          {FEE_TYPES.map((type) => (
            <label key={type.value} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="feeType"
                value={type.value}
                disabled={disabled}
                checked={values.feeType === type.value}
                onChange={() => setField("feeType", type.value as FeeType)}
                className="accent-[#003366]"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={labelClass} htmlFor="fee-amount">
            Amount (NGN) <span className="text-red-500">*</span>
          </label>
          <input
            id="fee-amount"
            type="number"
            min="0"
            step="1"
            value={values.defaultAmount}
            disabled={disabled}
            onChange={(event) => setField("defaultAmount", event.target.value)}
            placeholder="0"
            className={inputClass}
            aria-invalid={Boolean(errors.defaultAmount)}
          />
          <FieldError message={errors.defaultAmount} />
        </div>

        <div>
          <label className={labelClass} htmlFor="fee-due-date">
            Due Date
          </label>
          <input
            id="fee-due-date"
            type="date"
            value={values.defaultDueDate}
            disabled={disabled}
            onChange={(event) => setField("defaultDueDate", event.target.value)}
            className={inputClass}
            aria-invalid={Boolean(errors.defaultDueDate)}
          />
          <FieldError message={errors.defaultDueDate} />
        </div>

        <div>
          <label className={labelClass} htmlFor="fee-late-fee">
            Late Fee (NGN) (Optional)
          </label>
          <input
            id="fee-late-fee"
            type="number"
            min="0"
            step="1"
            value={values.lateFeeAmount}
            disabled={disabled}
            onChange={(event) => setField("lateFeeAmount", event.target.value)}
            placeholder="0"
            className={inputClass}
            aria-invalid={Boolean(errors.lateFeeAmount)}
          />
          <FieldError message={errors.lateFeeAmount} />
          <p className={`text-xs mt-1 ${mutedTextClass}`}>Applied after the due date</p>
        </div>
      </div>
    </div>
  );
}
