import { useEffect, useState } from 'react';
import { getLocalStorageItem } from '@/app/utils/localStorage';

export const useSchoolId = () => {
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchoolId = async () => {
      try {
        const userData = getLocalStorageItem('user');
        if (userData?.schoolId) {
          const schoolId = userData.schoolId._id.toString();
          setSchoolId(schoolId);
        } else {
          setError('School ID not found in user data');
        }
      } catch (err) {
        setError('Error retrieving school ID');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchoolId();
  }, []);

  return {
    schoolId,
    isLoading,
    error,
  };
};
