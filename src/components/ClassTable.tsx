import type React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEdit,
  FiPlus,
  FiUsers,
  FiBook,
  FiEye,
  FiMoreVertical,
} from "react-icons/fi";
import { School, AlertTriangle, GraduationCap } from "lucide-react";

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
  onRetry: () => void;
}

const ClassTable: React.FC<ClassTableProps> = ({
  classes,
  error,
  onAdd,
  onView,
  onEdit,
  onRetry,
}) => {
  const getCapacityStatus = (
    capacity: number | undefined,
    studentCount: number
  ) => {
    if (!capacity) return { status: "unknown", percentage: 0 };
    const percentage = (studentCount / capacity) * 100;
    if (percentage >= 90) return { status: "full", percentage };
    if (percentage >= 70) return { status: "high", percentage };
    return { status: "normal", percentage };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "full":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "normal":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <motion.section
        className="bg-white shadow-sm rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-md">
              <School className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Classes Management
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Manage your school classes and student enrollment
              </p>
            </div>
          </div>
          <motion.button
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105"
            onClick={onAdd}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiPlus className="w-5 h-5" />
            <span>Add New Class</span>
          </motion.button>
        </div>

        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto shadow-sm">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h4 className="text-red-800 text-xl font-bold mb-2">
                  Failed to Load Classes
                </h4>
                <p className="text-red-600 mb-6 leading-relaxed">{error}</p>
                <motion.button
                  onClick={onRetry}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all duration-300 shadow-md hover:shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Try Again
                </motion.button>
              </div>
            </motion.div>
          ) : classes.length === 0 ? (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-12 max-w-lg mx-auto shadow-sm">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <School className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-gray-800 text-2xl font-bold mb-3">
                  No Classes Yet
                </h4>
                <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                  Get started by creating your first class to organize your
                  students and curriculum effectively.
                </p>
                <motion.button
                  onClick={onAdd}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiPlus className="inline w-5 h-5 mr-2" />
                  Create Your First Class
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <div className="bg-gray-50 rounded-xl border border-gray-200">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-4 px-6 text-gray-700 font-semibold text-sm uppercase tracking-wide">
                          Class Information
                        </th>
                        <th className="text-left py-4 px-6 text-gray-700 font-semibold text-sm uppercase tracking-wide">
                          Capacity
                        </th>
                        <th className="text-left py-4 px-6 text-gray-700 font-semibold text-sm uppercase tracking-wide">
                          Enrollment
                        </th>
                        <th className="text-left py-4 px-6 text-gray-700 font-semibold text-sm uppercase tracking-wide">
                          Description
                        </th>
                        <th className="text-center py-4 px-6 text-gray-700 font-semibold text-sm uppercase tracking-wide">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {classes.map((item, index) => {
                        const capacityStatus = getCapacityStatus(
                          item.classCapacity,
                          item.studentCount
                        );
                        return (
                          <motion.tr
                            key={item._id}
                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                          >
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg shadow-sm">
                                  <FiBook className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900 text-lg">
                                    {item.name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="text-gray-900 font-medium">
                                {item.classCapacity ? (
                                  <span className="flex items-center gap-2">
                                    {item.classCapacity}
                                    <span className="text-xs text-gray-500">
                                      students
                                    </span>
                                  </span>
                                ) : (
                                  <span className="text-gray-500 italic">
                                    Not set
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <span
                                  className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                                    capacityStatus.status
                                  )}`}
                                >
                                  {item.studentCount}
                                </span>
                                {item.classCapacity && (
                                  <div className="flex-1 max-w-24">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div
                                        className={`h-2 rounded-full transition-all duration-300 ${
                                          capacityStatus.status === "full"
                                            ? "bg-red-500"
                                            : capacityStatus.status === "high"
                                            ? "bg-yellow-500"
                                            : "bg-green-500"
                                        }`}
                                        style={{
                                          width: `${Math.min(
                                            capacityStatus.percentage,
                                            100
                                          )}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="max-w-48">
                                {item.classDescription ? (
                                  <p
                                    className="text-gray-700 text-sm line-clamp-2"
                                    title={item.classDescription}
                                  >
                                    {item.classDescription}
                                  </p>
                                ) : (
                                  <span className="text-gray-500 italic text-sm">
                                    No description
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-center gap-2">
                                <motion.button
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                  onClick={() => onView(item._id)}
                                  title="View Class"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <FiEye className="w-5 h-5" />
                                </motion.button>
                                <motion.button
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                                  onClick={() => onEdit(item._id)}
                                  title="Edit Class"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <FiEdit className="w-5 h-5" />
                                </motion.button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile/Tablet Card View */}
              <div className="lg:hidden space-y-4">
                {classes.map((item, index) => {
                  const capacityStatus = getCapacityStatus(
                    item.classCapacity,
                    item.studentCount
                  );
                  return (
                    <motion.div
                      key={item._id}
                      className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg shadow-sm">
                            <FiBook className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 text-lg">
                              {item.name}
                            </h4>
                            <p className="text-sm text-gray-500">
                              ID: {item._id.slice(-8)}
                            </p>
                          </div>
                        </div>
                        <div className="relative">
                          <FiMoreVertical className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <FiUsers className="w-4 h-4 text-gray-500" />
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              capacityStatus.status
                            )}`}
                          >
                            {item.studentCount} enrolled
                          </span>
                        </div>
                        {item.classCapacity && (
                          <div className="text-sm text-gray-600">
                            of {item.classCapacity} capacity
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      {item.classDescription && (
                        <div className="mb-4">
                          <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                            {item.classDescription}
                          </p>
                        </div>
                      )}

                      {/* Progress Bar */}
                      {item.classCapacity && (
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-gray-500 mb-2">
                            <span>Enrollment Progress</span>
                            <span>
                              {Math.round(capacityStatus.percentage)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                capacityStatus.status === "full"
                                  ? "bg-red-500"
                                  : capacityStatus.status === "high"
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                              style={{
                                width: `${Math.min(
                                  capacityStatus.percentage,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                        <motion.button
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
                          onClick={() => onView(item._id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <FiEye className="inline w-4 h-4 mr-2" />
                          View Details
                        </motion.button>
                        <motion.button
                          className="p-3 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                          onClick={() => onEdit(item._id)}
                          title="Edit"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <FiEdit className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </div>
  );
};

export default ClassTable;
