import { getLocalStorageItem } from '../lib/localStorage';
import { API_ENDPOINTS } from '../lib/api/config';

interface RegisterStudentPayload {
  email: string;
  password: string;
  role: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

interface CreateStudentProfilePayload {
  userId: string;
  classId: string;
  gradeLevel: string;
  parentContact: {
    fullName: string;
    phoneNumber: string;
    email: string;
    relationship: string;
  };
}

export interface Class {
  _id: string;
  name: string;
  schoolId: string;
  classTeacherId: string;
  assignedCourses: string[];
}

export const registerStudent = async (payload: RegisterStudentPayload) => {
  const response = await fetch(API_ENDPOINTS.REGISTER, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Registration failed');
  }

  return response.json();
};

export const createStudentProfile = async (payload: CreateStudentProfilePayload) => {
  const response = await fetch(API_ENDPOINTS.CREATE_STUDENT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Profile creation failed');
  }

  return response.json();
};

export const getClasses = async (): Promise<Class[]> => {
  const response = await fetch(API_ENDPOINTS.GET_CLASSES, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch classes');
  }

  return response.json();
};
