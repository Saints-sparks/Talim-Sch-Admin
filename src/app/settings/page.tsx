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

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white border-b border-gray-200 shadow-sm"
      >
        <div className="container mx-auto p-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-xl shadow-lg">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Academic Settings
              </h1>
              <p className="text-gray-600 mt-1">
                Manage academic years and terms for your institution
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto p-6 space-y-8">
        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsAcademicYearModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            Create Academic Year
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsTermModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300"
          >
            <Calendar className="w-5 h-5" />
            Create Term
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              fetchAcademicYears();
              fetchTerms();
            }}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </motion.button>
        </motion.div>

        {/* Current Status Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Current Academic Year Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-blue-200 p-3 rounded-xl">
                <School className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900">
                  Current Academic Year
                </h3>
                <p className="text-blue-600 text-sm">Active academic session</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-900 mb-2">
              {academicYears.find((y) => y.isCurrent)?.year || "Not set"}
            </div>
            {!academicYears.find((y) => y.isCurrent) && (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">No current academic year set</span>
              </div>
            )}
          </motion.div>

          {/* Current Term Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-emerald-200 p-3 rounded-xl">
                <Clock className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-emerald-900">
                  Current Term
                </h3>
                <p className="text-emerald-600 text-sm">Active academic term</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-900 mb-2">
              {terms.find((t) => t.isCurrent)?.name || "Not set"}
            </div>
            {!terms.find((t) => t.isCurrent) && (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">No current term set</span>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Main Settings Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-gray-700" />
              <h2 className="text-xl font-bold text-gray-900">
                Academic Configuration
              </h2>
            </div>
            <p className="text-gray-600 mt-2">
              Set the current academic year and term for your institution
            </p>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Academic Year Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <School className="w-5 h-5 text-blue-700" />
                  </div>
                  <label className="text-lg font-semibold text-gray-900">
                    Select Academic Year
                  </label>
                </div>
                <div className="relative">
                  <select
                    value={selectedAcademicYear}
                    onChange={(e) => setSelectedAcademicYear(e.target.value)}
                    disabled={loading}
                    className="w-full appearance-none bg-white border-2 border-gray-200 rounded-xl px-4 py-4 pr-12 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-gray-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Choose Academic Year</option>
                    {academicYears.map((year) => (
                      <option
                        key={year._id}
                        value={year.year}
                        className={year.isCurrent ? "font-bold" : ""}
                      >
                        {year.year} {year.isCurrent ? "(Current)" : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                {academicYears.length === 0 && !loading && (
                  <div className="text-amber-600 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    No academic years available. Create one first.
                  </div>
                )}
              </div>

              {/* Term Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-emerald-100 p-2 rounded-lg">
                    <Calendar className="w-5 h-5 text-emerald-700" />
                  </div>
                  <label className="text-lg font-semibold text-gray-900">
                    Select Term
                  </label>
                </div>
                <div className="relative">
                  <select
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                    disabled={loading}
                    className="w-full appearance-none bg-white border-2 border-gray-200 rounded-xl px-4 py-4 pr-12 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 text-gray-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Choose Term</option>
                    {terms.map((term) => (
                      <option
                        key={term._id}
                        value={term._id}
                        className={term.isCurrent ? "font-bold" : ""}
                      >
                        {term.name} {term.isCurrent ? "(Current)" : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                {terms.length === 0 && !loading && (
                  <div className="text-amber-600 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    No terms available. Create one first.
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-gray-200">
              <motion.button
                whileHover={!submitting && !loading ? { scale: 1.02 } : {}}
                whileTap={!submitting && !loading ? { scale: 0.98 } : {}}
                onClick={handleSave}
                disabled={loading || !selectedTerm || submitting}
                title="Save changes (Ctrl/Cmd + S)"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-[140px] justify-center"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </motion.button>
              <motion.button
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                onClick={() => {
                  setSelectedAcademicYear("");
                  setSelectedTerm("");
                }}
                disabled={loading || submitting}
                className="flex items-center gap-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
                Reset
              </motion.button>

              {/* Helper text for keyboard shortcut */}
              {selectedTerm && !loading && !submitting && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center text-sm text-gray-500 ml-4"
                >
                  <kbd className="px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs font-mono">
                    Ctrl + S
                  </kbd>
                  <span className="ml-2">to save quickly</span>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Academic Years and Terms Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Academic Years List */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                <School className="w-5 h-5" />
                Academic Years ({academicYears.length})
              </h3>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse bg-gray-200 h-16 rounded-lg"
                    ></div>
                  ))}
                </div>
              ) : academicYears.length > 0 ? (
                <div className="space-y-3">
                  {academicYears.map((year) => (
                    <motion.div
                      key={year._id}
                      whileHover={{ scale: 1.02 }}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                        year.isCurrent
                          ? "border-blue-200 bg-blue-50"
                          : "border-gray-200 bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {year.year}
                          </div>
                          <div className="text-sm text-gray-600">
                            {new Date(year.startDate).toLocaleDateString()} -{" "}
                            {new Date(year.endDate).toLocaleDateString()}
                          </div>
                        </div>
                        {year.isCurrent && (
                          <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            Current
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <School className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No academic years created yet</p>
                  <button
                    onClick={() => setIsAcademicYearModalOpen(true)}
                    className="mt-3 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Create your first academic year
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Terms List */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Terms ({terms.length})
              </h3>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse bg-gray-200 h-16 rounded-lg"
                    ></div>
                  ))}
                </div>
              ) : terms.length > 0 ? (
                <div className="space-y-3">
                  {terms.map((term) => (
                    <motion.div
                      key={term._id}
                      whileHover={{ scale: 1.02 }}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                        term.isCurrent
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-gray-200 bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {term.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {new Date(term.startDate).toLocaleDateString()} -{" "}
                            {new Date(term.endDate).toLocaleDateString()}
                          </div>
                        </div>
                        {term.isCurrent && (
                          <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            Current
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No terms created yet</p>
                  <button
                    onClick={() => setIsTermModalOpen(true)}
                    className="mt-3 text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Create your first term
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <School className="w-6 h-6" />
                    Create Academic Year
                  </h2>
                  <button
                    onClick={() => setIsAcademicYearModalOpen(false)}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form
                onSubmit={handleAcademicYearSubmit}
                className="p-6 space-y-4"
              >
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                    placeholder="e.g., 2025-2026"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
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
                    className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="currentYear"
                    className="text-sm font-medium text-blue-900"
                  >
                    Set as current academic year
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAcademicYearModalOpen(false)}
                    disabled={submitting}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating...
                      </>
                    ) : (
                      "Create Year"
                    )}
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Calendar className="w-6 h-6" />
                    Create Term
                  </h2>
                  <button
                    onClick={() => setIsTermModalOpen(false)}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleTermSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Term Name
                  </label>
                  <input
                    type="text"
                    value={termForm.name}
                    onChange={(e) =>
                      setTermForm({ ...termForm, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300"
                    placeholder="e.g., First Term"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={termForm.startDate}
                      onChange={(e) =>
                        setTermForm({ ...termForm, startDate: e.target.value })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={termForm.endDate}
                      onChange={(e) =>
                        setTermForm({ ...termForm, endDate: e.target.value })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Academic Year
                  </label>
                  <div className="relative">
                    <select
                      value={selectedAcademicYear}
                      onChange={(e) => setSelectedAcademicYear(e.target.value)}
                      className="w-full appearance-none px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 pr-12"
                      required
                    >
                      <option value="">Select Academic Year</option>
                      {academicYears.map((year) => (
                        <option key={year._id} value={year.year}>
                          {year.year}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl">
                  <input
                    type="checkbox"
                    id="currentTerm"
                    checked={termForm.isCurrent}
                    onChange={(e) =>
                      setTermForm({ ...termForm, isCurrent: e.target.checked })
                    }
                    className="w-5 h-5 text-emerald-600 border-2 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <label
                    htmlFor="currentTerm"
                    className="text-sm font-medium text-emerald-900"
                  >
                    Set as current term
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsTermModalOpen(false)}
                    disabled={submitting}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating...
                      </>
                    ) : (
                      "Create Term"
                    )}
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
