import React from "react";
import { PageSkeleton } from "@/components/tl";

/**
 * The curriculum dashboard's loading state, in the tl look.
 *
 * Mirrors the real screen — the heading and search, four stat tiles, the
 * section tabs, then the quick actions and recent content cards — so the
 * layout does not jump when the data lands.
 *
 * @returns The skeleton.
 */
const CurriculumSkeleton: React.FC = () => {
  return <PageSkeleton label="Loading curriculum" chips={2} tiles={4} blocks={[180, 320]} />;
};

export default CurriculumSkeleton;
