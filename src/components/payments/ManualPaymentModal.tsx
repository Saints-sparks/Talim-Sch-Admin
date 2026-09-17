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
import {
  refLabel,
  useClassFeeAssignments,
  useStudentsInClass,
} from "@/hooks/finance/useManualPaymentOptions";

/**
 * Records a payment taken outside the platform.
 *
 * The student and the fees being settled are picked from real lists rather
 * than typed as Mongo ids: the backend takes both as ids, and a mistyped one
 * credits the wrong child with no way for the server to notice. The selects
 * load in order — class, then that class's roster and its active fee
 * assignments — so nothing is ever populated with the wrong class's data.
 *
 * @param props - Close handler; fires after a successful record too.
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

  const students = useStudentsInClass(classId);
  const assignments = useClassFeeAssignments(classId);

  // Changing class invalidates everything picked from the old one.
  useEffect(() => {
    setStudentId("");
    setSelectedFeeIds([]);
  }, [classId]);

  const selectedTotal = useMemo(
    () =>
      (assignments.data ?? [])
        .filter((assignment) => selectedFeeIds.includes(assignment._id))
        .reduce((total, assignment) => total + (assignment.amount ?? 0), 0),
    [assignments.data, selectedFeeIds]
  );

  // The amount defaults to what the selected fees add up to; the admin can
  // override it for a part payment.
  useEffect(() => {
    if (!amountTouched) setAmount(selectedTotal > 0 ? String(selectedTotal) : "");
  }, [selectedTotal, amountTouched]);

  const amountValue = Number.parseFloat(amount) || 0;
  const canSubmit =
    Boolean(studentId) && selectedFeeIds.length > 0 && amountValue > 0 && !record.isPending;

  const toggleFee = (assignmentId: string) => {
    setSelectedFeeIds((current) =>
      current.includes(assignmentId)
        ? current.filter((id) => id !== assignmentId)
        : [...current, assignmentId]
    );
  };

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

  const fieldClass =
    "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#003366]/30 disabled:opacity-60";

  return (
    <ModalShell title="Record Manual Payment" onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label htmlFor="manual-class" className="text-sm font-medium text-gray-700 mb-1 block">
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
          <label htmlFor="manual-student" className="text-sm font-medium text-gray-700 mb-1 block">
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
            <p className="text-xs text-red-500 mt-1">Couldn&apos;t load this class&apos;s students.</p>
          )}
        </div>

        <div>
          <span className="text-sm font-medium text-gray-700 mb-1 block">Fees being paid</span>
          {!classId ? (
            <p className="text-xs text-gray-400">Pick a class to see its fees.</p>
          ) : assignments.isPending ? (
            <p className="text-xs text-gray-400">Loading fees…</p>
          ) : assignments.isError ? (
            <p className="text-xs text-red-500">Couldn&apos;t load this class&apos;s fees.</p>
          ) : (assignments.data ?? []).length === 0 ? (
            <p className="text-xs text-amber-600 flex items-start gap-1">
              <AlertCircle size={12} className="mt-0.5 shrink-0" />
              This class has no active fee assignments, so there is nothing to record a payment
              against.
            </p>
          ) : (
            <div className="max-h-44 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
              {(assignments.data ?? []).map((assignment) => (
                <label
                  key={assignment._id}
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedFeeIds.includes(assignment._id)}
                    onChange={() => toggleFee(assignment._id)}
                    className="w-4 h-4 rounded border-gray-300 text-[#003366] focus:ring-[#003366]/30"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-gray-800 truncate">
                      {refLabel(assignment.feeItemId, (item) => item.name)}
                    </span>
                    <span className="block text-xs text-gray-400">
                      Due {formatDate(assignment.dueDate)}
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-gray-700 shrink-0">
                    {formatNaira(assignment.amount)}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="manual-amount" className="text-sm font-medium text-gray-700 mb-1 block">
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
          />
          {selectedTotal > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              Selected fees total {formatNaira(selectedTotal)}
              {amountValue > 0 && amountValue !== selectedTotal
                ? " — recording a different amount as a part payment"
                : ""}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="manual-method" className="text-sm font-medium text-gray-700 mb-1 block">
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
          <label htmlFor="manual-reference" className="text-sm font-medium text-gray-700 mb-1 block">
            Reference <span className="text-gray-400 font-normal">(optional)</span>
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
          <label htmlFor="manual-notes" className="text-sm font-medium text-gray-700 mb-1 block">
            Notes <span className="text-gray-400 font-normal">(optional)</span>
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

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex-1 py-2.5 bg-[#003366] text-white rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            {record.isPending ? "Recording…" : "Record Payment"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
