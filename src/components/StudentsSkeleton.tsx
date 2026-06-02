import React from "react";
import { GridSkeleton, PageSkeleton, SkeletonBox } from "@/components/ui/loading";

const StudentsSkeleton: React.FC = () => {
  return (
    <PageSkeleton>
      <div className="pt-4">
        <GridSkeleton cards={9} />
        <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <SkeletonBox className="h-4 w-32" />
          <div className="flex items-center gap-x-2">
            <SkeletonBox className="h-8 w-20" />
            <SkeletonBox className="h-4 w-16" />
            <SkeletonBox className="h-8 w-16" />
          </div>
        </div>
      </div>
    </PageSkeleton>
  );
};

export default StudentsSkeleton;
