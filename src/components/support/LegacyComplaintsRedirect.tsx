"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/permissions";
import { PageSkeleton } from "@/components/tl/states";
import { HELP_HREF, SUPPORT_DESK_HREF, ticketHref } from "./ticket.presentation";

/**
 * Where an old complaints link should go now that complaints are support
 * tickets (v1.5 §1): desk staff to the support desk, everyone else to their
 * own tickets in Help & support.
 *
 * @param canStaffDesk - Whether the admin holds `manage:support`.
 * @param ticketId - The complaint (ticket) id from an old detail link, if any.
 * @returns The path.
 */
export function legacyComplaintTarget(canStaffDesk: boolean, ticketId?: string): string {
  if (ticketId) return ticketHref(ticketId, canStaffDesk ? "desk" : "requester");
  return canStaffDesk ? SUPPORT_DESK_HREF : HELP_HREF;
}

/**
 * The old `/complaints` pages, replaced by the support desk: sends the visitor
 * on with `router.replace`, so Back does not return here.
 *
 * @param props - The ticket id from an old detail link.
 * @param props.ticketId - The id, if any.
 * @returns A skeleton while redirecting.
 */
export function LegacyComplaintsRedirect({ ticketId }: { ticketId?: string }) {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const target = legacyComplaintTarget(hasPermission(Permission.MANAGE_SUPPORT), ticketId);
  useEffect(() => {
    router.replace(target);
  }, [router, target]);
  return <PageSkeleton label="Opening support" blocks={[320]} />;
}
