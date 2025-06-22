"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Header } from "@/components/Header";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  BookOpen, 
  FileText,
  Download,
  X,
  ChevronLeft,
  Calendar,
  Users,
  Clock
} from "lucide-react";

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
  teacherId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Course {
  _id: string;
  title: string;
  courseCode: string;
  subjectId?: string;
}

interface Term {
  _id: string;
  name: string;
  year: string;
}

interface Teacher {
  _id: string;
  userId: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface NewCurriculumContent {
  course: string;
  term: string;
  content: string;
  attachments: string[];
  teacherId: string;
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

// Main component that uses useSearchParams
const CurriculumContentMain: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialAction = searchParams?.get('action');

  const [curriculumContents, setCurriculumContents] = useState<CurriculumContent[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [selectedTerm, setSelectedTerm] = useState<string>("all");

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedContent, setSelectedContent] = useState<CurriculumContent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newContent, setNewContent] = useState<NewCurriculumContent>({
    course: "",
    term: "",
    content: "",
    attachments: [],
    teacherId: ""
  });
  const [newAttachment, setNewAttachment] = useState("");

  useEffect(() => {
    fetchAllData();
    
    // Handle initial action from URL
    if (initialAction === "add") {
      openAddModal();
    }
  }, [initialAction]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCurriculumContents(),
        fetchCourses(),
        fetchTerms(),
        fetchTeachers()
      ]);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurriculumContents = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("https://talimbe-v2-li38.onrender.com/curriculum", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch curriculum contents");
      const data = await response.json();
      setCurriculumContents(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error("Error fetching curriculum contents:", error);
    }
  };

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("https://talimbe-v2-li38.onrender.com/courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch courses");
      const data = await response.json();
      setCourses(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchTerms = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("https://talimbe-v2-li38.onrender.com/terms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch terms");
      const data = await response.json();
      setTerms(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error("Error fetching terms:", error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("https://talimbe-v2-li38.onrender.com/teachers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch teachers");
      const data = await response.json();
      setTeachers(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  // Modal Functions
  const openAddModal = () => {
    setModalMode("add");
    setSelectedContent(null);
    setNewContent({
      course: "",
      term: "",
      content: "",
      attachments: [],
      teacherId: ""
    });
    setShowModal(true);
  };

  const openEditModal = (content: CurriculumContent) => {
    setModalMode("edit");
    setSelectedContent(content);
    setNewContent({
      course: content.course._id,
      term: content.term._id,
      content: content.content,
      attachments: [...content.attachments],
      teacherId: content.teacherId._id
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!newContent.course || !newContent.term || !newContent.content || !newContent.teacherId) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      const url = modalMode === "add" 
        ? "https://talimbe-v2-li38.onrender.com/curriculum"
        : `https://talimbe-v2-li38.onrender.com/curriculum/${selectedContent?._id}`;
      
      const method = modalMode === "add" ? "POST" : "PUT";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newContent),
      });

      if (!response.ok) throw new Error(`Failed to ${modalMode} curriculum content`);

      toast.success(`Curriculum content ${modalMode === "add" ? "created" : "updated"} successfully!`);
      setShowModal(false);
      fetchCurriculumContents(); // Refresh the list
    } catch (error: any) {
      console.error(`Error ${modalMode}ing curriculum content:`, error);
      toast.error(error.message || `Failed to ${modalMode} curriculum content`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (contentId: string) => {
    if (!window.confirm("Are you sure you want to delete this curriculum content?")) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`https://talimbe-v2-li38.onrender.com/curriculum/${contentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to delete curriculum content");

      toast.success("Curriculum content deleted successfully!");
      fetchCurriculumContents();
    } catch (error: any) {
      console.error("Error deleting curriculum content:", error);
      toast.error(error.message || "Failed to delete curriculum content");
    }
  };

  // Attachment Functions
  const addAttachment = () => {
    if (newAttachment.trim()) {
      setNewContent(prev => ({
        ...prev,
        attachments: [...prev.attachments, newAttachment.trim()]
      }));
      setNewAttachment("");
    }
  };

  const removeAttachment = (index: number) => {
    setNewContent(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  // Helper Functions
  const getCourseName = (courseId: string) => {
    const course = courses.find(c => c._id === courseId);
    return course ? `${course.courseCode} - ${course.title}` : courseId;
  };

  const getTermName = (termId: string) => {
    const term = terms.find(t => t._id === termId);
    return term ? `${term.name} (${term.year})` : termId;
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t._id === teacherId);
    return teacher ? `${teacher.userId.firstName} ${teacher.userId.lastName}` : teacherId;
  };

  // Filter contents
  const filteredContents = curriculumContents.filter(content => {
    const matchesSearch = 
      content.course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCourse = selectedCourse === "all" || content.course._id === selectedCourse;
    const matchesTerm = selectedTerm === "all" || content.term._id === selectedTerm;

    return matchesSearch && matchesCourse && matchesTerm;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Fixed Header */}
      <div className="flex-shrink-0">
        <Header />
      </div>

      {/* Fixed Title and Controls */}
      <div className="flex-shrink-0 px-6 py-4 bg-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/curriculum")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">Curriculum Content</h1>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#154473] text-white rounded-md hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add Content
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search curriculum content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Courses</option>
            {courses.map(course => (
              <option key={course._id} value={course._id}>
                {course.courseCode} - {course.title}
              </option>
            ))}
          </select>

          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Terms</option>
            {terms.map(term => (
              <option key={term._id} value={term._id}>
                {term.name} ({term.year})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-hidden px-6">
        <div className="h-full overflow-y-auto pb-6">
          {/* Content Grid */}
          {filteredContents.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredContents.map((content) => (
                <div
                  key={content._id}
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {content.course.code}
                      </h3>
                      <p className="text-sm text-gray-600">{content.course.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(content)}
                        className="text-gray-400 hover:text-blue-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(content._id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Term and Teacher Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{content.term.name} ({content.term.year})</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{content.teacherId.firstName} {content.teacherId.lastName}</span>
                    </div>
                  </div>

                  {/* Content Preview */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Content:</h4>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {content.content}
                    </p>
                  </div>

                  {/* Attachments */}
                  {content.attachments && content.attachments.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments:</h4>
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <FileText className="w-4 h-4" />
                        <span>{content.attachments.length} file(s)</span>
                      </div>
                    </div>
                  )}

                  {/* Created Date */}
                  <div className="text-xs text-gray-500 pt-3 border-t">
                    Created: {new Date(content.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No curriculum content found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || selectedCourse !== "all" || selectedTerm !== "all"
                  ? "Try adjusting your search or filters."
                  : "Get started by creating your first curriculum content."}
              </p>
              {!searchTerm && selectedCourse === "all" && selectedTerm === "all" && (
                <button
                  onClick={openAddModal}
                  className="px-4 py-2 bg-[#154473] text-white rounded-md hover:bg-blue-700"
                >
                  Add First Content
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {modalMode === "add" ? "Add New Curriculum Content" : "Edit Curriculum Content"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Course Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course *
                </label>
                <select
                  value={newContent.course}
                  onChange={(e) => setNewContent(prev => ({ ...prev, course: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a course</option>
                  {courses.map(course => (
                    <option key={course._id} value={course._id}>
                      {course.courseCode} - {course.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Term Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Term *
                </label>
                <select
                  value={newContent.term}
                  onChange={(e) => setNewContent(prev => ({ ...prev, term: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a term</option>
                  {terms.map(term => (
                    <option key={term._id} value={term._id}>
                      {term.name} ({term.year})
                    </option>
                  ))}
                </select>
              </div>

              {/* Teacher Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teacher *
                </label>
                <select
                  value={newContent.teacherId}
                  onChange={(e) => setNewContent(prev => ({ ...prev, teacherId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a teacher</option>
                  {teachers.map(teacher => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.userId.firstName} {teacher.userId.lastName} ({teacher.userId.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Curriculum Content *
                </label>
                <textarea
                  value={newContent.content}
                  onChange={(e) => setNewContent(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter the curriculum content, objectives, and description..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attachments
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newAttachment}
                      onChange={(e) => setNewAttachment(e.target.value)}
                      placeholder="Enter attachment URL (e.g., https://example.com/file.pdf)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={addAttachment}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Add
                    </button>
                  </div>
                  
                  {/* Display added attachments */}
                  {newContent.attachments.length > 0 && (
                    <div className="space-y-2">
                      {newContent.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm text-gray-700 truncate">{attachment}</span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-4 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#154473] text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {modalMode === "add" ? "Creating..." : "Updating..."}
                  </div>
                ) : (
                  modalMode === "add" ? "Create Content" : "Update Content"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main wrapper component with Suspense
const CurriculumContentPage: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CurriculumContentMain />
    </Suspense>
  );
};

export default CurriculumContentPage;