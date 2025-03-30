// src/components/ProtectedRoute.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getLocalStorageItem } from '../app/utils/localStorage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  
  const user = getLocalStorageItem('user');
  const accessToken = getLocalStorageItem('accessToken');

  // Check if user is authenticated
  const isAuthenticated = !!user && !!accessToken;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/signin'); // Redirect to login if not authenticated
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;