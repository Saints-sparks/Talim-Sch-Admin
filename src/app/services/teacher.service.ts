import { API_ENDPOINTS } from "../lib/api/config";
import { apiClient } from "@/lib/apiClient";

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
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  role: string;
  userAvatar?: string; // <-- Add this line to match backend

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
  classIds?: string[];
  __v?: number; // Added __v property to match TeacherById type
}

export interface TeacherById {
  _id: string;
  userId: {
    _id: string;
    userId: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    isActive: boolean;
    isEmailVerified: boolean;
    schoolId: string;
    isTwoFactorEnabled: boolean;
    devices: any[];
    createdAt: string;
    updatedAt: string;
    __v: number;
    id: string;
  };
  assignedClasses: {
    _id: string;
    name: string;
    classCapacity: number;
    classDescription: string;
    assignedCourses: string[];
  }[]; // Array of populated class objects
  classTeacherClasses?: {
    _id: string;
    name: string;
    classCapacity: number;
    classDescription: string;
    assignedCourses: string[];
  }[]; // Array of populated class objects for classes where teacher is form teacher
  assignedCourses: {
    _id: string;
    courseCode: string;
    title: string;
    description: string;
    classId: string;
    subjectId: string;
  }[]; // Array of populated course objects
  isFormTeacher: boolean;
  highestAcademicQualification: string;
  yearsOfExperience: number;
  specialization: string;
  employmentType: string;
  employmentRole: string;
  availabilityDays: string[];
  availableTime: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
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
  const response = await fetch(API_ENDPOINTS.REGISTER, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Teacher registration failed");
  }

  return response.json();
};

export const createTeacherProfile = async (
  userId: string,
  payload: CreateTeacherProfilePayload
) => {
  if (!userId) {
    throw new Error("User ID is required to create teacher profile");
  }

  const response = await fetch(`${API_ENDPOINTS.CREATE_TEACHER}${userId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      "Content-Type": "application/json",
    },

    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || errorData?.error || "Profile creation failed"
    );
  }

  return response.json();
};

export const teacherService = {
  async getTeachers(
    page: number = 1,
    limit: number = 10
  ): Promise<GetTeachersResponse> {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.GET_TEACHERS}?page=${page}&limit=${limit}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch teachers");
      }

      const data: GetTeachersResponse = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  async getAllTeachers(): Promise<Teacher[]> {
    const userId = getLocalStorageItem("user")?.userId;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    try {
      // Fetch all teachers by setting a high limit
      const response = await fetch(
        `${API_ENDPOINTS.GET_TEACHERS}?page=1&limit=1000`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch teachers");
      }

      const data: GetTeachersResponse = await response.json();
      return data.data;
    } catch (error) {
      throw error;
    }
  },

  async updateTeacherByCourse(
    teacherId: string,
    assignedCourses: string[]
  ): Promise<TeacherById> {
    try {
      // Construct the correct endpoint URL
      const url = `${API_ENDPOINTS.BASE_URL}/teachers/${teacherId}/class-course-assignments`;

      const requestBody = {
        assignedCourses: assignedCourses,
        // Include other fields if needed
        assignedClasses: [], // Add existing classes if you don't want to remove them
        isFormTeacher: false, // or get this from current teacher data
      };

      const response = await fetch(url, {
        method: "PATCH", // Use PATCH for partial updates
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        // Handle different error statuses
        if (response.status === 401) {
          throw new Error("Authentication failed. Please login again.");
        }
        if (response.status === 404) {
          throw new Error("Teacher not found");
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed to update teacher courses (${response.status})`
        );
      }

      const data = await response.json();
      console.log("Teacher courses updated:", data);

      return data;
    } catch (error) {
      console.error("Error updating teacher courses:", error);
      throw error;
    }
  },

  async getTeacherById(teacherId: string): Promise<TeacherById> {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.GET_TEACHER}/${teacherId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (!response.ok) {
        // Handle 404 specifically
        if (response.status === 404) {
          throw new Error("Teacher not found");
        }
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch student details");
      }

      const data = await response.json();
      console.log("Teacher data:", data);

      return data;
    } catch (error) {
      console.error("Error fetching teachers:", error);
      throw error;
    }
  },

  async updateTeacher(
    teacherId: string,
    payload: Partial<CreateTeacherProfilePayload>
  ): Promise<Teacher> {
    const response = await fetch(
      `${API_ENDPOINTS.UPDATE_TEACHER}/${teacherId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update teacher");
    }

    return response.json();
  },

  async deactivateTeacher(teacherId: string): Promise<Teacher> {
    const response = await fetch(
      `${API_ENDPOINTS.DEACTIVATE_TEACHER}/${teacherId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to deactivate teacher");
    }

    return response.json();
  },

  // async getTeachersByClass(
  //   classId: string,
  //   page: number = 1,
  //   limit: number = 10
  // ): Promise<GetTeachersResponse> {
  //   try {
  //     const response = await fetch(
  //       `${API_ENDPOINTS.GET_TEACHERS_BY_CLASS_ID(classId)}?page=${page}&limit=${limit}`,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
  //         },
  //       }
  //     );

  //     if (!response.ok) {
  //       const error = await response.json();
  //       throw new Error(error.message || "Failed to fetch teachers");
  //     }
  //     const data: GetTeachersResponse = await response.json();
  //     return data;
  //   } catch (error) {
  //     throw error;
  //   }
  // }
};
