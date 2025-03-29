import { API_BASE_URL } from '../lib/api/config';
import { getLocalStorageItem } from '../lib/localStorage';
import { toast } from 'react-toastify';

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

export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  timezone: string;
  language: string;
  theme: {
    darkMode: boolean;
  };
  layout: {
    sidebar: boolean;
    header: boolean;
  };
}

export interface SettingsResponse {
  school: SchoolSettings;
  user: UserSettings;
}

export const getSettings = async (): Promise<SettingsResponse> => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch settings');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching settings:', error);
    throw error;
  }
};

export const updateSchoolSettings = async (settings: Partial<SchoolSettings>): Promise<SchoolSettings> => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/settings/school`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(settings)
    });

    if (!response.ok) {
      throw new Error('Failed to update school settings');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating school settings:', error);
    throw error;
  }
};

export const updateUserSettings = async (settings: Partial<UserSettings>): Promise<UserSettings> => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/settings/user`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(settings)
    });

    if (!response.ok) {
      throw new Error('Failed to update user settings');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
};

export const uploadSchoolLogo = async (file: File): Promise<string> => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    throw new Error('User not authenticated');
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_BASE_URL}/settings/logo`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload logo');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error uploading logo:', error);
    throw error;
  }
};
