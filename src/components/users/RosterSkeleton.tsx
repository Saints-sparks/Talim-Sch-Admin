"use client";

import React from "react";
import { card, skeletonBlock } from "@/components/tl";
import { rosterGrid } from "./parts";

/**
 * A roster's grid of person cards while it loads: pulsing avatar, name, two
 * pills and the button, in the same grid as the loaded cards, announced once
 * to screen readers.
 *
 * @param props - What is loading and how many cards to draw.
 * @param props.label - Read to screen readers ("Loading students").
 * @param props.cards - How many cards; default 8.
 * @returns The skeleton.
 */
export function RosterSkeleton({ label, cards = 8 }: { label: string; cards?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label={label}>
      <span className="sr-only">{label}…</span>
      <div aria-hidden className={rosterGrid}>
        {Array.from({ length: cards }).map((_, index) => (
          <div key={index} className={`${card} flex flex-col items-center gap-3`}>
            <div className={`${skeletonBlock} h-16 w-16 rounded-full`} />
            <div className={`${skeletonBlock} h-5 w-32 rounded`} />
            <div className={`${skeletonBlock} h-4 w-24 rounded`} />
            <div className="flex gap-1.5">
              <div className={`${skeletonBlock} h-6 w-14 rounded-full`} />
              <div className={`${skeletonBlock} h-6 w-14 rounded-full`} />
            </div>
            <div className={`${skeletonBlock} h-11 w-full rounded-[11px]`} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default RosterSkeleton;
