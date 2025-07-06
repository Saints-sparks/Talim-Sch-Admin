"use client";

import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function StudentProfileRedirect() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  useEffect(() => {
    // Redirect to the new view page
    router.replace(`/users/students/${studentId}/view`);
  }, [router, studentId]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
