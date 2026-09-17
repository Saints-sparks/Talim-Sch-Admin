"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  classLabel,
  refLabel,
  studentLabel,
  type TransferRequest,
} from "@/app/services/transit.service";
import { surface, text } from "@/components/transit/ui";
import { formatTransitDate } from "@/components/transit/transferStatus";
import { TransferStatusBadge } from "@/components/transit/TransferStatusBadge";

/** The columns, in order, so the head and the body cannot drift apart. */
const COLUMNS = ["Student", "From", "To", "Target Class", "Direction", "Status", "Date"];

/**
 * The transfer list.
 *
 * Scrolls inside its own container so a long list never pushes the filters off
 * the screen, and names each row's direction from the signed-in school's point
 * of view rather than leaving the admin to compare two school names.
 */
export function TransfersTable({
  transfers,
  schoolId,
}: {
  transfers: TransferRequest[];
  schoolId: string | null;
}) {
  const router = useRouter();

  return (
    <div className={cn("rounded-xl shadow-sm overflow-hidden", surface.card)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-sm">
          <thead className={cn("border-b border-gray-100 dark:border-slate-800", surface.tableHead)}>
            <tr>
              {COLUMNS.map((column) => (
                <th key={column} className={cn("px-4 py-3 text-left font-medium", text.muted)}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={cn("divide-y", surface.divide)}>
            {transfers.map((transfer) => {
              const outgoing =
                Boolean(schoolId) &&
                (typeof transfer.sourceSchoolId === "string"
                  ? transfer.sourceSchoolId
                  : transfer.sourceSchoolId._id) === schoolId;
              return (
                <tr
                  key={transfer._id}
                  tabIndex={0}
                  role="link"
                  onClick={() => router.push(`/transit/transfers/${transfer._id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") router.push(`/transit/transfers/${transfer._id}`);
                  }}
                  className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/60"
                >
                  <td className={cn("px-4 py-3 font-medium", text.strong)}>
                    {studentLabel(transfer.studentId)}
                  </td>
                  <td className={cn("px-4 py-3", text.body)}>
                    {refLabel(transfer.sourceSchoolId)}
                  </td>
                  <td className={cn("px-4 py-3", text.body)}>
                    {refLabel(transfer.targetSchoolId)}
                  </td>
                  <td className={cn("px-4 py-3", text.body)}>
                    {classLabel(transfer.targetClassId)}
                  </td>
                  <td className={cn("px-4 py-3", text.body)}>
                    {outgoing ? "Outgoing" : "Incoming"}
                  </td>
                  <td className="px-4 py-3">
                    <TransferStatusBadge status={transfer.status} />
                  </td>
                  <td className={cn("px-4 py-3", text.muted)}>
                    {formatTransitDate(transfer.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
