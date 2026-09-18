import React from "react";
import { SkeletonBox } from "@/components/ui/loading";

/** How many card placeholders fill the grid — one page of the real list. */
const CARDS = 8;

/**
 * The class list's loading state.
 *
 * Mirrors the real screen — a banner and a grid of class cards — so the layout
 * does not jump when the data lands.
 *
 * @returns The skeleton.
 */
const ClassesSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div
        className="flex-shrink-0 m-6 rounded-2xl px-6 py-6"
        style={{ background: "linear-gradient(to right, #003366, #004488)" }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="h-13 w-13 p-3 bg-white/20 rounded-xl">
              <div className="h-7 w-7 rounded bg-white/40 animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-8 w-64 rounded bg-white/30 animate-pulse" />
              <div className="h-4 w-48 rounded bg-white/20 animate-pulse" />
            </div>
          </div>
          <div className="h-10 w-32 rounded-xl bg-white/30 animate-pulse" />
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: CARDS }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border-2 border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
            >
              <div className="h-12" style={{ background: "linear-gradient(to right, #003366, #004488)" }} />
              <div className="p-4 space-y-3">
                <SkeletonBox className="h-9 w-full dark:bg-slate-800" />
                <SkeletonBox className="h-9 w-full dark:bg-slate-800" />
                <SkeletonBox className="h-9 w-full dark:bg-slate-800" />
                <SkeletonBox className="h-9 w-full dark:bg-slate-800" />
              </div>
              <div className="px-4 pb-4">
                <SkeletonBox className="h-10 w-full rounded-xl dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClassesSkeleton;
