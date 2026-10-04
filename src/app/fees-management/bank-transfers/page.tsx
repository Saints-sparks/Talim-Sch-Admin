"use client";

import { RequirePermission } from "@/components/auth/PermissionGate";
import { BankTransfersScreen } from "@/components/payments/bankTransfers/BankTransfersScreen";
import { Permission } from "@/lib/permissions";

/**
 * `/fees-management/bank-transfers`: reconciling the bank transfers parents
 * reported (C4). Reconciling is fee work, so the page needs `manage:fees`, the
 * permission the backend's bank-transfer routes require (the route guard
 * checks the same through the `/fees-management` prefix).
 *
 * @returns The guarded reconciliation page.
 */
export default function BankTransfersPage() {
  return (
    <RequirePermission permission={Permission.MANAGE_FEES}>
      <BankTransfersScreen />
    </RequirePermission>
  );
}
