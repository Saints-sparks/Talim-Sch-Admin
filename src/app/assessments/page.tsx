'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaSearch, FaEllipsisV } from 'react-icons/fa';
import { ClipboardList, Plus, Calendar, Clock, CheckCircle, XCircle, AlertCircle, PlayCircle } from 'lucide-react';
import { Assessment, Term } from '@/components/assessment/AssessmentForm.types';
import { assessmentService } from '@/app/services/assessment.service';
import AssessmentManagementPage from '@/components/assessment/AssessmentManagementPage';
import { Header } from '@/components/Header';
import { useToast } from '@/components/CustomToast';
import { getTerms, TermResponse } from '../services/academic.service';

const AssessmentPage: React.FC = () => {
  const [terms, setTerms] = useState<TermResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Fetch terms from API
  const fetchTerms = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getTerms();
      setTerms(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch terms');
      toast.error('Failed to fetch terms');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col">
      {/* Header Section */}
      <Header />
      
      {/* Main Assessment Management */}
      <div className="mt-5">
        <AssessmentManagementPage terms={terms} />
      </div>
    </div>
  );
};

export default AssessmentPage;
