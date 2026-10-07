"use client";

import { LegacyComplaintsRedirect } from "@/components/support/LegacyComplaintsRedirect";

/**
 * `/complaints`: replaced by the support desk (v1.5 §1). Desk staff go to
 * `/support`, everyone else to their own tickets in `/help`.
 *
 * @returns The redirect.
 */
export default function ComplaintsPage() {
  return <LegacyComplaintsRedirect />;
}
