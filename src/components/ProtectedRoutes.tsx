// src/components/ProtectedRoute.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getLocalStorageItem } from '../app/utils/localStorage';
import { parse } from 'cookie';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  
  // Get tokens from localStorage
  const localStorageUser = getLocalStorageItem('user');
  const localStorageAccessToken = getLocalStorageItem('accessToken');

  // Get tokens from cookies
  const cookies = document.cookie;
  const parsedCookies = parse(cookies);
  const cookieUser = parsedCookies.user ? JSON.parse(parsedCookies.user) : null;
  const cookieAccessToken = parsedCookies.access_token;

  // Check if user is authenticated
  const isAuthenticated = 
    (localStorageUser && localStorageAccessToken) || 
    (cookieUser && cookieAccessToken);

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