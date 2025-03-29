import { API_ENDPOINTS } from '../lib/api/config';

// Reusing your existing User and Class interfaces
interface User {
  _id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  userAvatar?: string;
}

export interface Class {
  _id?: string;
  name: string;
  schoolId: string;
  classCapacity: number;
  classDescription: string;
  assignedCourses: string[];
}

export interface Course {
  _id: string;
  courseCode: string;
  title: string;
  description: string;
  schoolId: string;
  teacherId: string;
  classId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Teacher {
  _id: string;
  userId: User;
  highestAcademicQualification: string;
  yearsOfExperience: number;
  specialization: string;
  employmentType: string;
  employmentRole: string;
  availabilityDays: string[];
  availableTime: string;
  isFormTeacher: boolean;
  assignedClasses?: Class[];
  assignedCourses?: Course[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface GetTeachersResponse {
  data: Teacher[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
  };
}

interface RegisterTeacherPayload {
  email: string;
  password: string;
  role: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

interface CreateTeacherProfilePayload {
  userId: string;
  highestAcademicQualification: string;
  yearsOfExperience: number;
  specialization: string;
  employmentType: string;
  employmentRole: string;
  availabilityDays: string[];
  availableTime: string;
  isFormTeacher: boolean;
  assignedClasses?: string[];
  assignedCourses?: string[];
}

const getLocalStorageItem = (key: string) => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : null;
};

export const registerTeacher = async (payload: RegisterTeacherPayload) => {
  const response = await fetch(API_ENDPOINTS.REGISTER_TEACHER, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Teacher registration failed');
  }

  return response.json();
};

export const createTeacherProfile = async (payload: CreateTeacherProfilePayload) => {
  const response = await fetch(API_ENDPOINTS.CREATE_TEACHER.replace('', payload.userId), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Teacher profile creation failed');
  }

  return response.json();
};

export const teacherService = {
  async getTeachers(page: number = 1, limit: number = 10): Promise<GetTeachersResponse> {
    const userId = getLocalStorageItem('user')?.userId;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.GET_TEACHERS}?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch teachers');
      }

      const data: GetTeachersResponse = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  async getTeacherById(teacherId: string): Promise<Teacher> {
    const response = await fetch(`${API_ENDPOINTS.GET_TEACHER}/${teacherId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch teacher');
    }

    return response.json();
  },

  async updateTeacher(teacherId: string, payload: Partial<CreateTeacherProfilePayload>): Promise<Teacher> {
    const response = await fetch(`${API_ENDPOINTS.UPDATE_TEACHER}/${teacherId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update teacher');
    }

    return response.json();
  },

  async deactivateTeacher(teacherId: string): Promise<Teacher> {
    const response = await fetch(`${API_ENDPOINTS.DEACTIVATE_TEACHER}/${teacherId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to deactivate teacher');
    }

    return response.json();
  }
};