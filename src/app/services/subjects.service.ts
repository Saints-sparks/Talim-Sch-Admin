import { API_ENDPOINTS, API_BASE_URL } from "../lib/api/config";
import { apiClient } from "@/lib/apiClient";

// Types
export interface Class {
  _id: string;
  name: string;
  gradeLevel: string;
  section?: string;
}

export interface Subject {
  _id: string;
  name: string;
  code: string;
  schoolId: string;
  classId?: string;
  courses?: Course[];
  createdAt?: string;
}

export interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  userId?: string;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  courseCode: string;
  subjectId: string;
  teacherId?: string;
  classId?: string;
  schoolId?: string;
  code?: string;
  name?: string;
  subjectName?: string;
  teacherRole?: string;
  createdAt?: string;
}

export const getCourses = async (): Promise<Course[]> => {
  const response = await apiClient.get(API_ENDPOINTS.GET_COURSES);
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `Failed to fetch courses: ${response.statusText}`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data : data.data || [];
};

export const createCourse = async (courseData: Omit<Course, "_id">): Promise<Course> => {
  const response = await apiClient.post(API_ENDPOINTS.CREATE_COURSE, courseData);
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const msg = Array.isArray(errorData?.message)
      ? errorData.message.join(", ")
      : errorData?.message || `Failed to create course (${response.status})`;
    throw new Error(msg);
  }
  return response.json();
};

export const updateCourse = async (
  courseId: string,
  courseData: Partial<Course>
): Promise<Course> => {
  const response = await apiClient.put(`${API_ENDPOINTS.UPDATE_COURSE}/${courseId}`, courseData);
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `Failed to update course: ${response.statusText}`);
  }
  return response.json();
};

export const deleteCourse = async (courseId: string): Promise<void> => {
  const response = await apiClient.delete(`${API_ENDPOINTS.DELETE_COURSE}/${courseId}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `Failed to delete course: ${response.statusText}`);
  }
};

export const getCourseById = async (courseId: string): Promise<Course> => {
  const response = await apiClient.get(`${API_ENDPOINTS.GET_COURSE_BY_ID}/${courseId}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `Failed to fetch course: ${response.statusText}`);
  }
  return response.json();
};

export const createSubject = async (payload: { name: string; code: string; schoolId: string }) => {
  const response = await apiClient.post(API_ENDPOINTS.CREATE_SUBJECT, payload);
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    if (response.status === 409) {
      throw new Error(errorData?.message || "Subject with this code or name already exists");
    }
    throw new Error(errorData?.message || "Subject creation failed");
  }
  return response.json();
};

export const getSubjectsBySchool = async (): Promise<any[]> => {
  const response = await apiClient.get(API_ENDPOINTS.GET_SUBJECTS_BY_SCHOOL);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || "Failed to fetch subjects");
  }

  const raw = await response.json();
  return Array.isArray(raw) ? raw : raw?.data || raw?.subjects || [];
};

export const getCoursesBySubject = async (subjectId: string): Promise<Course[]> => {
  const response = await apiClient.get(`${API_ENDPOINTS.GET_COURSES_BY_SUBJECT}/${subjectId}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || `Failed to fetch courses by subject: ${response.statusText}`
    );
  }
  const raw = await response.json();
  return Array.isArray(raw) ? raw : raw?.data || raw?.courses || [];
};

export const getCoursesBySchool = async (): Promise<Course[]> => {
  const response = await apiClient.get(API_ENDPOINTS.GET_COURSES_BY_SCHOOL);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || `Failed to fetch courses by school: ${response.statusText}`
    );
  }

  const raw = await response.json();
  const data = Array.isArray(raw) ? raw : raw?.data || raw?.courses || [];

  if (!Array.isArray(data)) {
    throw new Error("Expected an array of courses");
  }

  return data;
};

// Classes API functions
export const getClasses = async (): Promise<Class[]> => {
  const response = await apiClient.get(API_ENDPOINTS.GET_CLASSES);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `Failed to fetch classes: ${response.statusText}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : data.data || [];
};

// Teachers API functions
export const getTeachers = async (): Promise<Teacher[]> => {
  // Use apiClient for consistent authentication and error handling
  const response = await apiClient.get(API_ENDPOINTS.GET_TEACHERS);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      (errorData && errorData.message) || `Failed to fetch teachers: ${response.statusText}`
    );
  }

  const data = await response.json();
  // Handle the response structure from your API
  const teachersArray = Array.isArray(data) ? data : data.data || [];
  return teachersArray;
};

// Subject CRUD operations
export const updateSubject = async (
  subjectId: string,
  payload: { name: string; code: string; schoolId: string }
): Promise<any> => {
  const response = await apiClient.put(
    `${API_BASE_URL}/subjects-courses/subjects/${subjectId}`,
    payload
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    if (response.status === 409) {
      throw new Error(errorData?.message || "Subject with this code already exists");
    }
    throw new Error(errorData?.message || "Subject update failed");
  }
  return response.json();
};

export const deleteSubject = async (subjectId: string): Promise<void> => {
  const response = await apiClient.delete(API_ENDPOINTS.DELETE_SUBJECT(subjectId));
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `Failed to delete subject: ${response.statusText}`);
  }
};

// Course CRUD operations with proper API endpoints
export const updateCourseService = async (
  courseId: string,
  courseData: Partial<Course>
): Promise<Course> => {
  const response = await apiClient.put(
    `${API_BASE_URL}/subjects-courses/courses/${courseId}`,
    courseData
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `Failed to update course: ${response.statusText}`);
  }
  return response.json();
};

export const deleteCourseService = async (courseId: string): Promise<void> => {
  const response = await apiClient.delete(`${API_BASE_URL}/subjects-courses/courses/${courseId}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || "Failed to delete course");
  }
};

// Enhanced subjects with courses fetch
export const getSubjectsWithCourses = async (): Promise<Subject[]> => {
  const response = await apiClient.get(API_ENDPOINTS.GET_SUBJECTS_BY_SCHOOL);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || "Failed to fetch subjects");
  }

  const subjects = await response.json();
  const subjectsArray = Array.isArray(subjects) ? subjects : subjects.data || [];

  // Fetch courses for each subject
  const subjectsWithCourses = await Promise.all(
    subjectsArray.map(async (subject: Subject) => {
      try {
        const courses = await getCoursesBySubject(subject._id);
        return {
          ...subject,
          courses: courses,
        };
      } catch (error) {
        console.error(`Failed to fetch courses for subject ${subject.name}:`, error);
        return {
          ...subject,
          courses: [],
        };
      }
    })
  );

  return subjectsWithCourses;
};
