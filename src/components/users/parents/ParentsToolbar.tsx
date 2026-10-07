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
      tone: "bg-tl-select text-tl-brand",
    },
    {
      label: "Active Parents",
      value: stats.activeParents,
      icon: CheckCircle2,
      tone: "bg-tl-success-bg text-tl-success",
    },
    {
      label: "Inactive Parents",
      value: stats.inactiveParents,
      icon: UserRound,
      tone: "bg-tl-warning-bg text-tl-warning",
    },
    {
      label: "Total Children",
      value: stats.totalChildren,
      icon: UsersRound,
      tone: "bg-tl-accent-bg text-tl-accent",
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:gap-4 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-2xl border border-tl-line bg-tl-surface p-4 shadow-sm sm:p-5"
          >
            <div className="flex items-center gap-4">
              <div className={cn("rounded-2xl p-3", card.tone)}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-tl-ink">{card.value}</p>
                <p className="mt-1 text-sm font-medium text-tl-muted">{card.label}</p>
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
  "h-11 rounded-xl border border-tl-line bg-tl-surface px-3 text-sm font-semibold text-tl-body";

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
    <section className="rounded-2xl border border-tl-line bg-tl-surface p-3 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_180px_180px_180px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tl-faint" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search parents..."
            aria-label="Search parents by name, email or phone"
            className="h-11 w-full rounded-xl border border-tl-line bg-tl-surface text-tl-ink placeholder:text-tl-faint pl-10 pr-4 text-sm focus:border-tl-link focus:ring-2 focus:ring-tl-link"
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
