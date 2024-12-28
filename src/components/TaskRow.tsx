import { StaticImageData } from "next/image";
import React from "react";

type TaskRowProps = {
  name: string;
  student: string | StaticImageData;
  className: string;
  duration: string;
  status: "In Progress" | "Pending" | "Completed";
  completed: number;
  total: number;
};

const TaskRow: React.FC<TaskRowProps> = ({
  name,
  student,
  className,
  duration,
  status,
  completed,
  total,
}) => {
  const completionRate = Math.round((completed / total) * 100);

  const statusStyles = {
    "In Progress": "bg-orange-200 text-orange-800",
    Pending: "bg-gray-200 text-gray-800",
    Completed: "bg-green-200 text-green-800",
  };

  return (
    <tr className="border-b border-gray-200">
      <td className="px-4 py-5 text-sm text-gray-700">{name}</td>
      <td className="px-4 py-5 text-sm text-gray-700">
        {typeof student === "string" ? (
          student
        ) : (
          <img src={student.src} alt="Student" className="h-8 rounded-full" />
        )}
      </td>
      <td className="px-4 py-5 text-sm text-gray-700">{className}</td>
      <td className="px-4 py-5 text-sm text-gray-700">{duration}</td>
      <td className="px-4 py-5 text-sm">
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[status]}`}
        >
          {status}
        </span>
      </td>
      <td className="px-4 py-5 text-sm text-gray-700">
        <div className="flex items-center space-x-2">
          <span className="text-gray-600">
            {completed}/{total} completed
          </span>
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default TaskRow;
