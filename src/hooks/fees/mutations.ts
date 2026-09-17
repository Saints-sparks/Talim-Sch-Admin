/**
 * Writes for the Fees area.
 *
 * Every mutation here does three things the old page did by hand at each call
 * site: it reports the failure to the user with the server's own message, it
 * logs the error for the developer, and it invalidates exactly the caches it
 * changed — a new or archived fee refreshes both the list and the dashboard
 * summary.
 */
"use client";

import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { toast } from "@/components/CustomToast";
import { getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import {
  archiveFeeAssignment,
  archiveFeeCategory,
  archiveFeeItem,
  assignFeeToClasses,
  createFeeCategory,
  createFeeItem,
  duplicateFeeItem,
  publishFeeAssignment,
  restoreFeeAssignment,
  restoreFeeCategory,
  restoreFeeItem,
  unpublishFeeAssignment,
  updateFeeCategory,
  updateFeeItem,
  updateFeeItemStatus,
  updateReceiptSettings,
  uploadReceiptSignature,
  type AssignFeePayload,
  type AssignFeeResult,
  type CreateFeeCategoryPayload,
  type CreateFeeItemPayload,
  type FeeAssignment,
  type FeeCategory,
  type FeeItem,
  type FeeItemStatus,
  type ReceiptSettings,
  type UpdateFeeCategoryPayload,
  type UpdateFeeItemPayload,
} from "@/app/services/fees.service";
import { useInvalidateFees } from "./queries";

const SCOPE = "fees";

/**
 * Reports a failed fees write: the server's message to the user, the error
 * itself to the developer console in development.
 *
 * @param error - What the service threw.
 * @param fallback - Message to show when the error carries none.
 */
function reportFailure(error: unknown, fallback: string): void {
  logger.error(SCOPE, fallback, error);
  toast.error(getErrorMessage(error, fallback));
}

// ─── Fee items ────────────────────────────────────────────────────────────────

/** One of the row actions on a fee item. */
export type FeeItemAction =
  | { type: "status"; id: string; status: FeeItemStatus }
  | { type: "duplicate"; id: string }
  | { type: "archive"; id: string }
  | { type: "restore"; id: string };

/**
 * Runs a fee item row action (publish, deactivate, duplicate, archive,
 * restore), toasting the outcome and refreshing the item list and summary.
 *
 * @returns Mutation whose `mutate` takes a `FeeItemAction`.
 */
export function useFeeItemAction(): UseMutationResult<FeeItem, unknown, FeeItemAction> {
  const invalidate = useInvalidateFees();
  return useMutation({
    mutationFn: (action: FeeItemAction) => {
      switch (action.type) {
        case "status":
          return updateFeeItemStatus(action.id, action.status);
        case "duplicate":
          return duplicateFeeItem(action.id);
        case "archive":
          return archiveFeeItem(action.id);
        case "restore":
          return restoreFeeItem(action.id);
      }
    },
    onSuccess: async (_item, action) => {
      const message =
        action.type === "status"
          ? `Fee item marked ${action.status}`
          : action.type === "duplicate"
            ? "Fee item duplicated"
            : action.type === "archive"
              ? "Fee item archived"
              : "Fee item restored";
      toast.success(message);
      await invalidate.items();
    },
    onError: (error) => reportFailure(error, "Could not update the fee item"),
  });
}

/** Create a fee item, or update the one named by `id`. */
export interface SaveFeeItemInput {
  /** Fee item id when editing; omitted when creating. */
  id?: string;
  payload: CreateFeeItemPayload | UpdateFeeItemPayload;
}

/**
 * Saves the create/edit fee form. Reports nothing itself beyond failures —
 * the page owns the success message because it also assigns classes.
 *
 * @returns Mutation resolving to the created or updated fee item.
 */
export function useSaveFeeItem(): UseMutationResult<FeeItem, unknown, SaveFeeItemInput> {
  const invalidate = useInvalidateFees();
  return useMutation({
    mutationFn: ({ id, payload }: SaveFeeItemInput) =>
      id
        ? updateFeeItem(id, payload as UpdateFeeItemPayload)
        : createFeeItem(payload as CreateFeeItemPayload),
    onSuccess: async () => {
      await invalidate.items();
    },
    onError: (error) => reportFailure(error, "Could not save the fee"),
  });
}

// ─── Categories ───────────────────────────────────────────────────────────────

/** One of the actions on a fee category. */
export type FeeCategoryAction =
  | { type: "create"; payload: CreateFeeCategoryPayload }
  | { type: "update"; id: string; payload: UpdateFeeCategoryPayload }
  | { type: "archive"; id: string }
  | { type: "restore"; id: string };

/**
 * Creates, edits, archives or restores a fee category and refreshes the
 * category list and the dashboard's category count.
 *
 * @returns Mutation whose `mutate` takes a `FeeCategoryAction`.
 */
export function useFeeCategoryAction(): UseMutationResult<FeeCategory, unknown, FeeCategoryAction> {
  const invalidate = useInvalidateFees();
  return useMutation({
    mutationFn: (action: FeeCategoryAction) => {
      switch (action.type) {
        case "create":
          return createFeeCategory(action.payload);
        case "update":
          return updateFeeCategory(action.id, action.payload);
        case "archive":
          return archiveFeeCategory(action.id);
        case "restore":
          return restoreFeeCategory(action.id);
      }
    },
    onSuccess: async (_category, action) => {
      const message =
        action.type === "create"
          ? "Category created"
          : action.type === "update"
            ? "Category updated"
            : action.type === "archive"
              ? "Category archived"
              : "Category restored";
      toast.success(message);
      await invalidate.categories();
    },
    onError: (error) => reportFailure(error, "Could not save the category"),
  });
}

// ─── Assignments ──────────────────────────────────────────────────────────────

/** One of the lifecycle actions on a class assignment. */
export type FeeAssignmentAction =
  | { type: "publish"; id: string }
  | { type: "unpublish"; id: string }
  | { type: "archive"; id: string }
  | { type: "restore"; id: string };

/**
 * Publishes, unpublishes, archives or restores an assignment and refreshes the
 * assignment list and the expected/outstanding totals.
 *
 * @returns Mutation whose `mutate` takes a `FeeAssignmentAction`.
 */
export function useFeeAssignmentAction(): UseMutationResult<
  FeeAssignment,
  unknown,
  FeeAssignmentAction
> {
  const invalidate = useInvalidateFees();
  return useMutation({
    mutationFn: (action: FeeAssignmentAction) => {
      switch (action.type) {
        case "publish":
          return publishFeeAssignment(action.id);
        case "unpublish":
          return unpublishFeeAssignment(action.id);
        case "archive":
          return archiveFeeAssignment(action.id);
        case "restore":
          return restoreFeeAssignment(action.id);
      }
    },
    onSuccess: async (_assignment, action) => {
      const message =
        action.type === "publish"
          ? "Fee assignment published"
          : action.type === "unpublish"
            ? "Fee assignment unpublished"
            : action.type === "archive"
              ? "Assignment archived"
              : "Assignment restored";
      toast.success(message);
      await invalidate.assignments();
    },
    onError: (error) => reportFailure(error, "Could not update the assignment"),
  });
}

/**
 * Assigns a fee to one or more classes. The caller reports success, because
 * only it knows whether this was the assign wizard or the create form.
 *
 * @returns Mutation resolving to the assigned/skipped counts.
 */
export function useAssignFee(): UseMutationResult<AssignFeeResult, unknown, AssignFeePayload> {
  const invalidate = useInvalidateFees();
  return useMutation({
    mutationFn: (payload: AssignFeePayload) => assignFeeToClasses(payload),
    onSuccess: async () => {
      await invalidate.assignments();
    },
    onError: (error) => reportFailure(error, "Could not assign the fee"),
  });
}

// ─── Receipt settings ─────────────────────────────────────────────────────────

/** Saving the signature name/title, clearing it, or uploading a new image. */
export type ReceiptSettingsAction =
  | { type: "save"; signatureName: string; signatureTitle: string }
  | { type: "clear" }
  | { type: "upload"; file: File; signatureName: string; signatureTitle: string };

/**
 * Saves, clears or replaces the signature printed on receipts. An upload is
 * two calls — the image, then the settings that point at it.
 *
 * @returns Mutation whose `mutate` takes a `ReceiptSettingsAction`.
 */
export function useReceiptSettingsAction(): UseMutationResult<
  ReceiptSettings,
  unknown,
  ReceiptSettingsAction
> {
  const invalidate = useInvalidateFees();
  return useMutation({
    mutationFn: async (action: ReceiptSettingsAction) => {
      if (action.type === "clear") {
        return updateReceiptSettings({ signatureUrl: "", signatureName: "", signatureTitle: "" });
      }
      if (action.type === "save") {
        return updateReceiptSettings({
          signatureName: action.signatureName,
          signatureTitle: action.signatureTitle,
        });
      }
      const { url } = await uploadReceiptSignature(action.file);
      return updateReceiptSettings({
        signatureUrl: url,
        signatureName: action.signatureName,
        signatureTitle: action.signatureTitle,
      });
    },
    onSuccess: async (_settings, action) => {
      const message =
        action.type === "clear"
          ? "Signature removed"
          : action.type === "upload"
            ? "Signature uploaded"
            : "Signature settings saved";
      toast.success(message);
      await invalidate.receiptSettings();
    },
    onError: (error) => reportFailure(error, "Could not save the signature settings"),
  });
}
