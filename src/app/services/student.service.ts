import { API_ENDPOINTS } from '../lib/api/config';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  userAvatar: string;
  [key: string]: string | number | boolean;
}

export interface Class {
  _id: string;
  name: string;
  classCapacity: number;
  classDescription: string;
  schoolId: string;
  assignedCourses: string[];
  [key: string]: string | number | string[];
}

interface ParentContact {
  _id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  relationship: string;
  address: string;
  [key: string]: string;
}

export interface Student {
  _id: string;
  userId: User;
  classId: Class;
  gradeLevel: string;
  parentId: string;
  parentContact: ParentContact;
  isActive: boolean;
  enrollmentDate?: string;
  assignedSubjects?: string[];
  attendance?: string;
  [key: string]: string | boolean | string[] | User | Class | ParentContact | undefined;
}

export interface StudentById {
  _id: string;
  userId: {
    _id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    dateOfBirth?: string;
    gender?: string;
    userAvatar?: string;
  };
  classId?: {
    _id: string;
    name: string;
  };
  gradeLevel: string;
  parentId: {
    _id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
  parentContact: {
    fullName: string;
    phoneNumber: string;
    email: string;
    relationship: string;
    _id: string;
  };
  isActive: boolean;
  enrollmentDate?: string;
  assignedSubjects?: string[];
  attendance?: string;
}

interface StudentResponse {
  _id: string;
  userId: {
    _id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
  classId: {
    _id: string;
    name: string;
  };
  gradeLevel: string;
  parentId: {
    _id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
  parentContact: {
    fullName: string;
    phoneNumber: string;
    email: string;
    relationship: string;
    _id: string;
  };
  isActive: boolean;
}

interface StudentApiResponse {
  data: StudentResponse[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
  };
}

export interface GetStudentsResponse {
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

export const createClass = async (payload: Omit<Class, '_id'>) => {
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

  return response.json() as Promise<Class>;
};

export const editClass = async (classId: string, data: any) => {

  const url = API_ENDPOINTS.EDIT_CLASS(classId);

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update class');
    } catch (jsonError) {
      // If we can't parse JSON, use the status text
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
  }

  return response.json();
};

export const updateCoursesInClass = async (classId: string, courseIds: string[]) => {
  const response = await fetch(API_ENDPOINTS.UPDATE_COURSES_BY_CLASS(classId), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    },
    body: JSON.stringify({ courseIds })
  });

  if (!response.ok) {
    throw new Error('Failed to update courses in class');
  }

  return response.json();
};

export const getClass = async (classId: string) => {
  const response = await fetch(`${API_ENDPOINTS.GET_CLASS}/${classId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    },
  });
 

  console.log(response);
  
  

  if (!response.ok) {
    throw new Error('Error fetching class details');
  }

  return response.json();
};

export const updateStudent = async (studentId: string, data: Partial<Student>) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.STUDENTS}/${studentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update student profile');
    }

    return response.json();
  } catch (error) {
    console.error('Error updating student:', error);
    throw error;
  }
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

  async getStudentById(studentId: string): Promise<StudentById> {
    try {
      const response = await fetch(`${API_ENDPOINTS.GET_STUDENT}/${studentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        // Handle 404 specifically
        if (response.status === 404) {
          throw new Error('Student not found');
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch student details');
      }

      const data = await response.json();
      console.log('Student data:', data);
      return data.data[0];
    } catch (error) {
      console.error('Error fetching student:', error);
      throw error;
    }
  },

  async getStudentsByClass(classId: string, page: number = 1, limit: number = 10): Promise<GetStudentsResponse> {
    try {
      const response = await fetch(`${API_ENDPOINTS.GET_STUDENTS_BY_CLASS_ID(classId)}?page=${page}&limit=${limit}`, {
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



