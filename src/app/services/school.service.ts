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
  const token = getLocalStorageItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await fetch(API_ENDPOINTS.GET_CLASSES, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch classes: ${response.statusText}`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Invalid response format: expected array of classes');
  }

  return data;
};

export const getSchoolId = (): string | null => {
  const user: any = getLocalStorageItem('user');
  if (!user) return null;

  try {
    // Log the original schoolId
    console.log('Original schoolId:', user.schoolId);

    // Check if schoolId is a string (direct ID) or object
    if (typeof user.schoolId === 'string') {
      return user.schoolId;
    } else if (user.schoolId && typeof user.schoolId === 'object' && user.schoolId._id) {
      return user.schoolId._id;
    } else if (user.schoolId && typeof user.schoolId === 'object' && user.schoolId.id) {
      return user.schoolId.id;
    }
    
    console.error('Invalid schoolId format:', user.schoolId);
    return null;
  } catch (error) {
    console.error('Failed to extract schoolId:', error);
    return null;
  }
};
