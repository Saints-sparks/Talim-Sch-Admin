"use client";

import Link from "next/link";
import { FiChevronRight } from "react-icons/fi";
import { focusRing } from "@/components/tl";

/**
 * The trail above a fees sub-page: "Fees Management › <page>".
 *
 * @param props - The page the admin is on.
 * @param props.current - Its name ("Create New Fee").
 * @returns The breadcrumb.
 */
export function FeesBreadcrumb({ current }: { current: string }) {
  return (
    <nav aria-label="Breadcrumb" className="-mb-2">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-tl-muted">
        <li>
          <Link
            href="/fees-management"
            className={`inline-flex min-h-[44px] items-center rounded-md text-tl-link hover:underline ${focusRing}`}
          >
            Fees Management
          </Link>
        </li>
        <li aria-hidden className="text-tl-faint">
          <FiChevronRight size={14} />
        </li>
        <li aria-current="page" className="text-tl-body">
          {current}
        </li>
      </ol>
    </nav>
  );
}
