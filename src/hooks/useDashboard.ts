import { useState, useEffect, useCallback } from 'react'
import { getSchoolDashboard, type SchoolDashboardData } from '../app/services/dashboard.service'
import { getSchoolId } from '../app/services/school.service'
import { toast } from 'react-toastify'

interface UseDashboardReturn {
  dashboardData: SchoolDashboardData | null
  isLoading: boolean
  error: string | null
  refreshDashboard: () => Promise<void>
}

export const useDashboard = (): UseDashboardReturn => {
  const [dashboardData, setDashboardData] = useState<SchoolDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const schoolId = getSchoolId()
      if (!schoolId) {
        throw new Error('School ID is required')
      }

      const data = await getSchoolDashboard(schoolId)
      setDashboardData(data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard data. Please try again later.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshDashboard = useCallback(async () => {
    await fetchDashboardData()
  }, [fetchDashboardData])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  return {
    dashboardData,
    isLoading,
    error,
    refreshDashboard,
  }
}
