"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { toast } from "@/components/CustomToast";
import { logger } from "@/lib/logger";
import { ModalShell } from "@/components/finance/ModalShell";
import { financeActionMessage } from "@/components/finance/financeErrors";
import { formatDate, formatNaira } from "@/components/finance/formatters";
import { MANUAL_PAYMENT_METHODS } from "@/app/services/payments.service";
import { useClasses } from "@/hooks/queries/reference";
import { useCreateManualPayment } from "@/hooks/finance/usePaymentsQueries";
import { useStudentFeeLedger } from "@/hooks/fees/queries";
import {
  refLabel,
  useClassFeeAssignments,
  useStudentsInClass,
} from "@/hooks/finance/useManualPaymentOptions";
import { LedgerStatusBadge } from "@/components/fees/LedgerStatusBadge";
import { WalletSourceNote } from "@/components/finance/WalletSourceNote";
import {
  fieldControl,
  fieldError,
  fieldHint,
  fieldLabel,
  ghostButton,
  primaryButton,
} from "@/components/tl";
import {
  feeBalance,
  feeBalanceSummary,
  ledgerByAssignment,
  manualAmountProblem,
  totalOwed,
  type FeeBalance,
} from "@/components/fees/partPayments";

/**
 * Today as `YYYY-MM-DD` in the browser's timezone, for the "Paid on" field.
 *
 * @returns Today's date.
 */
