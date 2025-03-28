import React from 'react';
import { Complaint } from '@/app/services/complaint.service';

interface ComplaintCardProps {
  complaint: Complaint;
  onComplaintClick: (ticket: string) => void;
}

const ComplaintCard: React.FC<ComplaintCardProps> = ({ complaint, onComplaintClick }) => {
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div
      onClick={() => onComplaintClick(complaint.ticket)}
      className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{complaint.subject}</h3>
          <p className="mt-2 text-gray-600 line-clamp-2">{complaint.description}</p>
        </div>
        <div className="flex items-center space-x-4">
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
              complaint.status === 'Pending'
                ? 'bg-yellow-100 text-yellow-800'
                : complaint.status === 'Resolved'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {complaint.status}
          </span>
          <span className="text-sm text-gray-500">
            {formatDateTime(complaint.createdAt)}
          </span>
        </div>
      </div>
      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center space-x-2">
          <span className="text-gray-500">
            {complaint.userId.firstName} {complaint.userId.lastName}
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-500">#{complaint.ticket}</span>
        </div>
        {complaint.attachment && (
          <a
            href={complaint.attachment}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
          >
            View Attachment
          </a>
        )}
      </div>
    </div>
  );
};

export default ComplaintCard;
