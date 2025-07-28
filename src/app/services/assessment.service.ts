import { API_ENDPOINTS } from '../lib/api/config';
import { getLocalStorageItem } from '../lib/localStorage';

export interface CreateAssessmentRequest {
  name: string;
  description?: string;
  termId: string;
  startDate: string;
  endDate: string;
  status?: 'pending' | 'active' | 'completed' | 'cancelled';
}

export interface UpdateAssessmentRequest {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: 'pending' | 'active' | 'completed' | 'cancelled';
}

export interface AssessmentResponse {
  _id: string;
  name: string;
  description?: string;
  termId: {
    _id: string;
    name: string;
    startDate: string;
    endDate: string;
  };
  schoolId: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentsResponse {
  assessments: AssessmentResponse[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

class AssessmentService {
  private getAuthHeaders() {
    const token = localStorage.getItem('accessToken')
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  

  /**
   * Create a new assessment
   */
  async createAssessment(data: CreateAssessmentRequest): Promise<AssessmentResponse> {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/assessments`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create assessment');
      }

      const result = await response.json();
      return result.assessment;
    } catch (error) {
      console.error('Error creating assessment:', error);
      throw error;
    }
  }

  /**
   * Get assessments by school with pagination
   */
  async getAssessmentsBySchool(page: number = 1, limit: number = 10): Promise<AssessmentsResponse> {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.BASE_URL}/assessments/school/?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch assessments');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching assessments:', error);
      throw error;
    }
  }

  /**
   * Get assessments by term
   */
  async getAssessmentsByTerm(termId: string): Promise<AssessmentResponse[]> {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.BASE_URL}/assessments/term/${termId}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch assessments for term');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching assessments by term:', error);
      throw error;
    }
  }

  /**
   * Get assessment by ID
   */
  async getAssessmentById(id: string): Promise<AssessmentResponse> {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.BASE_URL}/assessments/${id}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch assessment');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching assessment:', error);
      throw error;
    }
  }

  /**
   * Update an assessment
   */
  async updateAssessment(id: string, data: UpdateAssessmentRequest): Promise<AssessmentResponse> {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/assessments/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update assessment');
      }

      const result = await response.json();
      return result.assessment;
    } catch (error) {
      console.error('Error updating assessment:', error);
      throw error;
    }
  }

  /**
   * Delete an assessment
   */
  async deleteAssessment(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/assessments/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete assessment');
      }
    } catch (error) {
      console.error('Error deleting assessment:', error);
      throw error;
    }
  }

  /**
   * Date validation utilities
   */
  validateAssessmentDates(startDate: string, endDate: string): { isValid: boolean; error?: string } {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start >= end) {
      return { isValid: false, error: 'End date must be after start date' };
    }

    if (start < today) {
      return { isValid: false, error: 'Start date cannot be in the past' };
    }

    return { isValid: true };
  }

  /**
   * Format date for API
   */
  formatDateForAPI(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString();
  }

  /**
   * Get status color for UI
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}

export const assessmentService = new AssessmentService();
