"use client";

import React from "react";
import {
  Calendar,
  Clock,
  Edit,
  Trash2,
  Eye,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
} from "lucide-react";
import { Assessment, AssessmentStatus } from "@/components/assessment/AssessmentForm.types";
import { Tooltip } from "@/components/ui/Tooltip";

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
      case "pending":
        return {
          color: "bg-tl-warning-bg text-tl-warning border border-tl-warning/30",
          icon: <Clock className="h-3 w-3" />,
          label: "Pending",
          tooltip: "Not yet visible to teachers. Still being prepared.",
        };
      case "active":
        return {
          color: "bg-tl-select text-tl-brand border border-tl-control",
          icon: <PlayCircle className="h-3 w-3" />,
          label: "Active",
          tooltip: "Visible to teachers. Scores can now be entered.",
        };
      case "completed":
        return {
          color: "bg-tl-success-bg text-tl-success border border-tl-success/30",
          icon: <CheckCircle className="h-3 w-3" />,
          label: "Completed",
          tooltip: "Scoring period has ended. Results are finalised.",
        };
      case "cancelled":
        return {
          color: "bg-tl-danger-bg text-tl-danger border border-tl-danger/30",
          icon: <XCircle className="h-3 w-3" />,
          label: "Cancelled",
          tooltip: null,
        };
      default:
        return {
          color: "bg-tl-track text-tl-ink border border-tl-line",
          icon: <AlertCircle className="h-3 w-3" />,
          label: status,
          tooltip: null,
        };
    }
  };

  const statusConfig = getStatusConfig(assessment.status);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysRemaining = () => {
    const startDate = new Date(assessment.startDate);
    const today = new Date();
    const diffTime = startDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: "Started", color: "text-tl-success" };
    } else if (diffDays === 0) {
      return { text: "Today", color: "text-tl-warning" };
    } else if (diffDays === 1) {
      return { text: "1 day left", color: "text-tl-warning" };
    } else if (diffDays <= 7) {
      return { text: `${diffDays} days left`, color: "text-tl-warning" };
    } else {
      return { text: `${diffDays} days left`, color: "text-tl-muted" };
    }
  };

  const daysRemaining = getDaysRemaining();

  return (
    <div className="bg-tl-surface rounded-lg border border-tl-line p-6 hover:shadow-md transition-shadow duration-200 h-fit">
      {/* Header with status */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="font-medium text-tl-ink mb-1 line-clamp-2">{assessment.name}</h3>
          {assessment.description && (
            <p className="text-sm text-tl-muted line-clamp-2">{assessment.description}</p>
          )}
        </div>
        {statusConfig.tooltip ? (
          <Tooltip content={statusConfig.tooltip} side="top">
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color} ml-3 flex-shrink-0`}
            >
              {statusConfig.icon}
              {statusConfig.label}
            </span>
          </Tooltip>
        ) : (
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color} ml-3 flex-shrink-0`}
          >
            {statusConfig.icon}
            {statusConfig.label}
          </span>
        )}
      </div>

      {/* Term and Date Info */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center text-sm text-tl-muted">
          <Users className="h-4 w-4 mr-2 text-tl-accent" />
          <span>{assessment.termId.name}</span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <div className="flex items-center text-sm text-tl-muted">
            <Calendar className="h-4 w-4 mr-2 text-tl-success" />
            <span>Start: {formatDate(assessment.startDate)}</span>
          </div>
          <div className="flex items-center text-sm text-tl-muted">
            <Clock className="h-4 w-4 mr-2 text-tl-warning" />
            <span>End: {formatDate(assessment.endDate)}</span>
          </div>
        </div>

        <div className="flex items-center text-sm">
          <span className={`font-medium ${daysRemaining.color}`}>{daysRemaining.text}</span>
        </div>

        {assessment.maxScore !== undefined && (
          <div className="text-sm text-tl-muted">Scored out of {assessment.maxScore}</div>
        )}
      </div>

      {/* Created By */}
      <div className="text-xs text-tl-muted mb-4">Created by {assessment.createdBy.name}</div>

      {/* Actions */}
      <div className="flex justify-center gap-2 pt-4 border-t border-tl-line-soft">
        <button
          onClick={() => onView(assessment)}
          className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-tl-link bg-tl-select rounded-md hover:bg-tl-select transition-colors"
        >
          <Eye className="h-3 w-3" />
          View
        </button>
        <button
          onClick={() => onEdit(assessment)}
          className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-tl-muted bg-tl-subtle rounded-md hover:bg-tl-bg transition-colors"
        >
          <Edit className="h-3 w-3" />
          Edit
        </button>
        <button
          onClick={() => onDelete(assessment)}
          className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-tl-danger bg-tl-danger-bg rounded-md hover:bg-tl-danger-bg transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </button>
      </div>
    </div>
  );
};

export default AssessmentCard;
