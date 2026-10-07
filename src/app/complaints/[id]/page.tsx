"use client";

import { useParams } from "next/navigation";
import { LegacyComplaintsRedirect } from "@/components/support/LegacyComplaintsRedirect";

/**
 * `/complaints/:id`: an old complaint link, now a support ticket (the same
 * record). Opens it on the desk, or in Help & support for its requester.
 *
 * @returns The redirect.
 */
export default function ComplaintDetailsPage() {
  const params = useParams<{ id: string }>();
  return <LegacyComplaintsRedirect ticketId={params?.id ? String(params.id) : undefined} />;
}
