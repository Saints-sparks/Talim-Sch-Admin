type LocalStorageItem = {
  schoolId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phoneNumber: string;
  isActive: boolean;
  isEmailVerified: boolean;
  // Add other user properties as needed
};

export interface School {
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
  active: boolean;
  logo: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface User {
  schoolId: School;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phoneNumber: string;
  isActive: boolean;
  isEmailVerified: boolean;
  // Add other user properties as needed
}
// Update your localStorage utility
export const getLocalStorageItem = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
};

export const getLocalStorageJSON = <T>(key: string): T | null => {
  if (typeof window === 'undefined') return null;
  const item = localStorage.getItem(key);
  if (!item) return null;
  try {
    return JSON.parse(item);
  } catch (error) {
    console.error(`Failed to parse JSON for key "${key}":`, error);
    return null;
  }
};

export const setLocalStorageItem = (key: string, value: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, value);
};

export const setLocalStorageJSON = (key: string, value: any): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
};