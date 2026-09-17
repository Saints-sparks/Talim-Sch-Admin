"use client";

import React from "react";
import { CheckCircle2, Search, UserRound, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ParentGenderFilter,
  ParentSortOrder,
  ParentsStats,
  ParentStatusFilter,
} from "@/app/services/parent.service";

/** Zeroed stats, shown until the first page lands. */
export const emptyParentStats: ParentsStats = {
  totalParents: 0,
  activeParents: 0,
  inactiveParents: 0,
  totalChildren: 0,
};

/** The four headline counters above the parents table. */
export function ParentStatCards({ stats }: { stats: ParentsStats }) {
  const cards = [
    {
      label: "Total Parents",
      value: stats.totalParents,
      icon: UsersRound,
      tone: "bg-blue-50 text-[#003366] dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      label: "Active Parents",
      value: stats.activeParents,
      icon: CheckCircle2,
      tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    {
      label: "Inactive Parents",
      value: stats.inactiveParents,
      icon: UserRound,
      tone: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    {
      label: "Total Children",
      value: stats.totalChildren,
      icon: UsersRound,
      tone: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:gap-4 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm sm:p-5"
          >
            <div className="flex items-center gap-4">
              <div className={cn("rounded-2xl p-3", card.tone)}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-950 dark:text-white">{card.value}</p>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

interface ParentFiltersBarProps {
  /** Raw search text, bound to the input. */
  search: string;
  /** Called on every keystroke; the request waits for the debounce. */
  onSearchChange: (value: string) => void;
  /** Selected status. */
  status: ParentStatusFilter;
  /** Called with the new status. */
  onStatusChange: (value: ParentStatusFilter) => void;
  /** Selected gender. */
  gender: ParentGenderFilter;
  /** Called with the new gender. */
  onGenderChange: (value: ParentGenderFilter) => void;
  /** Selected sort order. */
  sortBy: ParentSortOrder;
  /** Called with the new sort order. */
  onSortChange: (value: ParentSortOrder) => void;
}

const selectClass =
  "h-11 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm font-semibold text-slate-700 dark:text-slate-300";

/** Search, status, gender and sort — all applied by the API, not the browser. */
export function ParentFiltersBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  gender,
  onGenderChange,
  sortBy,
  onSortChange,
}: ParentFiltersBarProps) {
  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_180px_180px_180px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search parents..."
            aria-label="Search parents by name, email or phone"
            className="h-11 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 pl-10 pr-4 text-sm focus:border-[#003366] dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30"
          />
        </div>
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(event) => onStatusChange(event.target.value as ParentStatusFilter)}
          className={selectClass}
        >
          <option value="all">Status: All</option>
          <option value="active">Status: Active</option>
          <option value="inactive">Status: Inactive</option>
        </select>
        <select
          aria-label="Filter by gender"
          value={gender}
          onChange={(event) => onGenderChange(event.target.value as ParentGenderFilter)}
          className={selectClass}
        >
          <option value="all">Gender: All</option>
          <option value="female">Gender: Female</option>
          <option value="male">Gender: Male</option>
          <option value="other">Gender: Other</option>
        </select>
        <select
          aria-label="Sort parents"
          value={sortBy}
          onChange={(event) => onSortChange(event.target.value as ParentSortOrder)}
          className={selectClass}
        >
          <option value="az">Sort by: A - Z</option>
          <option value="za">Sort by: Z - A</option>
          <option value="joined_desc">Newest first</option>
          <option value="joined_asc">Oldest first</option>
        </select>
      </div>
    </section>
  );
}
