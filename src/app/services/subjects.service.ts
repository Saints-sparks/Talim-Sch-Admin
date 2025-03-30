import { API_ENDPOINTS } from '../lib/api/config';
import { getLocalStorageItem } from '../lib/localStorage';

export interface Course {
  _id: string;
  title: string;
  schoolId: string;
  description: string;
  courseCode: string;
  subjectName: string;
  teacherId: string;
  classId: string;
  teacherRole: string;
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