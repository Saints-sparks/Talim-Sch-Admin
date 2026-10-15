"use client";

import React from "react";
import { FullAdminOnly } from "@/components/settings/imports/FullAdminOnly";
import { HistoryImportPage } from "@/components/settings/imports/HistoryImportPage";

/** `/settings/import` — Settings → Data → Import past records (school admin only). */
export default function ImportPastRecordsPage() {
  return (
    <FullAdminOnly>
      <HistoryImportPage />
    </FullAdminOnly>
  );
}
