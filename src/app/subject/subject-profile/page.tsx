'use client'

import { NextPage } from "next";
import React, { useState } from "react";
import Header from "@/components/Header";

const SubjectProfile: NextPage = () => {
  const [subjectName, setSubjectName] = useState<string>("");
  const [courseName, setCourseName] = useState<string>("");
  const [teacher, setTeacher] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log({
      subjectName,
      courseName,
      teacher,
      description,
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">   

      {/* Page Content */}
      <main className="flex-grow p-6">
        
      {/* Page Header */}
      <Header user="Administrator" title="Subject Profile" />
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4"> Subject Profile</h2>

          <form onSubmit={handleSubmit}>
            {/* Subject Name */}
            <div className="mb-4 flex gap-4">
              <div className="flex-1">
                <label className="block text-gray-700 font-semibold mb-2">
                  Subject Name
                </label>
                <input
                  type="text"
                  placeholder="Enter subject name"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Course Name */}
              <div className="flex-1">
                <label className="block text-gray-700 font-semibold mb-2">
                  Course Name
                </label>
                <input
                  type="text"
                  placeholder="e.g: MAT112"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Assign Teacher */}
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Assign Teacher
              </label>
              <select
                value={teacher}
                onChange={(e) => setTeacher(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>
                  Select a teacher
                </option>
                <option value="teacher-1">Mr. John Adewale</option>
                <option value="teacher-2">Ms. Sarah Akinola</option>
                <option value="teacher-3">Dr. Peter Okonkwo</option>
              </select>
            </div>

            {/* Subject Description */}
            <div className="mb-4 relative">
              <label className="block text-gray-700 font-semibold mb-2">
                Subject Description (Optional)
              </label>
              <textarea
                placeholder="Provide additional notes about the class."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              ></textarea>
            </div>


            <div className="flex-1">
            <label className="block text-gray-700 font-semibold mb-2">
              Class 
            </label>
            <input
              type="text"
              placeholder="Enter class name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

            {/* Buttons */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => console.log("Cancel clicked")}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Delete
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-[#154473] text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </main>

    </div>
  );
};

export default SubjectProfile;
