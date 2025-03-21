import { API_ENDPOINTS } from './api/urls';
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
    const response = await fetch(`${API_ENDPOINTS.GET_SETTINGS}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch settings');
    }

    const data: SettingsResponse = await response.json();
    return data;
  } catch (error) {
    toast.error('Failed to fetch settings. Please try again.');
    throw error;
  }
};

export const updateSchoolSettings = async (settings: Partial<SchoolSettings>): Promise<SchoolSettings> => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${API_ENDPOINTS.UPDATE_SCHOOL_SETTINGS}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update school settings');
    }

    const data: SchoolSettings = await response.json();
    return data;
  } catch (error) {
    toast.error('Failed to update school settings. Please try again.');
    throw error;
  }
};

export const updateUserSettings = async (settings: Partial<UserSettings>): Promise<UserSettings> => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${API_ENDPOINTS.UPDATE_USER_SETTINGS}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update user settings');
    }

    const data: UserSettings = await response.json();
    return data;
  } catch (error) {
    toast.error('Failed to update user settings. Please try again.');
    throw error;
  }
};

export const uploadSchoolLogo = async (file: File): Promise<string> => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    throw new Error('User not authenticated');
  }

  const formData = new FormData();
  formData.append('logo', file);

  try {
    const response = await fetch(`${API_ENDPOINTS.UPLOAD_SCHOOL_LOGO}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload logo');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    toast.error('Failed to upload logo. Please try again.');
    throw error;
  }
};
