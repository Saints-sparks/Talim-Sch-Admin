import { API_ENDPOINTS } from "../lib/api/config";
import { PerformanceMonitor, performantFetch } from "../lib/performance";
import { apiClient } from "@/lib/apiClient";

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

interface Course {
  _id: string;
  courseCode: string;
  title: string;
  description: string;
  teacherId: string | null;
  subjectId: {
    _id: string;
    name: string;
    code: string;
  };
  classId: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  schoolId?: string;
  id: string;
}

export interface Class {
  _id: string;
  name: string;
  classCapacity: string;
  classDescription: string;
  schoolId:
    | string
    | {
        _id: string;
        name: string;
        email: string;
        physicalAddress: string;
        location: {
          country: string;
          state: string;
          _id: string;
        };
        schoolPrefix: string;
        primaryContacts: Array<{
          name: string;
          phone: string;
          email: string;
          role: string;
          _id: string;
        }>;
        active: boolean;
        logo: string;
        createdAt: string;
        updatedAt: string;
        __v: number;
      };
  assignedCourses: Course[];
  createdAt: string;
  updatedAt: string;
  __v: number;
  classTeacherId?: {
    _id: string;
    userId: {
      _id: string;
      email: string;
      firstName: string;
      lastName: string;
      id: string;
    };
    assignedClasses: string[];
    assignedCourses: string[];
    isFormTeacher: boolean;
    isActive: boolean;
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
  };
  [key: string]: any;
}

interface UpdateClassData {
  name: string;
  classDescription: string;
  classCapacity: string;
}

interface AssignTeacherData {
  teacherId: string;
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
  [key: string]:
    | string
    | boolean
    | string[]
    | User
    | Class
    | ParentContact
    | undefined;
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

export const registerStudent = async (payload: RegisterStudentPayload) => {
  console.log("Registering student with payload:", payload);

  const response = await fetch(API_ENDPOINTS.REGISTER, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Registration failed:", errorData);
    throw new Error(
      errorData.message ||
        `Registration failed: ${response.status} ${response.statusText}`
    );
  }

  const result = await response.json();
  console.log("Registration successful:", result);
  return result;
};

export const createStudentProfile = async (
  payload: CreateStudentProfilePayload
) => {
  console.log("Creating student profile with payload:", payload);

  const response = await apiClient.post(API_ENDPOINTS.CREATE_STUDENT, payload);

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Profile creation failed:", errorData);
    throw new Error(
      errorData.message ||
        `Profile creation failed: ${response.status} ${response.statusText}`
    );
  }

  const result = await response.json();
  console.log("Profile creation successful:", result);
  return result;
};

export const getClasses = async (): Promise<Class[]> => {
  const response = await apiClient.get(API_ENDPOINTS.GET_CLASSES);

  if (!response.ok) {
    throw new Error("Failed to fetch classes");
  }

  return response.json();
};

export const createClass = async (payload: Omit<Class, "_id">) => {
  const response = await apiClient.post(API_ENDPOINTS.CREATE_CLASS, payload);

  if (!response.ok) {
    throw new Error("Class creation failed");
  }

  return response.json() as Promise<Class>;
};

export const editClass = async (classId: string, data: any) => {
  const url = API_ENDPOINTS.EDIT_CLASS(classId);

  const response = await apiClient.put(url, data);

  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update class");
    } catch (jsonError) {
      // If we can't parse JSON, use the status text
      throw new Error(
        `Server error: ${response.status} ${response.statusText}`
      );
    }
  }

  return response.json();
};

export const updateCoursesInClass = async (
  classId: string,
  courseIds: string[]
) => {
  const response = await apiClient.put(
    API_ENDPOINTS.UPDATE_COURSES_BY_CLASS(classId),
    { courseIds }
  );

  if (!response.ok) {
    throw new Error("Failed to update courses in class");
  }

  return response.json();
};

export const getClass = async (classId: string) => {
  const response = await apiClient.get(`${API_ENDPOINTS.GET_CLASS}/${classId}`);

  console.log(response);

  if (!response.ok) {
    throw new Error("Error fetching class details");
  }

  return response.json();
};

export const updateStudent = async (
  studentId: string,
  data: Partial<Student>
) => {
  try {
    const response = await apiClient.put(
      `${API_ENDPOINTS.STUDENTS}/${studentId}`,
      data
    );

    if (!response.ok) {
      // Parse the error response to get detailed error information
      const errorData = await response.json().catch(() => null);

      if (errorData && errorData.message) {
        // Handle array of error messages
        if (Array.isArray(errorData.message)) {
          throw new Error(errorData.message.join(", "));
        }
        // Handle single error message
        throw new Error(errorData.message);
      }

      // Fallback error message based on status code
      if (response.status === 400) {
        throw new Error("Invalid data provided. Please check your input.");
      } else if (response.status === 404) {
        throw new Error("Student not found.");
      } else if (response.status === 401) {
        throw new Error("You are not authorized to update this student.");
      } else {
        throw new Error("Failed to update student profile. Please try again.");
      }
    }

    return response.json();
  } catch (error) {
    console.error("Error updating student:", error);
    throw error;
  }
};

