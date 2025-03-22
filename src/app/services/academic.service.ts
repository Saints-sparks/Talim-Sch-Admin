import { API_ENDPOINTS } from '../lib/api/config';
import { getLocalStorageItem } from '../lib/localStorage';
import { toast } from 'react-toastify';
import { User } from '@/app/types/user';

export interface AcademicYear {
  year: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface Term {
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  academicYearId: string;
}

export interface AcademicYearResponse {
  id: string;
  year: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TermResponse {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  schoolId: string;
  academicYearId: string;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicYearMeta {
  total: number;
  page: number;
  lastPage: number;
  limit: number;
}

export interface TermMeta {
  total: number;
  page: number;
  lastPage: number;
  limit: number;
}

export interface AcademicYearsResponse {
  data: AcademicYearResponse[];
  meta: AcademicYearMeta;
}

export interface TermsResponse {
  data: TermResponse[];
  meta: TermMeta;
}

const getSchoolId = () => {
  const schoolId = getLocalStorageItem('user')?.schoolId;

  if (!schoolId) {
    throw new Error('School ID not found');
  }

  return schoolId;
};

export const createAcademicYear = async (academicYear: AcademicYear): Promise<AcademicYearResponse> => {
  

  try {
    const response = await fetch(`${API_ENDPOINTS.CREATE_ACADEMIC_YEAR}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify({
        ...academicYear,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create academic year');
    }

    const data: AcademicYearResponse = await response.json();
    toast.success('Academic year created successfully');
    return data;
  } catch (error) {
    toast.error('Failed to create academic year. Please try again.');
    throw error;
  }
};

export const getAcademicYears = async (): Promise<AcademicYearsResponse> => {
  const token = localStorage.getItem('accessToken');

  // if (!token) {
  //   throw new Error('User not authenticated');
  // }

  try {
    const response = await fetch(`${API_ENDPOINTS.GET_ACADEMIC_YEARS}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch academic years');
    }

    const data: AcademicYearsResponse = await response.json();
    return data;
  } catch (error) {
    toast.error('Failed to fetch academic years. Please try again.');
    throw error;
  }
};

export const createTerm = async (term: Term): Promise<TermResponse> => {
  const userData = getLocalStorageItem('user') as User | null;
  if (!userData?.schoolId) {
    throw new Error('School ID not found');
  }

  const schoolId = userData.schoolId._id.toString();

  try {
    const response = await fetch(`${API_ENDPOINTS.CREATE_TERM}`, {
      method: 'POST',
      headers: {  
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify({
        ...term,
        schoolId
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create term');
    }

    const data: TermResponse = await response.json();
    toast.success('Term created successfully');
    return data;
  } catch (error) {
    toast.error('Failed to create term. Please try again.');
    throw error;
  }
};

export const getTerms = async (): Promise<TermsResponse> => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${API_ENDPOINTS.GET_TERMS}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch terms');
    }

    const data: TermsResponse = await response.json();
    return data;
  } catch (error) {
    toast.error('Failed to fetch terms. Please try again.');
    throw error;
  }
};
