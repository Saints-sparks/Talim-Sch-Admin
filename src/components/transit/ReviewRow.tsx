"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { text } from "@/components/transit/ui";

/** One label / value line in a wizard's review step. */
export function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span className={cn("text-sm", text.muted)}>{label}</span>
      <span className={cn("text-sm font-medium text-right max-w-[60%]", text.strong)}>{value}</span>
    </div>
  );
}
