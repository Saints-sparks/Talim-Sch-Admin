"use client";

import React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Permission } from "@/lib/permissions";
import { PermissionGate } from "@/components/auth/PermissionGate";

/**
 * The pair of "start a transfer" links.
 *
 * Both open a wizard that ends in a write, so they are behind `manage:transit`
 * — an admin who cannot act never reaches a form the API would refuse.
 */
export function NewTransferButtons() {
  return (
    <PermissionGate permission={Permission.MANAGE_TRANSIT}>
      <div className="flex gap-3">
        <Link
          href="/transit/transfers/new/target"
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#003366] dark:border-sky-500 text-[#003366] dark:text-sky-400 text-sm font-medium transition-colors hover:bg-[#003366]/5 dark:hover:bg-sky-500/10"
        >
          <Plus className="w-4 h-4" />
          Pull Transfer
        </Link>
        <Link
          href="/transit/transfers/new/source"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#003366] text-white text-sm font-medium transition-colors hover:bg-[#003366]/90"
        >
          <Plus className="w-4 h-4" />
          Push Transfer
        </Link>
      </div>
    </PermissionGate>
  );
}
