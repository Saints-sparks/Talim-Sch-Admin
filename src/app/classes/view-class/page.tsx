"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This component handles URLs like: /classes/view-class?id=123
// and redirects them to: /classes/view-class/123

const ViewClassRedirect: React.FC = () => {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to classes list since this page shouldn't be accessed directly
    router.replace('/classes');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
};

export default ViewClassRedirect;