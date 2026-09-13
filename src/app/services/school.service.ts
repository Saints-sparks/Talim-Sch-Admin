import { sessionStore } from "@/lib/session";
import { API_ENDPOINTS } from "../lib/api/config";
import { getLocalStorageItem } from "../utils/localStorage";

export interface Class {
  _id: string;
  name: string;
  schoolId: string;
  classTeacherId: string;
  assignedCourses: string[];
}

export interface PrimaryContact {
  name: string;
  phone: string;
  email: string;
  role: string;
}

export interface SchoolLocation {
  country: string;
  state: string;
}

export interface UpdateSchoolPayload {
  name?: string;
  email?: string;
  physicalAddress?: string;
  location?: SchoolLocation;
  primaryContacts?: PrimaryContact[];
  active?: boolean;
  logo?: string;
}

export interface UpdateSchoolResponse {
  _id: string;
  name: string;
  email: string;
  physicalAddress: string;
  location: SchoolLocation;
  primaryContacts: PrimaryContact[];
  active: boolean;
  logo?: string;
  updatedAt: string;
}

export const getClasses = async (): Promise<Class[]> => {
  const token = getLocalStorageItem("accessToken");
  if (!token) {
    throw new Error("No access token found");
  }

  const response = await fetch(API_ENDPOINTS.GET_CLASSES, {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch classes: ${response.statusText}`);
  }

  const raw = await response.json();
  const data = Array.isArray(raw) ? raw : raw?.data || raw?.classes || [];
  if (!Array.isArray(data)) {
    throw new Error("Invalid response format: expected array of classes");
  }

  return data;
};

/**
 * The signed-in user's school id, from the session store (the introspected
 * user), or `null` when signed out. Kept as a named export because ~15
 * services call it; new code should prefer `sessionStore.getSchoolId()`.
 */
export const getSchoolId = (): string | null => sessionStore.getSchoolId();

export const updateSchool = async (
  schoolId: string,
  payload: UpdateSchoolPayload
): Promise<UpdateSchoolResponse> => {

  const token = getLocalStorageItem("accessToken");

  if (!token) {
    throw new Error("No access token found");
  }

  const url = API_ENDPOINTS.UPDATE_SCHOOL(schoolId);

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });


    // Get the raw response text first
    const responseText = await response.text();

    if (!response.ok) {
      // Handle error responses
      if (!responseText) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      // Check if response looks like a JWT token
      if (responseText.startsWith("eyJ")) {
        throw new Error(
          `Server returned a token instead of error message. This might indicate an authentication redirect. Status: ${response.status}`
        );
      }

      // Try to parse as JSON
      try {
        const errorData = JSON.parse(responseText);
        throw new Error(
          errorData.message || errorData.error || `Server error: ${response.statusText}`
        );
      } catch (parseError) {
        // If it's not JSON, return the raw text
        throw new Error(`Server error (${response.status}): ${responseText}`);
      }
    }

    // Handle successful responses
    if (!responseText) {
      // Empty response but successful status - this might be valid for some PUT requests
      return {} as UpdateSchoolResponse;
    }

    // Check if response looks like a JWT token
    if (responseText.startsWith("eyJ")) {
      throw new Error(
        "Server returned a token instead of data. This might indicate the endpoint is not implemented correctly."
      );
    }

    // Try to parse as JSON
    try {
      const data = JSON.parse(responseText);
      return data;
    } catch (parseError) {
      console.error("Failed to parse response as JSON:", parseError);
      throw new Error(
        `Server returned invalid JSON response: ${responseText.substring(0, 100)}...`
      );
    }
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        `Network error: Unable to connect to ${url}. Please check if the server is running.`
      );
    }
    throw error;
  }
};
