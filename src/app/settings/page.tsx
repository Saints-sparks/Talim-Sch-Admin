"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";
import { AcademicYearResponse, TermResponse, createAcademicYear, createTerm, getAcademicYears, getTerms } from "@/app/services/academic.service";
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
  const [academicYearForm, setAcademicYearForm] = useState<AcademicYear>({
    year: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    schoolId: ""
  });
  const [termForm, setTermForm] = useState<Term>({
    name: "",
    startDate: "",
    endDate: "",
    academicYearId: "",
    isCurrent: false,
    schoolId: ""
  });
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [academicYears, setAcademicYears] = useState<AcademicYearResponse[]>([]);
  const [terms, setTerms] = useState<TermResponse[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchAcademicYears();
    fetchTerms();
  }, []);

  const fetchAcademicYears = async () => {
    try {
      const response = await getAcademicYears();
      console.log("academicYears", response);
      setAcademicYears(response || []);
    } catch (error) {
      console.error('Error fetching academic years:', error);
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
      console.error('Error fetching terms:', error);
      toast.error("Failed to fetch terms");
      setTerms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcademicYearSubmit = async (e: React.FormEvent) => {
    console.log("academicYearForm", academicYearForm);
    e.preventDefault();
    try {
      const academicYearData = {
        ...academicYearForm,
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
        isCurrent: false,
        schoolId: ""
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
        academicYearId: "",
        schoolId: ""
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

      {/* Academic Year and Term Selection */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Academic Year */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Academic Year</label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
              disabled={loading}
            >
              <option value="">Select Academic Year</option>
              {academicYears.map((year) => (
                <option
                  key={year.id}
                  value={year.id}
                  className={year.isCurrent ? 'font-bold' : ''}
                >
                  {year.year} {year.isCurrent ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Term */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Term</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
              disabled={loading}
            >
              <option value="">Select Term</option>
              {terms.map((term) => (
                <option
                  key={term.id}
                  value={term.id}
                  className={term.isCurrent ? 'font-bold' : ''}
                >
                  {term.name} {term.isCurrent ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Current Selection */}
        <div className="mb-6 py-5">
          <p className="text-gray-700 font-medium">
            Current Academic Year: <span className="font-semibold">{academicYears.find(y => y.isCurrent)?.year || 'Not set'}</span>
          </p>
          <p className="text-gray-700 font-medium py-5">
            Current Term: <span className="font-semibold">{terms.find(t => t.isCurrent)?.name || 'Not set'}</span>
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 py-5">
          <button
            type="button"
            className="px-6 py-4 bg-[#154473] text-white font-semibold rounded-lg hover:bg-blue-600"
            disabled={loading}
          >
            Save Changes
          </button>
          <button
            type="button"
            className="px-6 py-4 bg-gray-500 text-gray-700 font-semibold rounded-lg hover:bg-red-600 text-white"
            disabled={loading}
          >
            Cancel
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
                    <option key={year.id} value={year.id}>
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
    </div>
  );
};

export default Settings;
