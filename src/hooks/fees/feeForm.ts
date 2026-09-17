/**
 * The create / edit fee form: its values, its validation and the payload it
 * sends.
 *
 * Validation mirrors `CreateFeeItemDto` field for field (lengths, required
 * flags, minimums), so the form catches what the API would reject instead of
 * bouncing the user off a 400 after a round trip. Keeping it out of the page
 * component also makes it directly testable.
 */
"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  CreateFeeItemPayload,
  FeeItem,
  FeeItemStatus,
  FeeType,
} from "@/app/services/fees.service";
import { refId, toDateInputValue } from "@/components/fees/formatters";

/** Limits from `CreateFeeItemDto`. */
export const FEE_NAME_MAX = 150;
/** Limit from `CreateFeeItemDto`. */
export const FEE_DESCRIPTION_MAX = 500;

/** The fee types the form offers, in the order the radio row shows them. */
export const FEE_TYPES: Array<{ value: FeeType; label: string }> = [
  { value: "one_time", label: "One Time" },
  { value: "recurring", label: "Recurring" },
  { value: "termly", label: "Termly" },
  { value: "annual", label: "Annual" },
];

/** The statuses a fee can be saved in. `archived` is reached by archiving. */
export const FEE_STATUSES: Array<{ value: FeeItemStatus; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

/** Form state; numbers stay strings while the user types. */
export interface FeeFormValues {
  name: string;
  categoryId: string;
  description: string;
  academicYearId: string;
  termId: string;
  feeType: FeeType;
  defaultAmount: string;
  defaultDueDate: string;
  lateFeeAmount: string;
  allowPartialPayment: boolean;
  isVisibleToParents: boolean;
  includeInCollection: boolean;
  status: FeeItemStatus;
}

/** Field name → message, for the fields that failed validation. */
export type FeeFormErrors = Partial<Record<keyof FeeFormValues, string>>;

/** A blank create form. */
export const EMPTY_FEE_FORM: FeeFormValues = {
  name: "",
  categoryId: "",
  description: "",
  academicYearId: "",
  termId: "",
  feeType: "one_time",
  defaultAmount: "",
  defaultDueDate: "",
  lateFeeAmount: "",
  allowPartialPayment: false,
  isVisibleToParents: true,
  includeInCollection: true,
  status: "draft",
};

/**
 * Fills the form from an existing fee item, unwrapping the references the API
 * populates and reducing the due date to what a date input accepts.
 *
 * @param item - The fee item being edited.
 * @returns The form values.
 */
export function feeFormFromItem(item: FeeItem): FeeFormValues {
  return {
    name: item.name ?? "",
    categoryId: refId(item.categoryId),
    description: item.description ?? "",
    academicYearId: refId(item.academicYearId),
    termId: refId(item.termId),
    feeType: item.feeType,
    defaultAmount: String(item.defaultAmount ?? ""),
    defaultDueDate: toDateInputValue(item.defaultDueDate),
    lateFeeAmount: item.lateFeeAmount ? String(item.lateFeeAmount) : "",
    allowPartialPayment: Boolean(item.allowPartialPayment),
    isVisibleToParents: Boolean(item.isVisibleToParents),
    includeInCollection: Boolean(item.includeInCollection),
    status: item.status === "archived" ? "draft" : item.status,
  };
}

/**
 * Checks the form against the backend DTO.
 *
 * @param values - Current form values.
 * @param options - `assigningClasses` is true when classes are ticked, which
 *   makes the due date mandatory: an assignment cannot be created without one.
 * @returns One message per invalid field; empty when the form is valid.
 */
export function validateFeeForm(
  values: FeeFormValues,
  options: { assigningClasses?: boolean } = {}
): FeeFormErrors {
  const errors: FeeFormErrors = {};

  const name = values.name.trim();
  if (!name) errors.name = "Give the fee a name.";
  else if (name.length > FEE_NAME_MAX) errors.name = `Keep the name to ${FEE_NAME_MAX} characters or fewer.`;

  if (!values.categoryId) errors.categoryId = "Choose a category.";

  if (values.description.trim().length > FEE_DESCRIPTION_MAX) {
    errors.description = `Keep the description to ${FEE_DESCRIPTION_MAX} characters or fewer.`;
  }

  const amount = Number(values.defaultAmount);
  if (values.defaultAmount.trim() === "") errors.defaultAmount = "Enter the amount.";
  else if (!Number.isFinite(amount)) errors.defaultAmount = "Enter the amount as a number.";
  else if (amount < 0) errors.defaultAmount = "The amount cannot be negative.";

  if (values.lateFeeAmount.trim() !== "") {
    const lateFee = Number(values.lateFeeAmount);
    if (!Number.isFinite(lateFee)) errors.lateFeeAmount = "Enter the late fee as a number.";
    else if (lateFee < 0) errors.lateFeeAmount = "The late fee cannot be negative.";
  }

  if (options.assigningClasses && !values.defaultDueDate) {
    errors.defaultDueDate = "Set a due date before assigning this fee to classes.";
  }

  return errors;
}

/**
 * Builds the API payload from the form. Optional ids are left out rather than
 * sent as empty strings, which the DTO's `@IsMongoId()` would reject.
 *
 * @param values - Validated form values.
 * @returns The `CreateFeeItemDto`-shaped body.
 */
export function feeFormToPayload(values: FeeFormValues): CreateFeeItemPayload {
  return {
    name: values.name.trim(),
    categoryId: values.categoryId,
    description: values.description.trim() || undefined,
    academicYearId: values.academicYearId || undefined,
    termId: values.termId || undefined,
    feeType: values.feeType,
    defaultAmount: Number(values.defaultAmount),
    defaultDueDate: values.defaultDueDate || undefined,
    lateFeeAmount: values.lateFeeAmount.trim() === "" ? 0 : Number(values.lateFeeAmount),
    allowPartialPayment: values.allowPartialPayment,
    isVisibleToParents: values.isVisibleToParents,
    includeInCollection: values.includeInCollection,
    status: values.status,
  };
}

/** What `useFeeForm` hands back to the page. */
export interface FeeFormController {
  values: FeeFormValues;
  errors: FeeFormErrors;
  /** Sets one field and clears its error. */
  setField: <K extends keyof FeeFormValues>(key: K, value: FeeFormValues[K]) => void;
  /** Replaces every value, e.g. once the edited fee loads. */
  reset: (next: FeeFormValues) => void;
  /** Validates and stores the errors. */
  validate: (options?: { assigningClasses?: boolean }) => FeeFormErrors;
}

/**
 * Holds the create/edit fee form.
 *
 * @param initial - Starting values. Defaults to a blank form.
 * @returns The form values, their errors and the setters.
 */
export function useFeeForm(initial: FeeFormValues = EMPTY_FEE_FORM): FeeFormController {
  const [values, setValues] = useState<FeeFormValues>(initial);
  const [errors, setErrors] = useState<FeeFormErrors>({});

  const setField = useCallback(
    <K extends keyof FeeFormValues>(key: K, value: FeeFormValues[K]) => {
      setValues((current) => ({ ...current, [key]: value }));
      setErrors((current) => {
        if (!current[key]) return current;
        const next = { ...current };
        delete next[key];
        return next;
      });
    },
    []
  );

  const reset = useCallback((next: FeeFormValues) => {
    setValues(next);
    setErrors({});
  }, []);

  const validate = useCallback(
    (options: { assigningClasses?: boolean } = {}) => {
      const found = validateFeeForm(values, options);
      setErrors(found);
      return found;
    },
    [values]
  );

  return useMemo(
    () => ({ values, errors, setField, reset, validate }),
    [values, errors, setField, reset, validate]
  );
}
