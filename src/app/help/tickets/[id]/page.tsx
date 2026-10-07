"use client";

import { useParams } from "next/navigation";
import { MyTicketScreen } from "@/components/support/MyTicketScreen";

/**
 * `/help/tickets/:id`: one of the admin's own tickets to Talim.
 *
 * @returns The ticket screen.
 */
export default function HelpTicketPage() {
  const params = useParams<{ id: string }>();
  return <MyTicketScreen ticketId={String(params?.id ?? "")} />;
}
