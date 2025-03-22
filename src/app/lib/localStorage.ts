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
  createdAt: Date;
  updatedAt: Date;
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

export const getLocalStorageItem = (key: string): LocalStorageItem | null => {
  if (typeof window === 'undefined') return null;
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : null;
};

export const setLocalStorageItem = (key: string, value: LocalStorageItem): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
};