export const studentService = {
  async getStudents(
    page: number = 1,
    limit: number = 10
  ): Promise<GetStudentsResponse> {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.GET_STUDENTS}?page=${page}&limit=${limit}`
      );
      const data: GetStudentsResponse = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  async getStudentById(studentId: string): Promise<StudentById> {
    try {
      return await PerformanceMonitor.measureAsync(
        `getStudentById-${studentId}`,
        async () => {
          const response = await apiClient.get(
            `${API_ENDPOINTS.GET_STUDENT}/${studentId}`
          );

          if (!response.ok) {
            // Handle 404 specifically
            if (response.status === 404) {
              throw new Error("Student not found");
            }
            const errorData = await response.json();
            throw new Error(
              errorData.message || "Failed to fetch student details"
            );
          }

          const data = await response.json();
          console.log("Student data received:", {
            id: studentId,
            hasData: !!data,
          });
          return data.data[0];
        }
      );
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") {
        console.error("❌ Student fetch timed out");
        throw new Error(
          "Request timed out. Please check your connection and try again."
        );
      }
      console.error("❌ Error fetching student:", error);
      throw error;
    }
  },

  async getStudentsByClass(
    classId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<GetStudentsResponse> {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.GET_STUDENTS_BY_CLASS_ID(
          classId
        )}?page=${page}&limit=${limit}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch students");
      }

      const data: GetStudentsResponse = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },
};

export const updateClass = async (
  classId: string,
  updateData: UpdateClassData
): Promise<Class> => {
  try {
    const response = await apiClient.put(
      `${API_ENDPOINTS.BASE_URL}/classes/${classId}`,
      {
        name: updateData.name,
        classDescription: updateData.classDescription,
        classCapacity: updateData.classCapacity,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update class");
    }

    return response.json();
  } catch (error) {
    console.error("Error updating class:", error);
    throw error;
  }
};

export const assignTeacherToClass = async (
  classId: string,
  teacherId: string
): Promise<Class> => {
  try {
    const response = await apiClient.put(
      `${API_ENDPOINTS.BASE_URL}/classes/${classId}/assign-teacher`,
      { teacherId }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to assign teacher to class");
    }

    return response.json();
  } catch (error) {
    console.error("Error assigning teacher to class:", error);
    throw error;
  }
};

export const deleteClass = async (classId: string): Promise<void> => {
  try {
    const response = await apiClient.delete(
      `${API_ENDPOINTS.BASE_URL}/classes/${classId}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete class");
    }

    // Note: DELETE might return 204 No Content, so we don't always need to parse JSON
    if (response.status !== 204) {
      return response.json();
    }
  } catch (error) {
    console.error("Error deleting class:", error);
    throw error;
  }
};

// Update student status (activate/deactivate)
export const updateStudentStatus = async (
  studentId: string,
  isActive: boolean
): Promise<{ message: string }> => {
  try {
    const response = await apiClient.put(
      `${API_ENDPOINTS.BASE_URL}/students/${studentId}/status`,
      { isActive }
    );

    if (!response.ok) {
      // Try to parse error response if available
      let errorMessage = `Failed to ${
        isActive ? "activate" : "deactivate"
      } student`;
      try {
        const error = await response.json();
        errorMessage = error.message || errorMessage;
      } catch (jsonError) {
        // If JSON parsing fails, use status text
        errorMessage = `${errorMessage}: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    // Handle successful response - check if there's content to parse
    if (response.status === 204) {
      // No content response, return success message
      return {
        message: `Student ${
          isActive ? "activated" : "deactivated"
        } successfully`,
      };
    }

    // Try to parse JSON response
    try {
      const responseText = await response.text();
      if (responseText.trim() === "") {
        // Empty response, return success message
        return {
          message: `Student ${
            isActive ? "activated" : "deactivated"
          } successfully`,
        };
      }
      return JSON.parse(responseText);
    } catch (jsonError) {
      // If JSON parsing fails, still return success since response was ok
      return {
        message: `Student ${
          isActive ? "activated" : "deactivated"
        } successfully`,
      };
    }
  } catch (error) {
    console.error("Error updating student status:", error);
    throw error;
  }
};
