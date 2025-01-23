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
    <div className="p-6 bg-gray-100 h-full">
        <Header/>
      {/* Page Title */}
      <h1 className="text-2xl font-semibold mb-6">Academic Settings</h1>
      <p>Manage Academic year and term settings across the platform</p>

      {/* Card */}
      <div className="bg-white shadow-md rounded-lg p-6 flex">
        <form>
        <div className="mb-4 flex gap-4">

            <div className="flex-1">
            <label className="block text-gray-700 font-medium mb-2">
            Academic Year
            </label>
            <select
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
            <option value="" disabled selected>
                Select a academic year
            </option>
            <option value="2024/2025">2024/2025(Current)</option>
            <option value="2025/2026">2025/2026</option>
            <option value="2026/2027">2026/2027</option>
            </select>
            </div>



            <div className="flex-1">
            <label className="block text-gray-700 font-medium mb-2">
            Select Term
            </label>
            <select
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
            <option value="" disabled selected>
                Select a term 
            </option>
            <option value="1st-term">1st-term</option>
            <option value="2nd-term">2nd-term</option>
            <option value="3rd-term">3rd-term</option>
            </select>
            </div>



            
            <div className="flex-1">
            <label className="block text-gray-700 font-medium mb-2">
            Academic Year
            </label>
            <select
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
            <option value="" disabled selected>
                Select a academic year
            </option>
            <option value="2024/2025">2024/2025(Current)</option>
            <option value="2025/2026">2025/2026</option>
            <option value="2026/2027">2026/2027</option>
            </select>
            </div>



            <div className="flex-1">
            <label className="block text-gray-700 font-medium mb-2">
            Select Term
            </label>
            <select
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
            <option value="" disabled selected>
                Select a term 
            </option>
            <option value="1st-term">1st-term</option>
            <option value="2nd-term">2nd-term</option>
            <option value="3rd-term">3rd-term</option>
            </select>
            </div>



        </div>
          {/* Add New Course Button */}
          <div className="mb-6">
            <button
              type="button"
              className="px-6 py-3 bg-[#154473] text-white rounded-lg hover:bg-gray-300"
            >
             Save
            </button>
          </div>

          {/* Buttons */}
          <div className="flex justify-between items-center mt-6">
            <button
              type="button"
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
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














