// Assessment status type
export type AssessmentStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export interface AssessmentForm {
  name: string;
  description?: string;
  termId: string;
  startDate: string;
  endDate: string;
  status?: AssessmentStatus;
}

export interface Assessment {
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
  status: AssessmentStatus;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssessmentRequest {
  name: string;
  description?: string;
  termId: string;
  startDate: string;
  endDate: string;
  status?: AssessmentStatus;
}

export interface UpdateAssessmentRequest {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: AssessmentStatus;
}

export interface AssessmentsResponse {
  assessments: Assessment[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface Term {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  academicYearId: string;
  schoolId: string;
  isCurrent: boolean;
}