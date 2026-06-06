import { API_BASE_URL } from "../lib/api/config";

export interface SchoolSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  academicYear: string;
  semester: string;
  timezone: string;
  currency: string;
  language: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    darkMode: boolean;
  };
}

export const getSettings = async (): Promise<SchoolSettings> => {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new Error("User not authenticated");
  }

  const response = await fetch(`${API_BASE_URL}/settings/school-profile`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch settings");
  }

  return response.json();
};

export const updateSchoolSettings = async (
  settings: Partial<SchoolSettings>
): Promise<SchoolSettings> => {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new Error("User not authenticated");
  }

  const response = await fetch(`${API_BASE_URL}/settings/school-profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    throw new Error("Failed to update school settings");
  }

  return response.json();
};

export const uploadSchoolLogo = async (file: File): Promise<string> => {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new Error("User not authenticated");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/settings/logo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload logo");
  }

  const data = await response.json();
  return data.url;
};
