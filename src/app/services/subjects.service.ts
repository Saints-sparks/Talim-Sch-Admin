import { API_ENDPOINTS } from '../lib/api/config';
import { getLocalStorageItem } from '../lib/localStorage';

export interface Course {
  _id: string;
  title: string;
  schoolId: string;
  description: string;
  courseCode: string;
  code: string;
  name: string;
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
  console.log(response, "response");

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
  console.log(subjectId, "yeah");
  
  // const token = getLocalStorageItem('accessToken');
  // if (!token) {
  //   throw new Error('No access token found');
  // }
  // console.log(token);
  

  const response = await fetch(`${API_ENDPOINTS.GET_COURSES_BY_SUBJECT}/${subjectId}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    }
  });


  if (!response.ok) {
    throw new Error(`Failed to fetch courses by subject: ${response.statusText}`);
  }
  console.log(response);


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
