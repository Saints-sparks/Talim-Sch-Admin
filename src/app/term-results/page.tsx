"use client";

/**
 * Term Results route: the office's queue of class results waiting to be
 * published (Round 3, §21–§23). Needs `manage:assessments` for a sub-admin
 * (see `routePermissions`).
 */
import React from "react";
import { TermResultsScreen } from "@/components/termResults/TermResultsScreen";

/**
 * Renders the queue.
 *
 * @returns The page.
 */
export default function TermResultsPage() {
  return <TermResultsScreen />;
}
