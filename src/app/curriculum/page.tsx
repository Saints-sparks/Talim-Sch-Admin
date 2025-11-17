"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ModernLoader from "@/components/ModernLoader";
import { toast } from "react-toastify";
import {
  BookOpen,
  GraduationCap,
  FileText,
  Settings,
  Search,
  Users,
  ChevronRight,
  Book,
} from "lucide-react";
import { API_ENDPOINTS, API_BASE_URL } from "../lib/api/config";
import { apiClient } from "@/lib/apiClient";

interface Class {
  _id: string;
  name: string;
  gradeLevel: string;
}

interface Subject {
  _id: string;
  name: string;
  code: string;
  classId?: string;
  courses?: Course[];
  courseCount?: number;
}

interface Course {
  _id: string;
  name: string;
  code: string;
  subjectId: string;
  teacherId?: string;
}

interface CurriculumContent {
  _id: string;
  course: {
    _id: string;
    name: string;
    code: string;
  };
  term: {
    _id: string;
    name: string;
    year: string;
  };
  content: string;
  attachments: string[];
  teacherId?: {
    _id: string;
    firstName: string;
    lastName: string;
  } | null;
  createdAt: string;
}

interface Stats {
  totalSubjects: number;
  totalCourses: number;
  totalContent: number;
  totalTeachers: number;
}

interface CurriculumKPIs {
  totalSubjects: number;
  totalCourses: number;
  activeTeachers: number;
  totalClasses: number;
  totalStudents: number;
  totalCurriculumItems: number;
  averageCoursesPerClass: number;
  subjectDistribution: Array<{
    className: string;
    subjectCount: number;
  }>;
  popularSubjects: Array<{
    subjectName: string;
    courseCount: number;
  }>;
  teacherDistribution: Array<{
    teacherName: string;
    subjectsCount: number;
  }>;
}

const LoadingSpinner = () => <ModernLoader />;

const PRIMARY = "#154473"; // Talim primary color used across buttons

