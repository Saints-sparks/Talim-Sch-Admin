"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiUsers, FiBook, FiInfo } from "react-icons/fi";

interface AddClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: {
    name: string;
    classCapacity: string;
    classDescription: string;
  }) => Promise<void>;
  isCreating: boolean;
}

const AddClassModal: React.FC<AddClassModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isCreating,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    classDescription: "",
    classCapacity: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Class name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Class name must be at least 2 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      // Reset form on success
      setFormData({
        name: "",
        classDescription: "",
        classCapacity: "",
      });
      setErrors({});
    } catch (error) {
      // Error handling is done in the parent component
      console.error("Form submission error:", error);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setFormData({
        name: "",
        classDescription: "",
        classCapacity: "",
      });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white relative overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <FiBook className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Create New Class</h2>
                  <p className="text-blue-100 text-sm mt-1">
                    Add a new class to your school management system
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                disabled={isCreating}
                className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiX className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Class Information Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-6 uppercase tracking-wide flex items-center gap-2">
                    <FiBook className="w-4 h-4 text-blue-600" />
                    Class Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Class Name */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Class Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        placeholder="Enter class name (e.g., Grade 10A, JSS 1)"
                        value={formData.name}
                        onChange={handleInputChange}
                        disabled={isCreating}
                        className={`w-full px-4 py-3 bg-white border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed ${
                          errors.name
                            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                            : "border-gray-200 focus:border-blue-500"
                        }`}
                        required
                      />
                      {errors.name && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-red-600 text-sm mt-1 flex items-center gap-1"
                        >
                          <FiInfo className="w-3 h-3" />
                          {errors.name}
                        </motion.p>
                      )}
                    </div>

                    {/* Class Capacity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Class Capacity
                      </label>
                      <select
                        name="classCapacity"
                        value={formData.classCapacity}
                        onChange={handleInputChange}
                        disabled={isCreating}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Select capacity (optional)</option>
                        <option value="10">10 students</option>
                        <option value="15">15 students</option>
                        <option value="20">20 students</option>
                        <option value="25">25 students</option>
                        <option value="30">30 students</option>
                        <option value="35">35 students</option>
                        <option value="40">40 students</option>
                      </select>
                    </div>

                    {/* Students Icon for visual enhancement */}
                    <div className="flex items-end">
                      <div className="w-full h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                        <FiUsers className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Class Description */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-6 uppercase tracking-wide flex items-center gap-2">
                    <FiInfo className="w-4 h-4 text-blue-600" />
                    Additional Details
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Class Description
                    </label>
                    <textarea
                      name="classDescription"
                      placeholder="Provide additional notes about the class (optional)..."
                      value={formData.classDescription}
                      onChange={handleInputChange}
                      disabled={isCreating}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400 resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                      rows={4}
                    />
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FiInfo className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 mb-1">
                        Class Setup Information
                      </h4>
                      <p className="text-sm text-blue-700 leading-relaxed">
                        Once created, you'll be able to add students, assign
                        teachers, and manage the class schedule. The class
                        capacity helps track enrollment limits, while the
                        description provides context for other administrators.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Fixed Footer with Action Buttons */}
          <div className="flex-shrink-0 border-t border-gray-100 px-8 py-6 bg-gray-50">
            <div className="flex justify-end gap-4">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClose}
                disabled={isCreating}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                onClick={handleSubmit}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isCreating || !formData.name.trim()}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCreating ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    Creating Class...
                  </>
                ) : (
                  <>
                    <FiBook className="w-4 h-4" />
                    Create Class
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddClassModal;
