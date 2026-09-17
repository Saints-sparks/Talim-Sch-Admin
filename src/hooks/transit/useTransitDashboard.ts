/** The transit overview counters, cached per school. */
"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { staleTimes } from "@/lib/queryKeys";
import { useSchoolId } from "@/hooks/useSchoolId";
import { transitKeys } from "@/hooks/transit/keys";
import { getTransitDashboard, type TransitDashboard } from "@/app/services/transit.service";

/**
 * Pending transfers, open promotion runs and enrollment counts for this school.
 *
 * @returns Query result; counters are always numbers once loaded.
 */
export function useTransitDashboard(): UseQueryResult<TransitDashboard> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: transitKeys.dashboard(schoolId ?? "none"),
    queryFn: getTransitDashboard,
    enabled: Boolean(schoolId),
    staleTime: staleTimes.list,
  });
}
