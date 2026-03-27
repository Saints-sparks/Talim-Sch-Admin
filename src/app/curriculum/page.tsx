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
  FolderOpen,
  Target,
  TrendingUp,
  Library,
  Plus,
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
    name?: string;
    code?: string;
    courseCode?: string;
    title?: string;
    description?: string;
    className?: string;
    schoolName?: string;
    teacherName?: string;
  };
  term: {
    _id: string;
    name: string;
    year?: string;
    startDate?: string;
    endDate?: string;
  };
  content: string;
  attachments: string[];
  teacherId?: {
    _id: string;
    firstName: string;
    lastName: string;
  } | null;
  teacherName?: string;
  createdAt: string;
  updatedAt?: string;
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

  // Helper function to get course display text
  const getCourseDisplay = (course: CurriculumContent['course']) => {
    if (!course) return "No course";
    const code = course.courseCode || course.code || "N/A";
    const name = course.title || course.name || "No course name";
    return `${code} - ${name}`;
  };

  // Helper function to get term display text
  const getTermDisplay = (term: CurriculumContent['term']) => {
    if (!term) return "No term";
    if (term.year) return `${term.name} (${term.year})`;
    if (term.startDate) return `${term.name} (${new Date(term.startDate).getFullYear()})`;
    return term.name;
  };

  // Helper function to get teacher display text
  const getTeacherDisplay = (content: CurriculumContent) => {
    if (content.teacherName) return content.teacherName;
    if (content.teacherId?.firstName && content.teacherId?.lastName) {
      return `${content.teacherId.firstName} ${content.teacherId.lastName}`;
    }
    return "No teacher assigned";
  };

  if (loading) return <ModernLoader />;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Enhanced Header with Talim Styling */}
      <div className="flex-shrink-0 bg-[#003366] m-6 rounded-2xl">
        <div className="px-6 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Library className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Curriculum Management
                </h1>
                <p className="text-blue-100 mt-1">
                  Manage subjects, courses and curriculum content
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push("/curriculum/structure")}
                className="inline-flex items-center px-6 py-2.5 bg-white text-[#003366] text-sm font-semibold rounded-xl hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Structure
              </button>
            </div>
          </div>

          {/* Enhanced Search Bar */}
          <div className="mt-6">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-200" />
              <input
                type="search"
                placeholder="Search subjects, courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/90 backdrop-blur-sm border-0 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
                aria-label="Search subjects"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Content Area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="px-6">
            {/* Enhanced Stats Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Total Subjects
                    </p>
                    <p className="text-3xl font-bold bg-[#003366] bg-clip-text text-transparent">
                      {loadingKpis ? (
                        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                      ) : (
                        kpis?.totalSubjects ?? stats.totalSubjects
                      )}
                    </p>
                  </div>
                  <div className="p-3 bg-[#003366] rounded-xl shadow-lg group-hover:shadow-blue-200">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Total Courses
                    </p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                      {loadingKpis ? (
                        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                      ) : (
                        kpis?.totalCourses ?? stats.totalCourses
                      )}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-lg group-hover:shadow-emerald-200">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Total Classes
                    </p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-amber-700 bg-clip-text text-transparent">
                      {loadingKpis ? (
                        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                      ) : (
                        kpis?.totalClasses ?? classes.length
                      )}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl shadow-lg group-hover:shadow-amber-200">
                    <FolderOpen className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Active Teachers
                    </p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                      {loadingKpis ? (
                        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                      ) : (
                        kpis?.activeTeachers ?? stats.totalTeachers
                      )}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:shadow-purple-200">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Tabs Navigation */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                      activeTab === "overview"
                        ? "bg-[#003366] text-white shadow-lg"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab("structure")}
                    className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                      activeTab === "structure"
                        ? "bg-[#003366] text-white shadow-lg"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Structure
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <>
                {/* Enhanced Quick Actions Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                  <div className="px-6 py-5 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Target className="h-5 w-5 mr-2 text-[#003366]" />
                      Quick Actions
                    </h2>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <button
                      onClick={() =>
                        router.push("/curriculum/structure?action=add-subject")
                      }
                      className="group flex items-center justify-between p-5 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 hover:shadow-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-[#003366] group-hover:from-blue-500 group-hover:to-blue-600 transition-all duration-300">
                          <BookOpen className="w-6 h-6 text-white group-hover:text-white transition-colors duration-300" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            Add Subject
                          </div>
                          <div className="text-sm text-gray-500">Create new subject</div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </button>

                    <button
                      onClick={() =>
                        router.push("/curriculum/structure?action=add-course")
                      }
                      className="group flex items-center justify-between p-5 border-2 border-gray-200 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-300 hover:shadow-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 group-hover:from-emerald-500 group-hover:to-emerald-600 transition-all duration-300">
                          <GraduationCap className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors duration-300" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                            Add Course
                          </div>
                          <div className="text-sm text-gray-500">Create new course</div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                    </button>

                    <button
                      onClick={() => router.push("/curriculum/structure")}
                      className="group flex items-center justify-between p-5 border-2 border-gray-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all duration-300 hover:shadow-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 group-hover:from-purple-500 group-hover:to-purple-600 transition-all duration-300">
                          <Settings className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors duration-300" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                            Manage Structure
                          </div>
                          <div className="text-sm text-gray-500">View all settings</div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                    </button>
                  </div>
                </div>

                {/* Enhanced Recent Curriculum Content */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                  <div className="px-6 py-5 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                      Recent Curriculum Content
                    </h2>
                  </div>

                  <div className="p-6">
                    {recentContent.length > 0 ? (
                      <div className="space-y-3">
                        {recentContent.map((content) => (
                          <div
                            key={content._id}
                            className="group flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 cursor-pointer hover:shadow-md"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 group-hover:from-blue-500 group-hover:to-blue-600 transition-all duration-300">
                                <Book className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {getCourseDisplay(content.course)}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  {getTermDisplay(content.term)} •{" "}
                                  {getTeacherDisplay(content)}
                                </div>
                              </div>
                            </div>

                            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                              {new Date(content.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                          <FileText className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          No curriculum content yet
                        </h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                          Start creating curriculum content to see them appear here
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Structure Tab Content */}
            {activeTab === "structure" && (
              <>
                {/* Enhanced Subjects Overview */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                  <div className="px-6 py-5 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                      <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                      Subjects Overview
                    </h2>
                  </div>

                  <div className="p-6">
                    {filteredSubjects.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredSubjects.map((subject) => (
                          <div
                            key={subject._id}
                            className="group border-2 border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:bg-blue-50 hover:shadow-lg transition-all duration-300 cursor-pointer"
                            onClick={() =>
                              router.push(`/curriculum/structure/subject/${subject._id}`)
                            }
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 group-hover:from-blue-500 group-hover:to-blue-600 transition-all duration-300">
                                <BookOpen className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                              </div>
                              <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                {subject.code}
                              </span>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                              {subject.name}
                            </h3>
                            <div className="flex items-center text-sm text-gray-500">
                              <GraduationCap className="w-4 h-4 mr-1.5" />
                              {subject.courseCount ?? subject.courses?.length ?? 0} courses
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                          <BookOpen className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {searchTerm ? "No subjects found" : "No subjects created yet"}
                        </h3>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">
                          {searchTerm
                            ? "Try adjusting your search criteria to find what you're looking for."
                            : "Get started by creating your first subject to organize your curriculum."}
                        </p>
                        {!searchTerm && (
                          <button
                            onClick={() =>
                              router.push("/curriculum/structure?action=add-subject")
                            }
                            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                          >
                            <Plus className="h-5 w-5 mr-3" />
                            Create Your First Subject
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
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