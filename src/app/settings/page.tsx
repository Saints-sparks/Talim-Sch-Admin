"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings as SettingsIcon,
  Calendar,
  BookOpen,
  Save,
  Plus,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  School,
  ChevronDown,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import {
  AcademicYearResponse,
  TermResponse,
  createAcademicYear,
  createTerm,
  getAcademicYears,
  getTerms,
  setCurrentTerm,
} from "@/app/services/academic.service";

interface AcademicYear {
  year: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  schoolId: string;
}

interface Term {
  name: string;
  startDate: string;
  endDate: string;
  academicYearId: string;
  isCurrent: boolean;
  schoolId: string;
}

const formatDate = (date: string): string => {
  const d = new Date(date);
  return d.toISOString();
};

const Settings: React.FC = () => {
  const [isAcademicYearModalOpen, setIsAcademicYearModalOpen] = useState(false);
  const [isTermModalOpen, setIsTermModalOpen] = useState(false);
  const [academicYearForm, setAcademicYearForm] = useState<AcademicYear>({
    year: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    schoolId: "",
  });
  const [termForm, setTermForm] = useState<Term>({
    name: "",
    startDate: "",
    endDate: "",
    academicYearId: "",
    isCurrent: false,
    schoolId: "",
  });
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [academicYears, setAcademicYears] = useState<AcademicYearResponse[]>(
    []
  );
  const [terms, setTerms] = useState<TermResponse[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const getSchoolId = (): string => {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      return userData.schoolId._id;
    }
    return "";
  };

  // Validation helpers
  const validateAcademicYear = (data: AcademicYear): string | null => {
    if (!data.year.trim()) return "Academic year is required";
    if (!data.startDate) return "Start date is required";
    if (!data.endDate) return "End date is required";

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (startDate >= endDate) {
      return "End date must be after start date";
    }

    // Check if academic year already exists
    if (academicYears.some((year) => year.year === data.year.trim())) {
      return "Academic year already exists";
    }

    return null;
  };

  const validateTerm = (data: Term): string | null => {
    if (!data.name.trim()) return "Term name is required";
    if (!data.startDate) return "Start date is required";
    if (!data.endDate) return "End date is required";
    if (!selectedAcademicYear) return "Academic year is required";

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (startDate >= endDate) {
      return "End date must be after start date";
    }

    // Check if term name already exists for the selected academic year
    const selectedYear = academicYears.find(
      (year) => year.year === selectedAcademicYear
    );
    if (
      selectedYear &&
      terms.some(
        (term) =>
          term.name.toLowerCase() === data.name.trim().toLowerCase() &&
          term.academicYearId === selectedYear._id
      )
    ) {
      return "Term name already exists for this academic year";
    }

    return null;
  };

  useEffect(() => {
    fetchAcademicYears();
    fetchTerms();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        if (selectedTerm && !submitting && !loading) {
          handleSave();
        }
      }
      // Escape key to close modals
      if (event.key === "Escape") {
        if (isAcademicYearModalOpen) {
          setIsAcademicYearModalOpen(false);
        }
        if (isTermModalOpen) {
          setIsTermModalOpen(false);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedTerm,
    submitting,
    loading,
    isAcademicYearModalOpen,
    isTermModalOpen,
  ]);

  const fetchAcademicYears = async () => {
    try {
      const response = await getAcademicYears();
      console.log("academicYears", response);
      setAcademicYears(response || []);
    } catch (error) {
      console.error("Error fetching academic years:", error);
      toast.error("Failed to fetch academic years");
      setAcademicYears([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTerms = async () => {
    try {
      const response = await getTerms();
      console.log("terms", response);
      setTerms(response || []);
    } catch (error) {
      console.error("Error fetching terms:", error);
      toast.error("Failed to fetch terms");
      setTerms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcademicYearSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const loadingToast = toast.loading("Creating academic year...");

    try {
      // Validate form data
      const validationError = validateAcademicYear(academicYearForm);
      if (validationError) {
        toast.error(validationError, { id: loadingToast });
        return;
      }

      const academicYearData = {
        year: academicYearForm.year.trim(),
        startDate: formatDate(academicYearForm.startDate),
        endDate: formatDate(academicYearForm.endDate),
        isCurrent: academicYearForm.isCurrent,
        schoolId: getSchoolId(),
      };

      await createAcademicYear(academicYearData);

      setAcademicYearForm({
        year: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
        schoolId: "",
      });
      setIsAcademicYearModalOpen(false);
      fetchAcademicYears();
      toast.success("Academic year created successfully!", {
        id: loadingToast,
      });
    } catch (error) {
      console.error("Error creating academic year:", error);
      toast.error("Failed to create academic year. Please try again.", {
        id: loadingToast,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTermSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const loadingToast = toast.loading("Creating term...");

    try {
      // Validate form data
      const validationError = validateTerm(termForm);
      if (validationError) {
        toast.error(validationError, { id: loadingToast });
        return;
      }

      // Find the academic year object to get the ID
      const selectedAcademicYearObj = academicYears.find(
        (year) => year.year === selectedAcademicYear
      );

      if (!selectedAcademicYearObj?._id) {
        toast.error("Selected academic year not found", { id: loadingToast });
        return;
      }

      const termData = {
        name: termForm.name.trim(),
        startDate: termForm.startDate,
        endDate: termForm.endDate,
        academicYearId: selectedAcademicYearObj._id,
        isCurrent: termForm.isCurrent,
      };

      await createTerm(termData);

      setTermForm({
        name: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
        academicYearId: "",
        schoolId: "",
      });
      setSelectedAcademicYear("");
      setIsTermModalOpen(false);
      fetchTerms();
      toast.success("Term created successfully!", { id: loadingToast });
    } catch (error) {
      console.error("Error creating term:", error);
      toast.error("Failed to create term. Please try again.", {
        id: loadingToast,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = async () => {
    setSubmitting(true);
    const loadingToast = toast.loading("Updating current term...");

    try {
      if (!selectedTerm) {
        toast.error("Please select a term to set as current", {
          id: loadingToast,
        });
        return;
      }

      await setCurrentTerm(selectedTerm);
      toast.success("Current term updated successfully!", { id: loadingToast });
      fetchTerms();
      // Also refresh academic years in case the current one changed
      fetchAcademicYears();
    } catch (error) {
      console.error("Error setting current term:", error);
      toast.error("Failed to update current term. Please try again.", {
        id: loadingToast,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Get current academic year and term
  const currentAcademicYear = academicYears.find((y) => y.isCurrent);
  const currentTerm = terms.find((t) => t.isCurrent);

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />

      {/* Simple Header */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-10 pt-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-semibold text-[#2F2F2F]">
                  Academic Settings
                </h1>
                <button
                  onClick={() => setIsAcademicYearModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-gray-200 border border-[#E4E4E4] px-2 py-0.5 rounded-full text-base transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
              <p className="text-base text-[#979797]">
                Manage academic year and term settings across the platform
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Main Settings Card */}
        <div className="bg-gray-50 rounded  overflow-hidden">
          <div className="p-4">
            {/* Top Section - Two Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Academic Year Selection */}
              <div>
                <label className="block text-lg font-medium text-[#676767] mb-2">
                  Academic Year
                </label>
                <div className="relative">
                  <select
                    value={
                      selectedAcademicYear ||
                      currentAcademicYear?.year ||
                      academicYears[0]?.year ||
                      ""
                    }
                    onChange={(e) => setSelectedAcademicYear(e.target.value)}
                    disabled={loading}
                    className="w-full appearance-none bg-white border border-gray-300 rounded px-3 py-2 pr-8 focus:border-gray-400 focus:outline-none transition-all text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {academicYears.length === 0 ? (
                      <option value="">No academic years available</option>
                    ) : (
                      academicYears.map((year) => (
                        <option key={year._id} value={year.year}>
                          {year.year} {year.isCurrent ? "(Current)" : ""}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <p className="text-xs text-[#727272] mt-1.5">
                  Changes will affect all sections including dashboard, reports,
                  and records
                </p>
              </div>

              {/* Term Selection */}
              <div>
                <label className="block text-lg font-medium text-[#676767] mb-2">
                  Select Term
                </label>
                <div className="relative">
                  <select
                    value={selectedTerm || currentTerm?._id || ""}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                    disabled={loading}
                    className="w-full appearance-none bg-white border border-gray-300 rounded px-3 py-2 pr-8 focus:border-gray-400 focus:outline-none transition-all text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {terms.length === 0 ? (
                      <option value="">No terms available</option>
                    ) : (
                      terms.map((term) => (
                        <option key={term._id} value={term._id}>
                          {term.name} {term.isCurrent ? "(Current)" : ""}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <p className="text-xs text-[#727272] mt-1.5">
                  Select term to view period-specific data and reports
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              {/* Current Academic Year Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-lg font-medium text-[#676767] mb-2">
                    Current Academic Year
                  </label>
                  <div className="relative">
                    <select
                      value={currentAcademicYear?.year || ""}
                      onChange={() => { }}
                      disabled={loading}
                      className="w-full appearance-none bg-white border border-gray-300 rounded px-3 py-2 pr-8 focus:border-gray-400 focus:outline-none transition-all text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {academicYears.length === 0 ? (
                        <option value="">No academic years available</option>
                      ) : (
                        academicYears.map((year) => (
                          <option key={year._id} value={year.year}>
                            {year.year}
                          </option>
                        ))
                      )}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Current Term Section */}
                <div>
                  <label className="block text-lg font-medium text-[#676767] mb-2">
                    Current Term
                  </label>
                  <div className="relative">
                    <select
                      value={currentTerm?._id || ""}
                      onChange={() => { }}
                      disabled={loading}
                      className="w-full appearance-none bg-white border border-gray-300 rounded px-3 py-2 pr-8 focus:border-gray-400 focus:outline-none transition-all text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {terms.length === 0 ? (
                        <option value="">No terms available</option>
                      ) : (
                        terms.map((term) => (
                          <option key={term._id} value={term._id}>
                            {term.name}
                          </option>
                        ))
                      )}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Current Selection Display */}
              <div className="bg-gray-50 rounded px-4 py-3 mb-4">
                <h3 className="text-lg font-semibold text-[#676767] mb-2">
                  Current Selection
                </h3>
                <div className="space-y-1 text-base text-black">
                  <p>
                    <span className="font-base text-black">Academic Year:</span>{" "}
                    {currentAcademicYear?.year || "—"}
                  </p>
                  <p>
                    <span className="font-base text-black">Term:</span>{" "}
                    {currentTerm?.name || "—"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={loading || !selectedTerm || submitting}
                  className="bg-[#003366] hover:bg-blue-950 text-white px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => {
                    setSelectedAcademicYear("");
                    setSelectedTerm("");
                  }}
                  disabled={loading || submitting}
                  className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Academic Year Modal */}
      <AnimatePresence>
        {isAcademicYearModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsAcademicYearModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Create Academic Year
                  </h2>
                  <button
                    onClick={() => setIsAcademicYearModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form
                onSubmit={handleAcademicYearSubmit}
                className="p-6 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={academicYearForm.year}
                    onChange={(e) =>
                      setAcademicYearForm({
                        ...academicYearForm,
                        year: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    placeholder="e.g., 2025-2026"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={academicYearForm.startDate}
                      onChange={(e) =>
                        setAcademicYearForm({
                          ...academicYearForm,
                          startDate: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={academicYearForm.endDate}
                      onChange={(e) =>
                        setAcademicYearForm({
                          ...academicYearForm,
                          endDate: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="currentYear"
                    checked={academicYearForm.isCurrent}
                    onChange={(e) =>
                      setAcademicYearForm({
                        ...academicYearForm,
                        isCurrent: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="currentYear"
                    className="text-sm font-medium text-gray-700"
                  >
                    Set as current academic year
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAcademicYearModalOpen(false)}
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Creating..." : "Create Year"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Term Modal */}
      <AnimatePresence>
        {isTermModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsTermModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Create Term
                  </h2>
                  <button
                    onClick={() => setIsTermModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleTermSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Term Name
                  </label>
                  <input
                    type="text"
                    value={termForm.name}
                    onChange={(e) =>
                      setTermForm({ ...termForm, name: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    placeholder="e.g., First Term"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={termForm.startDate}
                      onChange={(e) =>
                        setTermForm({ ...termForm, startDate: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={termForm.endDate}
                      onChange={(e) =>
                        setTermForm({ ...termForm, endDate: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Academic Year
                  </label>
                  <div className="relative">
                    <select
                      value={selectedAcademicYear}
                      onChange={(e) => setSelectedAcademicYear(e.target.value)}
                      className="w-full appearance-none px-4 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all pr-10"
                      required
                    >
                      <option value="">Select Academic Year</option>
                      {academicYears.map((year) => (
                        <option key={year._id} value={year.year}>
                          {year.year}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="currentTerm"
                    checked={termForm.isCurrent}
                    onChange={(e) =>
                      setTermForm({ ...termForm, isCurrent: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="currentTerm"
                    className="text-sm font-medium text-gray-700"
                  >
                    Set as current term
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsTermModalOpen(false)}
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5
                    bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Creating..." : "Create Term"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;