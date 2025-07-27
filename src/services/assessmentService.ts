import { 
  AssessmentForm, 
  Assessment, 
  CreateAssessmentRequest, 
  UpdateAssessmentRequest, 
  AssessmentsResponse 
} from '@/components/assessment/AssessmentForm.types';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

class AssessmentService {
  private getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  private getSchoolId(): string {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      return userData.schoolId._id;
    }
    throw new Error('School ID not found');
  }

  /**
   * Create a new assessment
   */
  async createAssessment(assessmentData: CreateAssessmentRequest): Promise<{ message: string; assessment: Assessment }> {
    try {
      const response = await fetch(`${BASE_URL}/assessments`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(assessmentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create assessment');
      }

      return await response.json();
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
      const schoolId = this.getSchoolId();
      const response = await fetch(
        `${BASE_URL}/assessments/school/${schoolId}?page=${page}&limit=${limit}`,
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
  async getAssessmentsByTerm(termId: string): Promise<Assessment[]> {
    try {
      const response = await fetch(`${BASE_URL}/assessments/term/${termId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch assessments by term');
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
  async getAssessmentById(assessmentId: string): Promise<Assessment> {
    try {
      const response = await fetch(`${BASE_URL}/assessments/${assessmentId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

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
  async updateAssessment(
    assessmentId: string, 
    updateData: UpdateAssessmentRequest
  ): Promise<{ message: string; assessment: Assessment }> {
    try {
      const response = await fetch(`${BASE_URL}/assessments/${assessmentId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update assessment');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating assessment:', error);
      throw error;
    }
  }

  /**
   * Delete an assessment
   */
  async deleteAssessment(assessmentId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${BASE_URL}/assessments/${assessmentId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete assessment');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting assessment:', error);
      throw error;
    }
  }

  /**
   * Format date for API
   */
  formatDateForAPI(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString();
  }

  /**
   * Format date for display
   */
  formatDateForDisplay(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Get status color for UI
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Validate assessment dates
   */
  validateAssessmentDates(startDate: string, endDate: string): { isValid: boolean; error?: string } {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start >= end) {
      return { isValid: false, error: 'End date must be after start date' };
    }

    if (start < now) {
      return { isValid: false, error: 'Start date cannot be in the past' };
    }

    return { isValid: true };
  }
}

export const assessmentService = new AssessmentService();