const CurriculumDashboardMain: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab =
    (searchParams?.get("tab") as "overview" | "structure") || "overview";

  const [activeTab, setActiveTab] = useState<"overview" | "structure">(
    initialTab
  );
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [curriculumContents, setCurriculumContents] = useState<
    CurriculumContent[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalSubjects: 0,
    totalCourses: 0,
    totalContent: 0,
    totalTeachers: 0,
  });
  const [kpis, setKpis] = useState<CurriculumKPIs | null>(null);
  const [loadingKpis, setLoadingKpis] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchParams?.get("tab")) {
      const tab = searchParams.get("tab") as "overview" | "structure";
      if (tab) setActiveTab(tab);
    }
  }, [searchParams]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchClasses(),
        fetchSubjects(),
        fetchCurriculumContents(),
        fetchCurriculumKPIs(),
      ]);
      calculateStats();
    } catch (error) {
      toast.error("Failed to load curriculum data");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurriculumKPIs = async () => {
    setLoadingKpis(true);
    try {
      const response = await apiClient.get(`${API_BASE_URL}/curriculum/kpis`);
      if (!response.ok) throw new Error("Failed to fetch curriculum KPIs");
      const data = await response.json();
      setKpis(data);
    } catch (error) {
      console.error("Error fetching curriculum KPIs:", error);
      toast.error("Failed to load curriculum statistics");
    } finally {
      setLoadingKpis(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.GET_CLASSES}`);
      if (!response.ok) throw new Error("Failed to fetch classes");
      const data = await response.json();
      setClasses(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.GET_SUBJECTS_BY_SCHOOL}`
      );
      if (!response.ok) throw new Error("Failed to fetch subjects");
      const data = await response.json();
      setSubjects(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const fetchCurriculumContents = async () => {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/curriculum`);
      if (!response.ok) throw new Error("Failed to fetch curriculum contents");
      const data = await response.json();
      setCurriculumContents(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error("Error fetching curriculum contents:", error);
    }
  };

  const calculateStats = () => {
    const totalCourses = subjects.reduce(
      (acc, subject) => acc + (subject.courses?.length || 0),
      0
    );
    const uniqueTeachers = new Set(
      curriculumContents
        .filter((content) => content.teacherId?._id)
        .map((content) => content.teacherId!._id)
    ).size;

    setStats({
      totalSubjects: subjects.length,
      totalCourses,
      totalContent: curriculumContents.length,
      totalTeachers: uniqueTeachers,
    });
  };

  const filteredSubjects = subjects.filter((subject) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      subject.name.toLowerCase().includes(q) ||
      subject.code.toLowerCase().includes(q)
    );
  });

  const recentContent = curriculumContents
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  if (loading) return <ModernLoader />;

  return (
    <div className="flex flex-col min-h-screen ">
      {/* Top - flattened header (no bg white) */}
      <div className="flex-shrink-0 px-6 py-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Curriculum Management
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage subjects, courses and curriculum content
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center border border-gray-200 rounded-md px-3 py-2 bg-white shadow-sm">
              <Search className="w-4 h-4 text-gray-500 mr-2" />
              <input
                type="search"
                placeholder="Search subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 text-sm placeholder-gray-400 focus:outline-none bg-transparent"
                aria-label="Search subjects"
              />
            </div>

            <button
              onClick={() => router.push("/curriculum/structure")}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50"
              style={{ backgroundColor: "transparent" }}
            >
              <Settings className="w-4 h-4" /> Manage Structure
            </button>
          </div>
        </div>

        {/* Tabs (flat style; active tab has border + primary color text) */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-2 text-sm font-medium rounded-md transition ${
              activeTab === "overview"
                ? `text-[${PRIMARY}] border-b-2 border-[${PRIMARY}]`
                : "text-gray-600 hover:text-gray-900"
            }`}
            style={
              activeTab === "overview"
                ? { color: PRIMARY, borderBottomColor: PRIMARY }
                : undefined
            }
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("structure")}
            className={`px-3 py-2 text-sm font-medium rounded-md transition ${
              activeTab === "structure"
                ? `text-[${PRIMARY}] border-b-2 border-[${PRIMARY}]`
                : "text-gray-600 hover:text-gray-900"
            }`}
            style={
              activeTab === "structure"
                ? { color: PRIMARY, borderBottomColor: PRIMARY }
                : undefined
            }
          >
            Structure
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-6 space-y-6">
          {activeTab === "overview" && (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-600">Total Subjects</div>
                      <div className="text-2xl font-bold text-gray-900 mt-1">
                        {loadingKpis ? (
                          <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                        ) : (
                          kpis?.totalSubjects ?? stats.totalSubjects
                        )}
                      </div>
                    </div>
                    <div className="text-gray-500">
                      <BookOpen className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-600">Total Courses</div>
                      <div className="text-2xl font-bold text-gray-900 mt-1">
                        {loadingKpis ? (
                          <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                        ) : (
                          kpis?.totalCourses ?? stats.totalCourses
                        )}
                      </div>
                    </div>
                    <div className="text-gray-500">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-600">Total Classes</div>
                      <div className="text-2xl font-bold text-gray-900 mt-1">
                        {loadingKpis ? (
                          <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                        ) : (
                          kpis?.totalClasses ?? classes.length
                        )}
                      </div>
                    </div>
                    <div className="text-gray-500">
                      <FileText className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-600">Active Teachers</div>
                      <div className="text-2xl font-bold text-gray-900 mt-1">
                        {loadingKpis ? (
                          <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                        ) : (
                          kpis?.activeTeachers ?? stats.totalTeachers
                        )}
                      </div>
                    </div>
                    <div className="text-gray-500">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-900">Quick Actions</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button
                    onClick={() =>
                      router.push("/curriculum/structure?action=add-subject")
                    }
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gray-100 text-gray-700">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900">Add Subject</div>
                        <div className="text-xs text-gray-500">Create new subject</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>

                  <button
                    onClick={() =>
                      router.push("/curriculum/structure?action=add-course")
                    }
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gray-100 text-gray-700">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900">Add Course</div>
                        <div className="text-xs text-gray-500">Create new course</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Recent curriculum content */}
              <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-900">
                    Recent Curriculum Content
                  </h2>
                </div>

                {recentContent.length > 0 ? (
                  <div className="space-y-3">
                    {recentContent.map((content) => (
                      <div
                        key={content._id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded bg-gray-50 text-gray-600">
                            <Book className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {content.course.code} - {content.course.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {content.term.name} ({content.term.year}) •{" "}
                              {content.teacherId?.firstName &&
                              content.teacherId?.lastName
                                ? `${content.teacherId.firstName} ${content.teacherId.lastName}`
                                : "No teacher assigned"}
                            </div>
                          </div>
                        </div>

                        <div className="text-xs text-gray-500">
                          {new Date(content.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-6">
                    No curriculum content created yet
                  </p>
                )}
              </div>
            </>
          )}

          {activeTab === "structure" && (
            <>
              <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-900">Subjects Overview</h2>
                </div>

                {filteredSubjects.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredSubjects.map((subject) => (
                      <div
                        key={subject._id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow transition cursor-pointer"
                        onClick={() =>
                          router.push(`/curriculum/structure/subject/${subject._id}`)
                        }
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{subject.name}</h3>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {subject.code}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {subject.courseCount ?? subject.courses?.length ?? 0} courses
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No subjects found</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const CurriculumDashboard: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CurriculumDashboardMain />
    </Suspense>
  );
};

export default CurriculumDashboard;
