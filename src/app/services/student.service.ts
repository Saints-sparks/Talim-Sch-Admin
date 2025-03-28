import { API_ENDPOINTS } from '../lib/api/config';

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

interface ParentContact {
  _id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  relationship: string;
}

export interface Student {
  _id: string;
  userId: User;
  classId: Class;
  gradeLevel: string;
  parentId: string;
  parentContact: ParentContact;
  isActive: boolean;
}

interface GetStudentsResponse {
  data: Student[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
  };
}

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

const getLocalStorageItem = (key: string) => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : null;
};

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
      'Accept': 'application/json',
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

export const createClass = async (payload: Class) => {
  const response = await fetch(API_ENDPOINTS.CREATE_CLASS, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Class creation failed');
  }

  return response.json();
};
export const editClass = async (classId: string, data: any) => {
  const response = await fetch(`${API_ENDPOINTS.EDIT_CLASS}/${classId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update class');
  }

  return response.json();
};

export const getClass = async (classId: any) => {
  const response = await fetch(`${API_ENDPOINTS.GET_CLASS}/${classId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    },
  });

  if (!response.ok) {
    throw new Error('Error fetching class details');
  }

  return response.json();
};

export const studentService = {
  async getStudents(page: number = 1, limit: number = 10): Promise<GetStudentsResponse> {
    const userId = getLocalStorageItem('user')?.userId;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.GET_STUDENTS}?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch students');
      }

      const data: GetStudentsResponse = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },
  async getStudentsByClass(classId: string, page: number = 1, limit: number = 10): Promise<GetStudentsResponse> {
    // const userId = getLocalStorageItem('user')?.userId;

    // if (!userId) {
    //   throw new Error('User not authenticated');
    // }

    try {
      const response = await fetch(`${API_ENDPOINTS.GET_STUDENTS_BY_CLASS.replace(':classId', classId)}?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch students');
      }

      const data: GetStudentsResponse = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }
};
