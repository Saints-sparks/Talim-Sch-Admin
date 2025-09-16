import { API_BASE_URL } from '../lib/api/config'
import { getLocalStorageItem } from '../lib/localStorage'

export interface SchoolDashboardData {
  totalClasses: number
  totalStudents: number
  totalTeachers: number
  totalSubjects: number
  totalParents: number
  recentClasses: Array<{
    _id: string
    name: string
    classDescription?: string
    classCapacity?: number
    studentCount: number
    createdAt: string
  }>
  studentDistribution: Array<{
    className: string
    studentCount: number
  }>
  schoolInfo: {
    _id: string
    name: string
    email: string
    schoolPrefix: string
    physicalAddress: string
    active: boolean
    logo: string
  }
}

/**
 * Fetches comprehensive dashboard data for a school
 * @param schoolId - The ID of the school
 * @returns Promise resolving to school dashboard data
 */
export const getSchoolDashboard = async (schoolId: string): Promise<SchoolDashboardData> => {
  try {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      throw new Error('No access token found')
    }

    const response = await fetch(`${API_BASE_URL}/schools/${schoolId}/dashboard`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to fetch dashboard data: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching school dashboard:', error)
    throw error instanceof Error ? error : new Error('Failed to fetch dashboard data')
  }
}
