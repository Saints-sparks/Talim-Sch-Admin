"use client";

import React from "react";
import { Building2, ChevronRight, Clock, FileText, GraduationCap, Lock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  classLabel,
  refLabel,
  studentLabel,
  type TransferAbilities,
  type TransferRequest,
} from "@/app/services/transit.service";
import { DetailCard, InfoRow, surface, text } from "@/components/transit/ui";
import { formatTransitDate } from "@/components/transit/transferStatus";

/**
 * The read-only detail of a transfer, as the signed-in school is allowed to
 * see it.
 *
 * The receiving school gets the student's name and admission number while the
 * request is open, and their academic detail only once the current school has
 * released them — the same line the API draws. Nothing here reaches for a field
 * the response withheld.
 */
export function TransferSummary({
  transfer,
  abilities,
}: {
  transfer: TransferRequest;
  abilities: TransferAbilities;
}) {
  const student = typeof transfer.studentId === "string" ? null : transfer.studentId;
  const withheld = abilities.isTarget && !abilities.studentRecordReleased;
  const documents = transfer.documents ?? [];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DetailCard title="Student" icon={User}>
          <InfoRow label="Name" value={studentLabel(transfer.studentId)} />
          {student?.admissionNumber && (
            <InfoRow label="Admission Number" value={student.admissionNumber} />
          )}
          {!withheld && student?.gradeLevel && (
            <InfoRow label="Grade Level" value={student.gradeLevel} />
          )}
          {withheld && (
            <p className={cn("mt-3 flex items-start gap-2 rounded-lg p-3 text-xs", surface.inset, text.muted)}>
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              The student&apos;s academic record stays with their current school until it releases
              them.
            </p>
          )}
        </DetailCard>

        <DetailCard title="Schools" icon={Building2}>
          <InfoRow label="Source School" value={refLabel(transfer.sourceSchoolId)} />
          <InfoRow label="Target School" value={refLabel(transfer.targetSchoolId)} />
          <InfoRow label="Source Class" value={classLabel(transfer.sourceClassId)} />
        </DetailCard>

        <DetailCard title="Target Details" icon={GraduationCap}>
          <InfoRow label="Target Class" value={classLabel(transfer.targetClassId)} />
          <InfoRow label="Academic Year" value={refLabel(transfer.targetAcademicYearId)} />
          <InfoRow
            label="Initiated By"
            value={
              <span className="capitalize">
                {transfer.initiatedBy === "source" ? "Source school (push)" : "Target school (pull)"}
              </span>
            }
          />
          {transfer.reason && <InfoRow label="Reason" value={transfer.reason} />}
        </DetailCard>

        <DetailCard title="Timeline" icon={Clock}>
          <InfoRow label="Submitted" value={formatTransitDate(transfer.createdAt, true)} />
          {transfer.sourceApprovedAt && (
            <InfoRow
              label="Source Approved"
              value={formatTransitDate(transfer.sourceApprovedAt, true)}
            />
          )}
          {transfer.targetApprovedAt && (
            <InfoRow
              label="Target Approved"
              value={formatTransitDate(transfer.targetApprovedAt, true)}
            />
          )}
          {transfer.acceptedAt && (
            <InfoRow label="Accepted" value={formatTransitDate(transfer.acceptedAt, true)} />
          )}
          {transfer.notes && (
            <div className={cn("mt-3 rounded-lg p-3", surface.inset)}>
              <p className={cn("text-xs mb-1", text.muted)}>Notes</p>
              <p className={cn("text-sm", text.body)}>{transfer.notes}</p>
            </div>
          )}
        </DetailCard>
      </div>

      {documents.length > 0 && (
        <DetailCard title="Attached Documents" icon={FileText}>
          <div className="space-y-2">
            {documents.map((url, index) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn("flex items-center gap-2 text-sm hover:underline", text.brand)}
              >
                <FileText className="w-4 h-4" />
                Document {index + 1}
                <ChevronRight className="w-3 h-3 ml-auto" />
              </a>
            ))}
          </div>
        </DetailCard>
      )}
    </>
  );
}
