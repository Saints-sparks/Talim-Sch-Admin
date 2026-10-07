"use client";

import { HelpScreen } from "@/components/support/HelpScreen";

/**
 * `/help`: Help & support, with "Contact Talim support" (the admin's own
 * tickets to Talim) and the version. Open to every signed-in admin.
 *
 * @returns The help page.
 */
export default function HelpPage() {
  return <HelpScreen />;
}
