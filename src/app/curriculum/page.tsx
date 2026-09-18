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
import { Library, Search, Settings } from "lucide-react";
import CurriculumSkeleton from "@/components/CurriculumSkeleton";
import { CurriculumStatCards } from "@/components/curriculum/CurriculumStatCards";
import { CurriculumQuickActions } from "@/components/curriculum/CurriculumQuickActions";
import { RecentCurriculumContent } from "@/components/curriculum/RecentCurriculumContent";
import { SubjectsOverview } from "@/components/curriculum/SubjectsOverview";
import { useClasses, useSubjects } from "@/hooks/queries/reference";
import { useCurriculumContents, useCurriculumKpis } from "@/hooks/curriculum/queries";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/permissions";

type CurriculumTab = "overview" | "structure";

/** How many of the newest curriculum entries the dashboard lists. */
const RECENT_LIMIT = 5;

/** The dashboard body; separate so `useSearchParams` sits inside `<Suspense>`. */
function CurriculumDashboardMain() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();
  const canManageCurriculum = hasPermission(Permission.MANAGE_CURRICULUM);

  const tabParam = searchParams?.get("tab");
  const [activeTab, setActiveTab] = useState<CurriculumTab>(
    tabParam === "structure" ? "structure" : "overview",
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
      0,
    );
    const teacherIds = new Set(
      contents.map((content) => content.teacherId?._id).filter((id): id is string => Boolean(id)),
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
        subject.name.toLowerCase().includes(query) || subject.code.toLowerCase().includes(query),
    );
  }, [subjects, searchTerm]);

  const recentContent = useMemo(
    () =>
      [...contents]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, RECENT_LIMIT),
    [contents],
  );

  // The first paint waits only on the subjects list: the counters, the recent
  // entries and the subject grid each carry their own loading state.
  if (subjectsQuery.isLoading && subjects.length === 0) return <CurriculumSkeleton />;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="flex-shrink-0 bg-[#003366] m-6 rounded-2xl" data-guide="curriculum-header">
        <div className="px-6 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Library className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Curriculum Management</h1>
                <p className="text-blue-100 mt-1">Manage subjects, courses and curriculum content</p>
              </div>
            </div>

            <button
              data-guide="curriculum-manage-structure"
              onClick={() => router.push("/curriculum/structure")}
              className="inline-flex items-center px-6 py-2.5 bg-white text-[#003366] text-sm font-semibold rounded-xl hover:bg-blue-50 transition-all duration-300 shadow-lg"
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage Structure
            </button>
          </div>

          <div className="mt-6">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-200" />
              <input
                type="search"
                placeholder="Search subjects, courses..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-0 rounded-xl text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
                aria-label="Search subjects"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="px-6">
            <CurriculumStatCards
              totalSubjects={kpis?.totalSubjects ?? fallbackStats.totalSubjects}
              totalCourses={kpis?.totalCourses ?? fallbackStats.totalCourses}
              totalClasses={kpis?.totalClasses ?? classes.length}
              activeTeachers={kpis?.activeTeachers ?? fallbackStats.activeTeachers}
              isLoading={statsLoading}
            />

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  {(["overview", "structure"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-6 py-3 text-sm font-semibold rounded-xl capitalize transition-all duration-300 ${
                        activeTab === tab
                          ? "bg-[#003366] text-white shadow-lg"
                          : "text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

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
        </div>
      </div>
    </div>
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
