"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, Download } from "lucide-react";
import { HISTORY_IMPORT_GUIDE } from "@/content/historyImportGuide";
import { FullAdminOnly } from "@/components/settings/imports/FullAdminOnly";
import { GuideMarkdown, parseMarkdown } from "@/components/settings/imports/GuideMarkdown";
import { Page, PageHeader, card, ghostButton, textLink } from "@/components/tl";

/**
 * The import guide: the backend's `docs/history-import-guide.md`, copied into
 * the app by `npm run guide:import`. Its first heading is the page title.
 *
 * @returns The guide.
 */
function ImportGuide() {
  const { title, blocks } = useMemo(() => {
    const parsed = parseMarkdown(HISTORY_IMPORT_GUIDE);
    const first = parsed[0];
    return first?.kind === "heading" && first.level === 1
      ? { title: first.text, blocks: parsed.slice(1) }
      : { title: "Importing your past records", blocks: parsed };
  }, []);

  return (
    <Page>
      <div>
        <Link href="/settings/import" className={textLink}>
          <ChevronLeft className="h-4 w-4" aria-hidden /> Import past records
        </Link>
      </div>
      <PageHeader
        eyebrowText="Settings · Data · Guide"
        title={title}
        actions={
          <Link href="/settings/import" className={ghostButton}>
            <Download className="h-4 w-4" aria-hidden /> Template and upload
          </Link>
        }
      />
      <article className={`${card} max-w-[920px]`}>
        <GuideMarkdown blocks={blocks} />
      </article>
    </Page>
  );
}

/** `/settings/import/guide` — how to fill in the past-records template (school admin only). */
export default function ImportGuidePage() {
  return (
    <FullAdminOnly>
      <ImportGuide />
    </FullAdminOnly>
  );
}
