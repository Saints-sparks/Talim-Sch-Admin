import { API_ENDPOINTS } from '../lib/api/config';
import { getLocalStorageItem } from '../lib/localStorage';

export interface Class {
  _id: string;
  name: string;
  schoolId: string;
  classTeacherId: string;
  assignedCourses: string[];
}

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

export const getSchoolId = (): string | null => {
  const user = getLocalStorageItem('user');
  return user?.schoolId ?? null;
};
