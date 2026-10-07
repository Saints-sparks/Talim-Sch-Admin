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
import { CardHeader, card, fieldControl, fieldError, fieldHint, fieldLabel } from "@/components/tl";

/** The label above each control. */
const labelClass = `${fieldLabel} mb-1.5 block`;

/** The red asterisk after a required field's label. */
const required = <span className="text-tl-danger">*</span>;

/**
 * The message under a field that failed validation.
 *
 * @param props - The message, if any.
 * @param props.message - The message.
 * @returns The message, or null.
 */
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className={`${fieldError} mt-1.5`}>{message}</p>;
}

/** Props for {@link FeeInformationSection}. */
interface FeeInformationSectionProps {
  /** The form values. */
  values: FeeFormValues;
  /** The fields that failed validation. */
  errors: FeeFormErrors;
  /** Sets one field. */
  setField: <K extends keyof FeeFormValues>(key: K, value: FeeFormValues[K]) => void;
  /** The school's fee categories. */
  categories: FeeCategory[];
  /** True while the categories load. */
  categoriesLoading: boolean;
  /** The school's academic years. */
  academicYears: AcademicYearResponse[];
  /** Already filtered to the chosen academic year. */
  terms: TermResponse[];
  /** Locks the fields while saving. */
  disabled?: boolean;
}

/**
 * Section 1 of the fee form: what the fee is, when it falls due and how much.
 *
 * @param props - The form values, their errors and the reference lists the
 *   selects need.
 * @param props.values - The form values.
 * @param props.errors - The validation errors.
 * @param props.setField - Sets one field.
 * @param props.categories - The fee categories.
 * @param props.categoriesLoading - Whether they are loading.
 * @param props.academicYears - The academic years.
 * @param props.terms - The terms of the chosen year.
 * @param props.disabled - Whether the fields are locked.
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
    <section className={`${card} flex flex-col gap-5`}>
      <CardHeader title="1. Fee Information" subtitle="Enter the basic details of the fee." />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={labelClass} htmlFor="fee-name">
            Fee Name {required}
          </label>
          <input
            id="fee-name"
            type="text"
            value={values.name}
            maxLength={FEE_NAME_MAX}
            disabled={disabled}
            onChange={(event) => setField("name", event.target.value)}
            placeholder="e.g. Annual Tuition Fee"
            className={fieldControl}
            aria-invalid={Boolean(errors.name)}
          />
          <FieldError message={errors.name} />
        </div>

        <div>
          <label className={labelClass} htmlFor="fee-category">
            Category {required}
          </label>
          <select
            id="fee-category"
            value={values.categoryId}
            disabled={disabled || categoriesLoading}
            onChange={(event) => setField("categoryId", event.target.value)}
            className={fieldControl}
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
            <p className={`${fieldHint} mt-1.5`}>
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
            className={fieldControl}
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
            className={fieldControl}
          >
            {FEE_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <p className={`${fieldHint} mt-1.5`}>
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
            className={fieldControl}
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
            className={fieldControl}
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
        <span className={`${fieldLabel} mb-2 block`}>
          Fee Type {required}
        </span>
        <div className="flex flex-wrap gap-2">
          {FEE_TYPES.map((type) => (
            <label
              key={type.value}
              className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-tl-line px-3.5 has-[:checked]:border-tl-control has-[:checked]:bg-tl-select"
            >
              <input
                type="radio"
                name="feeType"
                value={type.value}
                disabled={disabled}
                checked={values.feeType === type.value}
                onChange={() => setField("feeType", type.value as FeeType)}
                className="h-4 w-4 accent-tl-brand"
              />
              <span className="text-sm font-bold text-tl-body">{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={labelClass} htmlFor="fee-amount">
            Amount (NGN) {required}
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
            className={fieldControl}
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
            className={fieldControl}
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
            className={fieldControl}
            aria-invalid={Boolean(errors.lateFeeAmount)}
          />
          <FieldError message={errors.lateFeeAmount} />
          <p className={`${fieldHint} mt-1.5`}>Applied after the due date</p>
        </div>
      </div>
    </section>
  );
}
