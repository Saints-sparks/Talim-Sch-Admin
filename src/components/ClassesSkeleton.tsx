import React from "react";
import { PageSkeleton, SectionSkeleton, SkeletonBox } from "@/components/ui/loading";

const ClassesSkeleton: React.FC = () => {
  return (
    <PageSkeleton titleWidthClass="w-64" subtitleWidthClass="w-40" showFilterRow={false}>
      <section className="rounded bg-white p-6 shadow">
        <div className="mb-4 flex items-center gap-x-4">
          <SkeletonBox className="h-8 w-32" />
          <SkeletonBox className="h-8 w-20" />
        </div>
        <SectionSkeleton rows={10} rowClassName="h-10" />
        <div className="mt-4 flex items-center justify-between">
          <SkeletonBox className="h-4 w-32" />
          <div className="flex gap-2">
            <SkeletonBox className="h-8 w-20" />
            <SkeletonBox className="h-8 w-8" />
            <SkeletonBox className="h-8 w-8" />
            <SkeletonBox className="h-8 w-8" />
            <SkeletonBox className="h-8 w-20" />
          </div>
        </div>
      </section>
    </PageSkeleton>
  );
};

export default ClassesSkeleton;
