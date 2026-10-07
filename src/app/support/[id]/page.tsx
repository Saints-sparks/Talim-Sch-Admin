"use client";

import { useParams } from "next/navigation";
import { DeskTicketScreen } from "@/components/support/DeskTicketScreen";

/**
 * `/support/:id`: one ticket at the school desk.
 *
 * @returns The ticket screen.
 */
export default function SupportTicketPage() {
  const params = useParams<{ id: string }>();
  return <DeskTicketScreen ticketId={String(params?.id ?? "")} />;
}
