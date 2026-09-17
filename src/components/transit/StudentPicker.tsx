"use client";

import React, { useMemo, useState } from "react";
import { Check, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { filterStudents, type StudentOption } from "@/hooks/transit/useTransitReference";
import { SkeletonRows, surface, text } from "@/components/transit/ui";
import { TransitErrorState } from "@/components/transit/TransitStates";

/** Picks one of this school's students, by name or admission number. */
export function StudentPicker({
  students,
  isLoading,
  isError,
  error,
  onRetry,
  selectedId,
  onSelect,
}: {
  students: StudentOption[];
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  onRetry?: () => void;
  selectedId?: string;
  onSelect: (student: StudentOption) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => filterStudents(students, search), [students, search]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", text.muted)} />
        <input
          type="search"
          aria-label="Search students by name or admission number"
          placeholder="Search by name or admission number..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className={cn("w-full pl-9 pr-4 py-2.5 text-sm rounded-lg", surface.input)}
        />
      </div>

      {isLoading && <SkeletonRows count={3} height="h-12" />}

      {isError && (
        <TransitErrorState
          error={error}
          onRetry={onRetry}
          fallbackTitle="We couldn't load your students"
        />
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div
          className={cn(
            "rounded-lg overflow-hidden max-h-64 overflow-y-auto divide-y",
            surface.card,
            surface.divide
          )}
        >
          {filtered.map((student) => (
            <button
              key={student._id}
              type="button"
              onClick={() => onSelect(student)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/60",
                selectedId === student._id && "bg-[#003366]/5 dark:bg-sky-500/10"
              )}
            >
              <span className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center bg-[#003366]/10 dark:bg-sky-500/15">
                <User className={cn("w-4 h-4", text.brand)} />
              </span>
              <span className="min-w-0">
                <span className={cn("block text-sm font-medium truncate", text.strong)}>
                  {`${student.firstName} ${student.lastName}`.trim() ||
                    student.admissionNumber ||
                    "Unnamed student"}
                </span>
                <span className={cn("block text-xs truncate", text.muted)}>
                  {[student.admissionNumber, student.gradeLevel, student.className]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
              {selectedId === student._id && (
                <Check className={cn("w-4 h-4 ml-auto shrink-0", text.brand)} />
              )}
            </button>
          ))}
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <p className={cn("text-sm text-center py-4", text.muted)}>
          {students.length === 0
            ? "No students in this school yet."
            : "No student matches that search."}
        </p>
      )}
    </div>
  );
}
