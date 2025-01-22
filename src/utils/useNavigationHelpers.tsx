'use client';

import { useRouter } from 'next/navigation';

export const useNavigationHelpers = (): { goBack: () => void } => {
  const router = useRouter();

  const goBack = (): void => {
    router.back();
  };

  return { goBack };
};
