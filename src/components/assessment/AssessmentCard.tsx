"use client";

import React from 'react';
import { Calendar, Clock, Edit, Trash2, Eye, Users, CheckCircle, XCircle, AlertCircle, PlayCircle } from 'lucide-react';
import { Assessment, AssessmentStatus } from '@/components/assessment/AssessmentForm.types';

interface AssessmentCardProps {
  assessment: Assessment;
  onEdit: (assessment: Assessment) => void;
  onDelete: (assessment: Assessment) => void;
  onView: (assessment: Assessment) => void;
}

const AssessmentCard: React.FC<AssessmentCardProps> = ({
  assessment,
  onEdit,
  onDelete,
  onView,
}) => {
  const getStatusConfig = (status: AssessmentStatus) => {
    switch (status) {
      case 'pending':
        return {
          color: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
          icon: <Clock className="h-3 w-3" />,
          label: 'Pending',
        };
      case 'active':
        return {
          color: 'bg-blue-100 text-blue-800 border border-blue-200',
          icon: <PlayCircle className="h-3 w-3" />,
          label: 'Active',
        };
      case 'completed':
        return {
          color: 'bg-green-100 text-green-800 border border-green-200',
          icon: <CheckCircle className="h-3 w-3" />,
          label: 'Completed',
        };
      case 'cancelled':
        return {
          color: 'bg-red-100 text-red-800 border border-red-200',
          icon: <XCircle className="h-3 w-3" />,
          label: 'Cancelled',
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border border-gray-200',
          icon: <AlertCircle className="h-3 w-3" />,
          label: status,
        };
    }
  };

  const statusConfig = getStatusConfig(assessment.status);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysRemaining = () => {
    const startDate = new Date(assessment.startDate);
    const today = new Date();
    const diffTime = startDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: 'Started', color: 'text-green-600' };
    } else if (diffDays === 0) {
      return { text: 'Today', color: 'text-orange-600' };
    } else if (diffDays === 1) {
      return { text: '1 day left', color: 'text-orange-600' };
    } else if (diffDays <= 7) {
      return { text: `${diffDays} days left`, color: 'text-orange-600' };
    } else {
      return { text: `${diffDays} days left`, color: 'text-gray-600' };
    }
  };

  const daysRemaining = getDaysRemaining();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 h-fit">
      {/* Header with status */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
            {assessment.name}
          </h3>
          {assessment.description && (
            <p className="text-sm text-gray-500 line-clamp-2">
              {assessment.description}
            </p>
          )}
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color} ml-3 flex-shrink-0`}>
          {statusConfig.icon}
          {statusConfig.label}
        </span>
      </div>

      {/* Term and Date Info */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Users className="h-4 w-4 mr-2 text-purple-500" />
          <span>{assessment.termId.name}</span>
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2 text-green-500" />
            <span>Start: {formatDate(assessment.startDate)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2 text-orange-500" />
            <span>End: {formatDate(assessment.endDate)}</span>
          </div>
        </div>

        <div className="flex items-center text-sm">
          <span className={`font-medium ${daysRemaining.color}`}>
            {daysRemaining.text}
          </span>
        </div>
      </div>

      {/* Created By */}
      <div className="text-xs text-gray-500 mb-4">
        Created by {assessment.createdBy.name}
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-2 pt-4 border-t border-gray-100">
        <button
          onClick={() => onView(assessment)}
          className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
        >
          <Eye className="h-3 w-3" />
          View
        </button>
        <button
          onClick={() => onEdit(assessment)}
          className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
        >
          <Edit className="h-3 w-3" />
          Edit
        </button>
        <button
          onClick={() => onDelete(assessment)}
          className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </button>
      </div>
    </div>
  );
};

export default AssessmentCard;
