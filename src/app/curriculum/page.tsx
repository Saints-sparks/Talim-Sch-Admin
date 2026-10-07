"use client";

/**
 * Curriculum dashboard — headline numbers, quick actions, the newest
 * curriculum entries and a searchable overview of the school's subjects.
 *
 * Everything on the page is served from the shared caches (`useSubjects`,
 * `useClasses`) plus the curriculum-only queries, so arriving here from another
 * screen costs no request and a subject created in the structure editor shows
 * up without a manual refresh.
 */
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Settings } from "lucide-react";
import CurriculumSkeleton from "@/components/CurriculumSkeleton";
import { CurriculumStatCards } from "@/components/curriculum/CurriculumStatCards";
import { CurriculumQuickActions } from "@/components/curriculum/CurriculumQuickActions";
import { RecentCurriculumContent } from "@/components/curriculum/RecentCurriculumContent";
import { SubjectsOverview } from "@/components/curriculum/SubjectsOverview";
import {
  Page,
  PageHeader,
  SearchField,
  Tabs,
  ghostButton,
  pageStack,
  type TabOption,
} from "@/components/tl";
import { useClasses, useSubjects } from "@/hooks/queries/reference";
import { useCurriculumContents, useCurriculumKpis } from "@/hooks/curriculum/queries";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/permissions";

/** The dashboard's two sections. */
type CurriculumTab = "overview" | "structure";

/** The section tabs, in order. */
const TAB_OPTIONS: readonly TabOption<CurriculumTab>[] = [
  { value: "overview", label: "Overview" },
  { value: "structure", label: "Structure" },
];

/** How many of the newest curriculum entries the dashboard lists. */
const RECENT_LIMIT = 5;

/**
 * The dashboard body; separate so `useSearchParams` sits inside `<Suspense>`.
 * The heading and search, the stat tiles, then the Overview (quick actions
 * and recent content) or Structure (subject tiles) tab.
 *
 * @returns The dashboard.
 */
function CurriculumDashboardMain() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();
  const canManageCurriculum = hasPermission(Permission.MANAGE_CURRICULUM);

  const tabParam = searchParams?.get("tab");
  const [activeTab, setActiveTab] = useState<CurriculumTab>(
    tabParam === "structure" ? "structure" : "overview"
  );
  const [searchTerm, setSearchTerm] = useState("");

  // `?tab=` deep links into a tab; this only mirrors the URL into local state,
  // it never refetches anything.
  useEffect(() => {
    if (tabParam === "structure" || tabParam === "overview") setActiveTab(tabParam);
  }, [tabParam]);

  const subjectsQuery = useSubjects();
  const classesQuery = useClasses();
  const contentsQuery = useCurriculumContents();
  // `/curriculum/kpis` needs manage:curriculum — asking for it without the
  // permission would only produce a FORBIDDEN, so the counters fall back to
  // what the lists already say.
  const kpisQuery = useCurriculumKpis(canManageCurriculum);

  const subjects = useMemo(() => subjectsQuery.data ?? [], [subjectsQuery.data]);
  const classes = classesQuery.data ?? [];
  const contents = useMemo(() => contentsQuery.data ?? [], [contentsQuery.data]);

  /** What the lists themselves say, for the roles that cannot read the KPIs. */
  const fallbackStats = useMemo(() => {
    const totalCourses = subjects.reduce(
      (total, subject) => total + (subject.courseCount ?? subject.courses?.length ?? 0),
      0
    );
    const teacherIds = new Set(
      contents.map((content) => content.teacherId?._id).filter((id): id is string => Boolean(id))
    );
    return { totalSubjects: subjects.length, totalCourses, activeTeachers: teacherIds.size };
  }, [subjects, contents]);

  const kpis = kpisQuery.data;
  const statsLoading = subjectsQuery.isLoading || (canManageCurriculum && kpisQuery.isLoading);

  const filteredSubjects = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return subjects;
    return subjects.filter(
      (subject) =>
        subject.name.toLowerCase().includes(query) || subject.code.toLowerCase().includes(query)
    );
  }, [subjects, searchTerm]);

  const recentContent = useMemo(
    () =>
      [...contents]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, RECENT_LIMIT),
    [contents]
  );

  // The first paint waits only on the subjects list: the counters, the recent
  // entries and the subject grid each carry their own loading state.
  if (subjectsQuery.isLoading && subjects.length === 0) return <CurriculumSkeleton />;

  return (
    <Page>
      <PageHeader
        guide="curriculum-header"
        title="Curriculum Management"
        subtitle="Manage subjects, courses and curriculum content"
        actions={
          <button
            type="button"
            data-guide="curriculum-manage-structure"
            onClick={() => router.push("/curriculum/structure")}
            className={ghostButton}
          >
            <Settings className="h-4 w-4" aria-hidden />
            Manage Structure
          </button>
        }
      />

      <SearchField
        label="Search subjects"
        placeholder="Search subjects, courses..."
        value={searchTerm}
        onChange={setSearchTerm}
        className="w-full max-w-md"
      />

      <CurriculumStatCards
        totalSubjects={kpis?.totalSubjects ?? fallbackStats.totalSubjects}
        totalCourses={kpis?.totalCourses ?? fallbackStats.totalCourses}
        totalClasses={kpis?.totalClasses ?? classes.length}
        activeTeachers={kpis?.activeTeachers ?? fallbackStats.activeTeachers}
        isLoading={statsLoading}
      />

      <Tabs
        options={TAB_OPTIONS}
        value={activeTab}
        onChange={setActiveTab}
        label="Curriculum sections"
        idPrefix="curriculum"
        variant="segmented"
      />

      <div
        role="tabpanel"
        id="curriculum-panel"
        aria-labelledby={`curriculum-tab-${activeTab}`}
        className={pageStack}
      >
        {activeTab === "overview" ? (
          <>
            <CurriculumQuickActions
              onAddSubject={() => router.push("/curriculum/structure?action=add-subject")}
              onAddCourse={() => router.push("/curriculum/structure?action=add-course")}
              onManageStructure={() => router.push("/curriculum/structure")}
            />
            <RecentCurriculumContent
              entries={recentContent}
              isLoading={contentsQuery.isLoading}
              error={contentsQuery.error}
              onRetry={() => contentsQuery.refetch()}
            />
          </>
        ) : (
          <SubjectsOverview
            subjects={filteredSubjects}
            isLoading={subjectsQuery.isLoading}
            error={subjectsQuery.error}
            onRetry={() => subjectsQuery.refetch()}
            isFiltered={searchTerm.trim().length > 0}
            onOpenSubject={(subjectId) =>
              router.push(`/curriculum/structure?subject=${encodeURIComponent(subjectId)}`)
            }
            onAddSubject={() => router.push("/curriculum/structure?action=add-subject")}
          />
        )}
      </div>
    </Page>
  );
}

/**
 * The curriculum dashboard route.
 *
 * @returns The page, suspended until the search params are available.
 */
export default function CurriculumDashboard() {
  return (
    <Suspense fallback={<CurriculumSkeleton />}>
      <CurriculumDashboardMain />
    </Suspense>
  );
}
