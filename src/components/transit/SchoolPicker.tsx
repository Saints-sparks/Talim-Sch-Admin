"use client";

import React, { useState } from "react";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchSchoolResult } from "@/app/services/transit.service";
import { useDebouncedValue } from "@/hooks/transit/useTransitUi";
import { useSchoolSearch } from "@/hooks/transit/useStudentSnapshot";
import { SkeletonRows, surface, text } from "@/components/transit/ui";
import { TransitErrorState } from "@/components/transit/TransitStates";

/** Searches Talim schools by name and picks one, with the query debounced. */
export function SchoolPicker({
  placeholder,
  selected,
  onSelect,
}: {
  placeholder: string;
  selected: SearchSchoolResult | null;
  onSelect: (school: SearchSchoolResult) => void;
}) {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query);
  const { data, isFetching, isError, error, refetch } = useSchoolSearch(debounced);
  const schools = data ?? [];
  const searching = debounced.trim().length >= 2;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", text.muted)} />
        <input
          type="search"
          aria-label={placeholder}
          placeholder={placeholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className={cn("w-full pl-9 pr-4 py-2.5 text-sm rounded-lg", surface.input)}
        />
      </div>

      {searching && isFetching && <SkeletonRows count={2} height="h-12" />}

      {searching && isError && (
        <TransitErrorState
          error={error}
          onRetry={() => refetch()}
          fallbackTitle="We couldn't search schools"
        />
      )}

      {searching && !isFetching && !isError && schools.length === 0 && (
        <p className={cn("text-sm text-center py-4", text.muted)}>No school matches that name.</p>
      )}

      {schools.length > 0 && !isFetching && (
        <div className={cn("rounded-lg overflow-hidden divide-y", surface.card, surface.divide)}>
          {schools.map((school) => (
            <button
              key={school._id}
              type="button"
              onClick={() => onSelect(school)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/60",
                selected?._id === school._id && "bg-[#003366]/5 dark:bg-sky-500/10"
              )}
            >
              <span className="min-w-0">
                <span className={cn("block text-sm font-medium truncate", text.strong)}>
                  {school.name}
                </span>
                {school.address && (
                  <span className={cn("block text-xs truncate", text.muted)}>{school.address}</span>
                )}
              </span>
              {selected?._id === school._id && (
                <Check className={cn("w-4 h-4 ml-auto shrink-0", text.brand)} />
              )}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <p className="rounded-lg border border-green-100 dark:border-green-500/30 bg-green-50 dark:bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-300">
          Selected: <span className="font-semibold">{selected.name}</span>
        </p>
      )}
    </div>
  );
}
