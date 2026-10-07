"use client";

import { DeskQueue } from "@/components/support/DeskQueue";

/**
 * `/support`: the school's support desk (v1.5 §1). The route guard requires
 * `manage:support` (the school admin holds it implicitly).
 *
 * @returns The desk.
 */
export default function SupportDeskPage() {
  return <DeskQueue />;
}
