import { API_ENDPOINTS } from "../lib/api/config";
import { apiClient } from "@/lib/apiClient";

// Reusing your existing User and Class interfaces
interface User {
  _id: string;
  userId?: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  userAvatar?: string;
  schoolId?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
}

export interface Class {
  _id?: string;
  name: string;
  schoolId?: string;
  classCapacity?: number;
  classDescription?: string;
  assignedCourses?: string[];
}

export interface Course {
  _id: string;
  courseCode: string;
  title: string;
  description: string;
  schoolId?: string;
  teacherId?: string;
  classId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// In teacher.service.ts - Update the Teacher interface
export interface Teacher {
  _id: string;
  userId?: User | string;
  staffNumber?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  role?: string;
  userAvatar?: string;
  highestAcademicQualification?: string;
  yearsOfExperience?: number;
  specialization?: string;
  employmentType?: string;
  employmentRole?: string;
  availabilityDays?: string[];
  availableTime?: string;
  isFormTeacher?: boolean;
  assignedClasses?: Class[];
  assignedCourses?: Course[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  classIds?: string[];
  __v?: number;
  schoolId?: string;
  hasTeacherProfile?: boolean;
}
export interface TeacherById {
  _id: string;
  staffNumber?: string;
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
  hasTeacherProfile?: boolean;
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
  const response = await apiClient.post(API_ENDPOINTS.REGISTER, payload);

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

  const response = await apiClient.post(
    `${API_ENDPOINTS.CREATE_TEACHER}${userId}`,
    payload
  );

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
      const response = await apiClient.get(
        `${API_ENDPOINTS.GET_TEACHERS}?page=1&limit=1000`
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

      const response = await apiClient.patch(url, requestBody);

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
      const response = await apiClient.get(
        `${API_ENDPOINTS.GET_TEACHER}/${teacherId}`
      );

      if (!response.ok) {
        // Handle 404 specifically
        if (response.status === 404) {
          throw new Error("Teacher not found");
        }
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch teacher details");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching teacher:", error);
      throw error;
    }
  },

  async getTeacherProfileOrFallback(userId: string): Promise<TeacherById> {
    try {
      const teacherProfile = await this.getTeacherById(userId);
      return { ...teacherProfile, hasTeacherProfile: true };
    } catch (error: any) {
      const isMissingProfile =
        error instanceof Error &&
        error.message.toLowerCase().includes("not found");

      if (!isMissingProfile) {
        throw error;
      }

      const teachers = await this.getAllTeachers();
      const user = teachers.find((teacher) => teacher._id === userId);

      if (!user) {
        throw error;
      }

      return {
        _id: user._id,
        userId: {
          _id: user._id,
          userId: typeof user.userId === "string" ? user.userId : user._id,
          email: user.email || "",
          role: user.role || "teacher",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          phoneNumber: user.phoneNumber || "",
          isActive: user.isActive,
          isEmailVerified: false,
          schoolId: user.schoolId || "",
          isTwoFactorEnabled: false,
          devices: [],
          createdAt: user.createdAt?.toString() || "",
          updatedAt: user.updatedAt?.toString() || "",
          __v: user.__v || 0,
          id: user._id,
        },
        assignedClasses: [],
        classTeacherClasses: [],
        assignedCourses: [],
        isFormTeacher: false,
        highestAcademicQualification: "",
        yearsOfExperience: 0,
        specialization: "",
        employmentType: "",
        employmentRole: "",
        availabilityDays: [],
        availableTime: "",
        createdAt: user.createdAt?.toString() || "",
        updatedAt: user.updatedAt?.toString() || "",
        __v: user.__v || 0,
        hasTeacherProfile: false,
      };
    }
  },

  async updateTeacher(
    teacherId: string,
    payload: Partial<CreateTeacherProfilePayload>
  ): Promise<Teacher> {
    const response = await apiClient.put(
      `${API_ENDPOINTS.UPDATE_TEACHER}/${teacherId}`,
      payload
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update teacher");
    }

    return response.json();
  },

  async updateTeacherStatus(
    teacherId: string,
    isActive: boolean
  ): Promise<Teacher> {
    const response = await apiClient.put(
      `${API_ENDPOINTS.BASE_URL}/users/teachers/${teacherId}/status`,
      { isActive }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message ||
          `Failed to ${isActive ? "activate" : "deactivate"} teacher`
      );
    }

    return response.json();
  },

  async deactivateTeacher(teacherId: string): Promise<Teacher> {
    return this.updateTeacherStatus(teacherId, false);
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
