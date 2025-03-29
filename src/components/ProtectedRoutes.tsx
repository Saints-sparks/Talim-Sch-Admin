// src/components/ProtectedRoute.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getLocalStorageItem } from '../app/utils/localStorage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const user = getLocalStorageItem('user');
  const accessToken = getLocalStorageItem('accessToken');

  useEffect(() => {
    if (!accessToken || !user) {
      router.push('/signin'); // Redirect to login if no token or user
    }
  }, [accessToken, user, router]);

  if (!accessToken || !user) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;