function todayInputValue(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * Records a payment taken outside the platform.
 *
 * The student and the fees being settled are picked from real lists rather
 * than typed as Mongo ids: the backend takes both as ids, and a mistyped one
 * credits the wrong child with no way for the server to notice. The selects
 * load in order — class, then that class's roster and its active fee
 * assignments — so nothing is ever populated with the wrong class's data.
 *
 * Once a student is chosen, their fee ledger (one request; unpaid fees are
 * filled in by the API, late fees included) shows each fee as paid, part paid
 * or unpaid with what is still owed; a fee paid in full
 * cannot be picked, the amount defaults to the balance and may not exceed it
 * (the API refuses an overpayment).
 *
 * @param props - Close handler; fires after a successful record too.
 * @param props.onClose - Closes the modal.
 * @returns The manual payment modal.
 */
export function ManualPaymentModal({ onClose }: { onClose: () => void }) {
  const classes = useClasses();
  const record = useCreateManualPayment();

  const [classId, setClassId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([]);
  const [amount, setAmount] = useState("");
  const [amountTouched, setAmountTouched] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>(MANUAL_PAYMENT_METHODS[0].value);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [paidOn, setPaidOn] = useState(todayInputValue);
  const today = todayInputValue();

  const students = useStudentsInClass(classId);
  const assignments = useClassFeeAssignments(classId);
  const ledger = useStudentFeeLedger(studentId);

  // Changing class invalidates everything picked from the old one.
  useEffect(() => {
    setStudentId("");
    setSelectedFeeIds([]);
  }, [classId]);

  // Each fee's position for the chosen student, from one ledger read.
  const balances = useMemo(() => {
    const rows = ledgerByAssignment(ledger.data);
    const map = new Map<string, FeeBalance>();
    for (const assignment of assignments.data ?? []) {
      map.set(
        assignment._id,
        feeBalance(assignment, studentId ? rows.get(assignment._id) : undefined)
      );
    }
    return map;
  }, [assignments.data, ledger.data, studentId]);

  // A fee the ledger says is paid in full can't be selected; drop it if it was.
  useEffect(() => {
    setSelectedFeeIds((current) => {
      const next = current.filter((id) => (balances.get(id)?.balance ?? 0) > 0);
      return next.length === current.length ? current : next;
    });
  }, [balances]);

  const owed = useMemo(
    () =>
      totalOwed(
        selectedFeeIds.map((id) => balances.get(id)).filter((b): b is FeeBalance => Boolean(b))
      ),
    [balances, selectedFeeIds]
  );

  // The amount defaults to what the selected fees still owe; the admin can
  // lower it for a part payment.
  useEffect(() => {
    if (!amountTouched) setAmount(owed > 0 ? String(owed) : "");
  }, [owed, amountTouched]);

  const amountValue = Number.parseFloat(amount) || 0;
  const amountProblem =
    selectedFeeIds.length > 0 && amount !== "" ? manualAmountProblem(amountValue, owed) : null;
  const paidOnProblem = paidOn > today ? "The payment date can't be in the future." : null;
  const canSubmit =
    Boolean(studentId) &&
    selectedFeeIds.length > 0 &&
    !amountProblem &&
    !paidOnProblem &&
    amountValue > 0 &&
    !record.isPending;

  /**
   * Ticks or unticks one fee.
   *
   * @param assignmentId - The fee assignment.
   */
  const toggleFee = (assignmentId: string) => {
    setSelectedFeeIds((current) =>
      current.includes(assignmentId)
        ? current.filter((id) => id !== assignmentId)
        : [...current, assignmentId]
    );
  };

  /**
   * Records the payment and reports the receipt.
   *
   * @param event - The form's submit event.
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    try {
      const result = await record.mutateAsync({
        studentId,
        feeAssignmentIds: selectedFeeIds,
        amount: amountValue,
        paymentMethod,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
        // Today means "now" (the server's default); an earlier day is sent as that day.
        paidAt: paidOn && paidOn !== today ? paidOn : undefined,
      });
      toast.success(
        result.receiptNumber
          ? `Payment recorded — receipt ${result.receiptNumber}`
          : "Payment recorded"
      );
      onClose();
    } catch (error) {
      logger.error("payments", "manual payment failed", error);
      toast.error(financeActionMessage(error, "Failed to record the payment"));
    }
  };

  const fieldClass = fieldControl;
  const labelClass = `${fieldLabel} mb-1.5 block`;

  return (
    <ModalShell title="Record Manual Payment" onClose={onClose}>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-[18px] px-[clamp(20px,3vw,28px)] py-5"
      >
        <div>
          <label
            htmlFor="manual-class"
            className={labelClass}
          >
            Class
          </label>
          <select
            id="manual-class"
            value={classId}
            onChange={(event) => setClassId(event.target.value)}
            disabled={classes.isPending}
            className={fieldClass}
            required
          >
            <option value="">{classes.isPending ? "Loading classes…" : "Select class"}</option>
            {(classes.data ?? []).map((schoolClass) => (
              <option key={schoolClass._id} value={schoolClass._id}>
                {schoolClass.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="manual-student"
            className={labelClass}
          >
            Student
          </label>
          <select
            id="manual-student"
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            disabled={!classId || students.isPending}
            className={fieldClass}
            required
          >
            <option value="">
              {!classId
                ? "Pick a class first"
                : students.isPending
                  ? "Loading students…"
                  : (students.data ?? []).length === 0
                    ? "No students in this class"
                    : "Select student"}
            </option>
            {(students.data ?? []).map((student) => (
              <option key={student._id} value={student._id}>
                {student.userId?.firstName} {student.userId?.lastName}
                {student.admissionNumber ? ` · ${student.admissionNumber}` : ""}
              </option>
            ))}
          </select>
          {students.isError && (
            <p className={`${fieldError} mt-1.5`}>
              Couldn&apos;t load this class&apos;s students.
            </p>
          )}
        </div>

        <div>
          <span className={labelClass}>Fees being paid</span>
          {!classId ? (
            <p className={fieldHint}>Pick a class to see its fees.</p>
          ) : assignments.isPending ? (
            <p className={fieldHint}>Loading fees…</p>
          ) : assignments.isError ? (
            <p className={fieldError}>Couldn&apos;t load this class&apos;s fees.</p>
          ) : (assignments.data ?? []).length === 0 ? (
            <p className="flex items-start gap-1.5 rounded-xl bg-tl-warning-bg px-3 py-2 text-[13px] text-tl-warning">
              <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden />
              This class has no active fee assignments, so there is nothing to record a payment
              against.
            </p>
          ) : (
            <div className="max-h-64 divide-y divide-tl-line-soft overflow-y-auto rounded-2xl border border-tl-control">
              {(assignments.data ?? []).map((assignment) => {
                const balance = balances.get(assignment._id);
                const settled = Boolean(studentId && balance?.fromLedger && balance.balance <= 0);
                const name = refLabel(assignment.feeItemId, (item) => item.name);
                return (
                  <label
                    key={assignment._id}
                    className={`flex min-h-[56px] items-center gap-3 px-3.5 py-2.5 ${
                      settled ? "cursor-not-allowed bg-tl-subtle" : "cursor-pointer hover:bg-tl-subtle"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFeeIds.includes(assignment._id)}
                      onChange={() => toggleFee(assignment._id)}
                      disabled={settled}
                      aria-describedby={`fee-balance-${assignment._id}`}
                      className="h-[18px] w-[18px] shrink-0 rounded accent-tl-brand"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-tl-ink">{name}</span>
                      <span
                        id={`fee-balance-${assignment._id}`}
                        className="block text-[13px] text-tl-muted"
                      >
                        Due {formatDate(assignment.dueDate)}
                        {studentId && balance ? ` · ${feeBalanceSummary(balance)}` : ""}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-sm font-extrabold text-tl-ink">
                        {formatNaira(studentId && balance ? balance.due : assignment.amount)}
                      </span>
                      {studentId && balance?.fromLedger && (
                        <LedgerStatusBadge status={balance.status} />
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          {studentId && ledger.isError && (
            <p className="mt-1.5 text-[13px] font-semibold text-tl-warning">
              Couldn&apos;t load this student&apos;s balances; amounts shown are the full fees.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="manual-amount"
            className={labelClass}
          >
            Amount (₦)
          </label>
          <input
            id="manual-amount"
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(event) => {
              setAmountTouched(true);
              setAmount(event.target.value);
            }}
            placeholder="0.00"
            className={fieldClass}
            required
            aria-invalid={amountProblem ? true : undefined}
            aria-describedby="manual-amount-help"
          />
          <div id="manual-amount-help" aria-live="polite">
            {amountProblem ? (
              <p className={`${fieldError} mt-1.5`}>{amountProblem}</p>
            ) : owed > 0 ? (
              <p className={`${fieldHint} mt-1.5`}>
                Still owed on the selected fees: {formatNaira(owed)}
                {amountValue > 0 && amountValue < owed
                  ? " — this is recorded as a part payment, applied to the earliest due fee first"
                  : ""}
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <label
            htmlFor="manual-paid-on"
            className={labelClass}
          >
            Paid on
          </label>
          <input
            id="manual-paid-on"
            type="date"
            value={paidOn}
            max={today}
            onChange={(event) => setPaidOn(event.target.value)}
            className={fieldClass}
            aria-invalid={paidOnProblem ? true : undefined}
            aria-describedby={paidOnProblem ? "manual-paid-on-error" : undefined}
          />
          {paidOnProblem && (
            <p id="manual-paid-on-error" className={`${fieldError} mt-1.5`}>
              {paidOnProblem}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="manual-method"
            className={labelClass}
          >
            Payment Method
          </label>
          <select
            id="manual-method"
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
            className={fieldClass}
          >
            {MANUAL_PAYMENT_METHODS.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="manual-reference"
            className={labelClass}
          >
            Reference <span className="font-medium text-tl-faint">(optional)</span>
          </label>
          <input
            id="manual-reference"
            type="text"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="e.g. bank teller reference"
            className={fieldClass}
          />
        </div>

        <div>
          <label
            htmlFor="manual-notes"
            className={labelClass}
          >
            Notes <span className="font-medium text-tl-faint">(optional)</span>
          </label>
          <input
            id="manual-notes"
            type="text"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Internal note"
            className={fieldClass}
          />
        </div>

        <WalletSourceNote variant="short" />

        <div className="flex flex-wrap gap-2.5 pt-1">
          <button type="button" onClick={onClose} className={`${ghostButton} flex-1`}>
            Cancel
          </button>
          <button type="submit" disabled={!canSubmit} className={`${primaryButton} flex-1`}>
            {record.isPending ? "Recording…" : "Record Payment"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
