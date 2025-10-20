import type React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus } from "react-icons/fi";
import { School, AlertTriangle } from "lucide-react";
import { ChevronLeft, ChevronRight, Edit2, Eye, Search } from "./Icons";
import { ChevronDown } from "./Icons";

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
    <div className="px-4 sm:px-6 lg:px-8 leading-[120%]">
      <motion.section
        className="pt-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header - matches design */}
        <div className="flex justify-between items-center mb-6 gap-4 lg:gap-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-semibold text-[#2F2F2F]">
              Classes Management
            </h3>
            <button
              className="px-2 py-1 bg-white hover:bg-gray-200 text-[#393939] rounded-xl font-medium text-[15px] border border-[#E4E4E4] flex items-center gap-2"
              onClick={onAdd}
            >
              <FiPlus className="w-4 h-4" />
              Add
            </button>
          </div>
          <div className="flex w-[300px] h-[40px] border border-[#E0E0E0] gap-2 bg-white items-center p-2 rounded-xl text-[#898989]">
                <Search />
                <input
                  type="search"
                  placeholder="Search"
                  className="flex-1 border-none shadow-none placeholder-[#B3B3B3] placeholder:font-medium placeholder:text-[15px] focus:outline-none focus-visible:ring-0"
                />
              </div>
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
              {/* Desktop Table View - matches design */}
              <div className="overflow-x-auto">
                <div className="border border-[#F0F0F0] rounded-2xl overflow-hidden">
                  <table className="w-full bg-white border-[#F0F0F0]">
                    <thead>
                      <tr className="border-b border-[#F0F0F0]">
                        <th className="text-left py-4 px-6  font-semibold text-[15px]">
                          Class Information
                        </th>
                        <th className="text-left py-4 px-6  font-semibold text-[15px]">
                          Capacity
                        </th>
                        <th className="text-left py-4 px-6  font-semibold text-[15px]">
                          Description
                        </th>
                        <th className="text-center py-4 px-6  font-semibold text-[15px]">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {classes.map((item, index) => (
                        <tr
                          key={item._id}
                          className="border-b border-[#F0F0F0] hover:bg-gray-50 transition-colors duration-200"
                        >
                          {/* Class Information */}
                          <td className="py-2 px-6">
                            <span className="font-medium text-[#707070] text-[15px]">
                              {item.name}
                            </span>
                          </td>
                          {/* Capacity */}
                          <td className="py-2 px-6">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800 text-base">
                                {item.studentCount}/{item.classCapacity ?? "--"}
                              </span>
                              {/* Avatars - placeholder, replace with actual avatars if available */}
                              <div className="flex -space-x-2">
                                {[0, 1, 2].map((i) => (
                                  <img
                                    key={i}
                                    src={`https://randomuser.me/api/portraits/med/men/${
                                      i + 10
                                    }.jpg`}
                                    alt="avatar"
                                    className="w-7 h-7 rounded-full border-2 border-white shadow"
                                  />
                                ))}
                              </div>
                            </div>
                          </td>
                          {/* Description */}
                          <td className="py-2 px-6">
                            <span
                              className="text-[#808080] text-[15px] font-medium max-w-xs block truncate"
                              title={item.classDescription}
                            >
                              {item.classDescription ?? "No description"}
                            </span>
                          </td>
                          {/* Action */}
                          <td className="py-2 px-6 text-center">
                            <div className="flex items-center gap-2 justify-center">
                              <button
                                className="px-2 py-2  hover:bg-gray-200 text-[#003366] rounded-xl font-semibold text-[15px] flex items-center gap-2 border border-[#E4E4E4]"
                                onClick={() => onView(item._id)}
                              >
                                <Eye />
                                View
                              </button>
                              <button
                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl border border-gray-200"
                                onClick={() => onEdit(item._id)}
                                title="Edit"
                              >
                                <Edit2 />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination Footer - matches design */}
                <div className="flex items-center justify-between px-6 py-2 border border-[#F2F2F2] rounded-xl bg-white mt-4">
                  <span className="text-[#979797] text-[15px] font-medium">
                    Showing 1 - {classes.length} of 6
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <select className="px-4 py-2 pr-8 rounded-xl border border-[#F0F0F0] text-[#030E18] font-medium text-[15px] appearance-none">
                        <option>1</option>
                        <option>2</option>
                      </select>
                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                        <ChevronDown />
                      </span>
                    </div>
                    
                    <span className="text-[#979797] text-[15px]">
                      of page 2
                    </span>
                    <ChevronLeft />
                    <ChevronRight />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </div>
  );
};

export default ClassTable;
