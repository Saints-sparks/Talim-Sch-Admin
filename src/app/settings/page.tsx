"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";
import { createAcademicYear, createTerm, getAcademicYears } from "@/app/services/academic.service";
import { toast } from "react-toastify";
import { getLocalStorageItem, User } from "../lib/localStorage";
import { getSchoolId } from "../services/school.service";

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

const Settings: React.FC = () => {
  const [isAcademicYearModalOpen, setIsAcademicYearModalOpen] = useState(false);
  const [isTermModalOpen, setIsTermModalOpen] = useState(false);
  const [academicYearForm, setAcademicYearForm] = useState({
    year: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
  });
  const [termForm, setTermForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    academicYearId: ""
  });
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  const fetchAcademicYears = async () => {
    try {
      const response = await getAcademicYears();
      setAcademicYears(response.data);
    } catch (error) {
      toast.error("Failed to fetch academic years");
    }
  };

  const handleAcademicYearSubmit = async (e: React.FormEvent) => {
    console.log("academicYearForm", academicYearForm);
    e.preventDefault();
    try {
      // const userData = getLocalStorageItem('user') as User | null;
      // if (!userData?.schoolId) {
      //   throw new Error('School ID not found');
      // }

      // const schoolId = userData.schoolId._id.toString();

      const academicYearData = {
        ...academicYearForm,
      //  schoolId: ""
      };
      console.log("academicYearData", academicYearData);

      await createAcademicYear({
        ...academicYearData,
      });
      toast.success("Academic year created successfully");
      setAcademicYearForm({
        year: "",
        startDate: "",
        endDate: "",
        isCurrent: false
      });
      setIsAcademicYearModalOpen(false);
      fetchAcademicYears();
    } catch (error) {
      toast.error("Failed to create academic year. Please try again.");
      console.error(error);
    }
  };

  const handleTermSubmit = async (e: React.FormEvent) => {
    console.log("termForm", termForm);
    e.preventDefault();
    try {
      if (!selectedAcademicYear) {
        toast.error("Please select an academic year");
        return;
      }

      // const userData = getLocalStorageItem('user') as User | null;
      // if (!userData?.schoolId) {
      //   throw new Error('School ID not found');
      // }

      // const schoolId = userData.schoolId._id.toString();

      const termData = {
        ...termForm,
        academicYearId: selectedAcademicYear
      };

      await createTerm({
        ...termData,
      });
      toast.success("Term created successfully");
      setTermForm({
        name: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
        academicYearId: ""
      });
      setSelectedAcademicYear("");
      setIsTermModalOpen(false);
    } catch (error) {
      toast.error("Failed to create term. Please try again.");
      console.error(error);
    }
  };

  return (
    <div className="p-6 bg-gray-100 h-screen">
      <Header />
      
      {/* Page Title */}
      <h1 className="text-2xl font-semibold mb-6">Academic Settings</h1>
      <p>Manage Academic year and term settings across the platform</p>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Academic Settings</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setIsAcademicYearModalOpen(true)}
            className="px-4 py-2 bg-[#154473] text-white rounded-md hover:bg-blue-700 transition"
          >
            Create Academic Year
          </button>
          <button
            onClick={() => setIsTermModalOpen(true)}
            className="px-4 py-2 bg-[#154473] text-white rounded-md hover:bg-blue-700 transition"
          >
            Create Term
          </button>
        </div>
      </div>

      {/* Academic Year Modal */}
      {isAcademicYearModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-semibold mb-4">Create Academic Year</h2>
            <form onSubmit={handleAcademicYearSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input
                  type="text"
                  value={academicYearForm.year}
                  onChange={(e) => setAcademicYearForm({ ...academicYearForm, year: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., 2025-2026"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={academicYearForm.startDate}
                  onChange={(e) => setAcademicYearForm({ ...academicYearForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={academicYearForm.endDate}
                  onChange={(e) => setAcademicYearForm({ ...academicYearForm, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Academic Year
                </label>
                <input
                  type="checkbox"
                  checked={academicYearForm.isCurrent}
                  onChange={(e) => setAcademicYearForm({ ...academicYearForm, isCurrent: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAcademicYearModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#154473] text-white rounded-md hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Term Modal */}
      {isTermModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-semibold mb-4">Create Term</h2>
            <form onSubmit={handleTermSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={termForm.name}
                  onChange={(e) => setTermForm({ ...termForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., First Term"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={termForm.startDate}
                  onChange={(e) => setTermForm({ ...termForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={termForm.endDate}
                  onChange={(e) => setTermForm({ ...termForm, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                <select
                  value={selectedAcademicYear}
                  onChange={(e) => setSelectedAcademicYear(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select Academic Year</option>
                  {academicYears.map((year) => (
                    <option key={year.year} value={year.year}>
                      {year.year}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Term
                </label>
                <input
                  type="checkbox"
                  checked={termForm.isCurrent}
                  onChange={(e) => setTermForm({ ...termForm, isCurrent: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTermModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#154473] text-white rounded-md hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rest of the existing content */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <form>
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Academic Year */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Academic Year</label>
              <select
                name="year"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
              >
                <option>Select Academic Year</option>
                <option value="2024/2025">2024/2025 (Current)</option>
                <option value="2025/2026">2025/2026</option>
                <option value="2026/2027">2026/2027</option>
              </select>
            </div>

            {/* Select Term */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Select Term</label>
              <select
                name="term"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
              >
                <option>Select Term</option>
                <option value="1st Term">1st Term (Current)</option>
                <option value="2nd Term">2nd Term</option>
                <option value="3rd Term">3rd Term</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Current Academic Year */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Current Academic Year</label>
              <select
                name="year"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
              >
                <option>Select Current Academic Year</option>
                <option value="2024/2025">2024/2025 (Current)</option>
                <option value="2025/2026">2025/2026</option>
                <option value="2026/2027">2026/2027</option>
              </select>
            </div>

            {/* Current Select Term */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Current Select Term</label>
              <select
                name="term"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
              >
                <option>Select Current Term</option>
                <option value="1st Term">1st Term (Current)</option>
                <option value="2nd Term">2nd Term</option>
                <option value="3rd Term">3rd Term</option>
              </select>
            </div>
          </div>

          {/* Current Selection */}
          <div className="mb-6 py-5">
            <p className="text-gray-700 font-medium">
              Current Academic Year: <span className="font-semibold py-5">2023/2024</span>
            </p>
            <p className="text-gray-700 font-medium py-5">
              Current Term: <span className="font-semibold">1st Term</span>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 py-5">
            <button
              type="button"
              className="px-6 py-4 bg-[#154473] text-white font-semibold rounded-lg hover:bg-blue-600"
            >
              Save Changes
            </button>
            <button
              type="button"
              className="px-6 py-4 bg-gray-500 text-gray-700 font-semibold rounded-lg hover:bg-red-600 text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
