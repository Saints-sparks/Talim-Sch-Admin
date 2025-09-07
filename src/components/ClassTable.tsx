import type React from "react";
import { FiEdit, FiTrash, FiPlus } from "react-icons/fi";

interface ClassTableProps {
  classes: Array<{
    _id: string;
    name: string;
    classDescription?: string;
    classCapacity?: number;
    studentCount: number;
  }>;
  error: string | null;
  onAdd: () => void;
  onView: (classId: string) => void;
  onEdit: (classId: string) => void;
  onDelete: (classId: string) => void;
  onRetry: () => void;
}

const ClassTable: React.FC<ClassTableProps> = ({
  classes,
  error,
  onAdd,
  onView,
  onEdit,
  onDelete,
  onRetry,
}) => {
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <section className="bg-white shadow rounded-[20px] p-4 sm:p-6">
        <div className="">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 sm:gap-0">
            <h3 className="text-lg font-semibold text-gray-800">Classes</h3>
            <button
              className="flex items-center font-bold text-[#154473] hover:text-blue-500 transition duration-200 whitespace-nowrap"
              onClick={onAdd}
            >
              <FiPlus className="mr-2" /> Add Class
            </button>
          </div>

          {error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
                <div className="text-red-600 text-lg font-semibold mb-2">
                  Error Loading Classes
                </div>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={onRetry}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
                <div className="text-gray-400 text-6xl mb-4">📚</div>
                <div className="text-gray-600 text-lg font-semibold mb-2">
                  No Classes Found
                </div>
                <p className="text-gray-500 mb-4">
                  Get started by creating your first class to organize your
                  students and curriculum.
                </p>
                <button
                  onClick={onAdd}
                  className="px-4 py-2 bg-[#154473] text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Create First Class
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 sm:px-4 text-gray-800 font-semibold">
                      Class Name
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-gray-800 font-semibold hidden sm:table-cell">
                      Capacity
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-gray-800 font-semibold">
                      Students
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-gray-800 font-semibold hidden md:table-cell">
                      Description
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-gray-800 font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((item) => (
                    <tr
                      key={item._id}
                      className="border-b hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="py-3 px-2 sm:px-4 text-gray-800">
                        <div className="font-medium">{item.name}</div>
                        {/* Show capacity and description on mobile as subtitle */}
                        <div className="text-sm text-gray-500 sm:hidden">
                          {item.classCapacity &&
                            `Capacity: ${item.classCapacity}`}
                          {item.classCapacity && item.classDescription && " • "}
                          {item.classDescription && (
                            <span className="md:hidden">
                              {item.classDescription.length > 30
                                ? `${item.classDescription.substring(0, 30)}...`
                                : item.classDescription}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-gray-800 hidden sm:table-cell">
                        {item.classCapacity || "N/A"}
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-gray-800">
                        <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded whitespace-nowrap">
                          {item.studentCount}
                        </span>
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-gray-800 hidden md:table-cell">
                        <div
                          className="max-w-[200px] truncate"
                          title={item.classDescription || "N/A"}
                        >
                          {item.classDescription || "N/A"}
                        </div>
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-1">
                          <button
                            className="px-3 sm:px-6 py-1 bg-[#0033661A] border-[#00336626] border text-[#003366] rounded hover:bg-blue-600 hover:text-white transition-colors text-sm whitespace-nowrap"
                            onClick={() => onView(item._id)}
                          >
                            View
                          </button>
                          <div className="flex gap-1">
                            <button
                              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                              onClick={() => onEdit(item._id)}
                              title="Edit"
                            >
                              <FiEdit className="text-lg" />
                            </button>
                            <button
                              className="p-2 text-red-500 hover:text-red-700 transition-colors"
                              onClick={() => onDelete(item._id)}
                              title="Delete"
                            >
                              <FiTrash className="text-lg" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ClassTable;
