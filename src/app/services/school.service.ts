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

    // Extract the _id directly using a regular expression
    const match = user.schoolId.match(/_id: new ObjectId\('([^']+)'\)/);
    if (!match) {
      console.error('Failed to extract schoolId: No match found');
      return null;
    }

    const schoolId = match[1];
    console.log('Extracted schoolId:', schoolId);
    return schoolId;
  } catch (error) {
    console.error('Failed to extract schoolId:', error);
    return null;
  }
};
