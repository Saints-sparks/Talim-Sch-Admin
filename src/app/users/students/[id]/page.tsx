"use client";

import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function StudentProfileRedirect() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  useEffect(() => {
    // Add a slight delay for smooth transition
    const timer = setTimeout(() => {
      router.replace(`/users/students/${studentId}/view`);
    }, 600);

    return () => clearTimeout(timer);
  }, [router, studentId]);

  return (
    <motion.div 
      className="min-h-screen bg-gray-50 flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <motion.div 
        className="text-center"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <motion.div 
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.p 
          className="mt-2 text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          Loading student profile...
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
