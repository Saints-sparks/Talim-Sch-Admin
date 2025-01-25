"use client";

import React from "react";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";

const Settings: React.FC = () => {
    const router = useRouter()

  const handleSave = () => {
   console.log("Settings saved")
  };

  return (
    <div className="p-6 bg-gray-100 h-screen">
    <Header />
    {/* Page Title */}
    <h1 className="text-2xl font-semibold mb-6">Academic Settings</h1>
    <p>Manage Academic year and term settings across the platform</p>
  
    {/* Card */}
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














