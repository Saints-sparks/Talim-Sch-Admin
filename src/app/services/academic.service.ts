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
  schoolId: string;
}

export interface AcademicYearResponse {
  _id: string;
  year: string;
  startDate: string;
  endDate: string;
  schoolId: string;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TermResponse {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  schoolId: string;
  academicYearId: string;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
}

const formatDate = (date: string): string => {
  const d = new Date(date);
  return d.toISOString();
};

export const createAcademicYear = async (academicYear: AcademicYear): Promise<AcademicYearResponse> => {
  try {
    const formattedData = {
      ...academicYear,
      // startDate: formatDate(academicYear.startDate),
      // endDate: formatDate(academicYear.endDate)
    };

    const response = await fetch(`${API_ENDPOINTS.CREATE_ACADEMIC_YEAR}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify(formattedData)
    });

    if (!response.ok) {
      throw new Error('Failed to create academic year');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating academic year:', error);
    throw error;
  }
};

export const createTerm = async (data: Omit<Term, 'schoolId'>): Promise<TermResponse> => {
  try {
    const response = await fetch(`${API_ENDPOINTS.CREATE_TERM}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify({
        ...data,
        academicYearId: data.academicYearId, // Ensure academicYearId is properly included
        name: data.name.trim(), // Trim any whitespace from name
        startDate: data.startDate,
        endDate: data.endDate,
        isCurrent: data.isCurrent
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create term');
    }

    const result = await response.json();
    return {
      _id: result._id,
      name: result.name,
      startDate: result.startDate,
      endDate: result.endDate,
      academicYearId: result.academicYearId,
      isCurrent: result.isCurrent,
      schoolId: result.schoolId,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    };
  } catch (error) {
    console.error('Error creating term:', error);
    throw error;
  }
};

export const getAcademicYears = async (): Promise<AcademicYearResponse[]> => {
  try {
    const response = await fetch(`${API_ENDPOINTS.GET_ACADEMIC_YEARS}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch academic years');
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching academic years:', error);
    throw error;
  }
};

export const getTerms = async (): Promise<TermResponse[]> => {
  try {
    const response = await fetch(`${API_ENDPOINTS.GET_TERMS}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch terms');
    }

    const data = await response.json();
    return Array.isArray(data.terms) ? data.terms : [];
  } catch (error) {
    console.error('Error fetching terms:', error);
    throw error;
  }
};

export const setCurrentTerm = async (termId: string): Promise<void> => {
  try {
    const url = API_ENDPOINTS.SET_CURRENT_TERM(termId);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to set current term');
    }
  } catch (error) {
    console.error('Error setting current term:', error);
    throw error;
  }
};
