import { API_ENDPOINTS } from '../lib/api/config';
import { getLocalStorageItem } from '../lib/localStorage';

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
  const token = getLocalStorageItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await fetch(API_ENDPOINTS.GET_COURSES, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch courses: ${response.statusText}`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Invalid response format: expected array of courses');
  }

  return data;
};

export const createCourse = async (courseData: Omit<Course, '_id'>): Promise<Course> => {
  const token = getLocalStorageItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await fetch(API_ENDPOINTS.CREATE_COURSE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(courseData)
  });

  if (!response.ok) {
    throw new Error(`Failed to create course: ${response.statusText}`);
  }

  return await response.json();
};

export const updateCourse = async (courseId: string, courseData: Partial<Course>): Promise<Course> => {
  const token = getLocalStorageItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await fetch(`${API_ENDPOINTS.UPDATE_COURSE}/${courseId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(courseData)
  });

  if (!response.ok) {
    throw new Error(`Failed to update course: ${response.statusText}`);
  }

  return await response.json();
};

export const deleteCourse = async (courseId: string): Promise<void> => {
  const token = getLocalStorageItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await fetch(`${API_ENDPOINTS.DELETE_COURSE}/${courseId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to delete course: ${response.statusText}`);
  }
};

export const getCourseById = async (courseId: string): Promise<Course> => {
  const token = getLocalStorageItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await fetch(`${API_ENDPOINTS.GET_COURSE_BY_ID}/${courseId}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch course: ${response.statusText}`);
  }

  return await response.json();
};

export const createSubject = async (payload: { name: string, code: string, schoolId: string }) => {
  const response = await fetch(API_ENDPOINTS.CREATE_SUBJECT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    
    // Handle specific error messages from backend
    if (response.status === 409) {
      throw new Error(errorData?.message || 'Subject with this code or name already exists');
    }
    
    throw new Error(errorData?.message || 'Subject creation failed');
  }

  return response.json(); // Returns the created subject
};

export const getSubjectsBySchool = async (): Promise<any[]> => {
  const response = await fetch(API_ENDPOINTS.GET_SUBJECTS_BY_SCHOOL, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch subjects');
  }

  return response.json(); // Returns an array of subjects for the logged-in user's school
};

export const getCoursesBySubject = async (subjectId: string): Promise<Course[]> => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await fetch(`${API_ENDPOINTS.GET_COURSES_BY_SUBJECT}/${subjectId}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch courses by subject: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!Array.isArray(data)) {
    throw new Error('Expected an array of courses');
  }

  return data;
};

export const getCoursesBySchool = async (): Promise<Course[]> => {
  const token = getLocalStorageItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await fetch(API_ENDPOINTS.GET_COURSES_BY_SCHOOL, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch courses by school: ${response.statusText}`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('Expected an array of courses');
  }

  return data;
};

// Classes API functions
export const getClasses = async (): Promise<Class[]> => {
  if (typeof window === 'undefined') {
    throw new Error('Not available during SSR');
  }
  
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await fetch(API_ENDPOINTS.GET_CLASSES, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch classes: ${response.statusText}`);
  }

  const data = await response.json();
  const classesArray = Array.isArray(data) ? data : data.data || [];
  
  return classesArray;
};

// Teachers API functions
export const getTeachers = async (): Promise<Teacher[]> => {
  if (typeof window === 'undefined') {
    throw new Error('Not available during SSR');
  }
  
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await fetch(API_ENDPOINTS.GET_TEACHERS, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch teachers: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Handle the response structure from your API
  const teachersArray = Array.isArray(data) ? data : data.data || [];
  
  return teachersArray;
};

// Subject CRUD operations
export const updateSubject = async (subjectId: string, payload: { name: string, code: string, schoolId: string }): Promise<any> => {
  const token = getLocalStorageItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await fetch(`https://talimbe-v2-li38.onrender.com/subjects/${subjectId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    
    if (response.status === 409) {
      throw new Error(errorData?.message || 'Subject with this code already exists');
    }
    
    throw new Error(errorData?.message || 'Subject update failed');
  }

  return response.json();
};

export const deleteSubject = async (subjectId: string): Promise<void> => {
  const token = getLocalStorageItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await fetch(`https://talimbe-v2-li38.onrender.com/subjects/${subjectId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to delete subject');
  }
};

// Course CRUD operations with proper API endpoints
export const updateCourseService = async (courseId: string, courseData: Partial<Course>): Promise<Course> => {
  const token = getLocalStorageItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await fetch(`https://talimbe-v2-li38.onrender.com/courses/${courseId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(courseData)
  });

  if (!response.ok) {
    throw new Error(`Failed to update course: ${response.statusText}`);
  }

  return await response.json();
};

export const deleteCourseService = async (courseId: string): Promise<void> => {
  const token = getLocalStorageItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await fetch(`https://talimbe-v2-li38.onrender.com/courses/${courseId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to delete course');
  }
};

// Enhanced subjects with courses fetch
export const getSubjectsWithCourses = async (): Promise<Subject[]> => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await fetch(API_ENDPOINTS.GET_SUBJECTS_BY_SCHOOL, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch subjects');
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
          courses: courses
        };
      } catch (error) {
        console.error(`Failed to fetch courses for subject ${subject.name}:`, error);
        return {
          ...subject,
          courses: []
        };
      }
    })
  );

  return subjectsWithCourses;
};
