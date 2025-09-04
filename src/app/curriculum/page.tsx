"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Header } from "@/components/Header";
import { useRouter, useSearchParams } from "next/navigation";
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

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex flex-col h-screen bg-gray-100">
    <div className="flex-shrink-0">
      <Header />
    </div>
    <div className="flex-1 flex justify-center items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#154473]"></div>
    </div>
  </div>
);

// Main dashboard component
const CurriculumDashboardMain: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for any query parameters that might affect initial state
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

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAllData();
  }, []);

  // Update tab when URL changes
  useEffect(() => {
    if (searchParams?.get("tab")) {
      setActiveTab(searchParams.get("tab") as "overview" | "structure");
    }
  }, [searchParams]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchClasses(),
        fetchSubjects(),
        fetchCurriculumContents(),
      ]);
      calculateStats();
    } catch (error) {
      toast.error("Failed to load curriculum data");
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_ENDPOINTS.GET_CLASSES}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch classes");
      const data = await response.json();
      setClasses(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_ENDPOINTS.GET_SUBJECTS_BY_SCHOOL}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch subjects");
      const data = await response.json();
      setSubjects(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const fetchCurriculumContents = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/curriculum`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
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
    const matchesSearch =
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const recentContent = curriculumContents
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Fixed Header */}
      <div className="flex-shrink-0">
        <Header />
      </div>

      {/* Fixed Navigation */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-b">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">
            Curriculum Management
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/curriculum/structure")}
              className="flex items-center gap-2 px-4 py-2 bg-[#154473] text-white rounded-md hover:bg-blue-700 transition"
            >
              <Settings className="w-4 h-4" />
              Manage Structure
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === "overview"
                ? "bg-white text-[#154473] shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("structure")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === "structure"
                ? "bg-white text-[#154473] shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Structure
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Subjects
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalSubjects}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Courses
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalCourses}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <GraduationCap className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Curriculum Content
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalContent}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <FileText className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Active Teachers
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalTeachers}
                      </p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-full">
                      <Users className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button
                    onClick={() =>
                      router.push("/curriculum/structure?action=add-subject")
                    }
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Add Subject</p>
                        <p className="text-sm text-gray-500">
                          Create new subject
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>

                  <button
                    onClick={() =>
                      router.push("/curriculum/structure?action=add-course")
                    }
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <GraduationCap className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Add Course</p>
                        <p className="text-sm text-gray-500">
                          Create new course
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Recent Content */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
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
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <Book className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {content.course.code} - {content.course.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {content.term.name} ({content.term.year}) •{" "}
                              {content.teacherId?.firstName &&
                              content.teacherId?.lastName
                                ? `${content.teacherId.firstName} ${content.teacherId.lastName}`
                                : "No teacher assigned"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {new Date(content.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No curriculum content created yet
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Structure Tab */}
          {activeTab === "structure" && (
            <div className="space-y-6">
              {/* Search and Filter */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="relative flex-1 min-w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search subjects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => router.push("/curriculum/structure")}
                    className="px-4 py-2 bg-[#154473] text-white rounded-md hover:bg-blue-700"
                  >
                    Manage Structure
                  </button>
                </div>
              </div>

              {/* Subjects List */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Subjects Overview
                  </h2>
                </div>
                <div className="p-6">
                  {filteredSubjects.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredSubjects.map((subject) => (
                        <div
                          key={subject._id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {subject.name}
                            </h3>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {subject.code}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {subject.courses?.length || 0} courses
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No subjects found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main wrapper component with Suspense
const CurriculumDashboard: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CurriculumDashboardMain />
    </Suspense>
  );
};

export default CurriculumDashboard;
