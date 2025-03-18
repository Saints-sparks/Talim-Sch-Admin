// src/components/ProtectedRoute.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '../utils/auth';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const accessToken = getAccessToken();

  useEffect(() => {
    if (!accessToken) {
      router.push('/signin'); // Redirect to login if no token
    }
  }, [accessToken, router]);

  return accessToken ? <>{children}</> : null;
};

export default ProtectedRoute;