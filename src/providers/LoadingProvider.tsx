'use client';

import { useLoading } from '@/hooks/useLoading';
import LoadingModal from '@/components/LoadingModal';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoadingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoading, startLoading, stopLoading } = useLoading();

  useEffect(() => {
    const handleStart = () => startLoading();
    const handleComplete = () => stopLoading();

    window.addEventListener('routeChangeStart', handleStart);
    window.addEventListener('routeChangeComplete', handleComplete);
    window.addEventListener('routeChangeError', handleComplete);

    return () => {
      window.removeEventListener('routeChangeStart', handleStart);
      window.removeEventListener('routeChangeComplete', handleComplete);
      window.removeEventListener('routeChangeError', handleComplete);
    };
  }, [pathname, startLoading, stopLoading]);

  return (
    <>
      {children}
      <LoadingModal isLoading={isLoading} />
    </>
  );
}
