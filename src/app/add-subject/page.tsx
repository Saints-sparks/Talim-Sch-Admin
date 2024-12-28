'use client';

import { useState } from "react";
import { HiPencil, HiTrash } from "react-icons/hi";
import Header from "@/components/Header";

export default function AddSubject() {
  const [formData, setFormData] = useState({
    subjectName: "",
    subjectCode: "",
    teacherName: "",
    creditHours: "",
    department: "",
    description: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitted Data:", formData);
    // Add your submission logic here
  };

  const handleReset = () => {
    setFormData({
      subjectName: "",
      subjectCode: "",
      teacherName: "",
      creditHours: "",
      department: "",
      description: "",
    });
  };

  return (
    <div className="p-6 space-y-1">
      {/* Header */}
      <Header user={"Administrator"} tent={"Add Subject"} />

      {/* Main Content */}
      <main className="flex-1">
        <h1 className="text-2xl p-5">Add Subject</h1>

        <section className="bg-white p-10 rounded-lg shadow-md">
          {/* Form */}
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
            <input
              type="text"
              name="subjectName"
              placeholder="Subject Name"
              value={formData.subjectName}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 rounded-md"
            />
            <input
              type="text"
              name="subjectCode"
              placeholder="Subject Code"
              value={formData.subjectCode}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 rounded-md"
            />
            <input
              type="text"
              name="teacherName"
              placeholder="Teacher's Name"
              value={formData.teacherName}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 rounded-md"
            />
            <input
              type="text"
              name="creditHours"
              placeholder="Credit Hours"
              value={formData.creditHours}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 rounded-md"
            />
            <input
              type="text"
              name="department"
              placeholder="Department"
              value={formData.department}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 rounded-md"
            />
            <textarea
              name="description"
              placeholder="Subject Description"
              value={formData.description}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 rounded-md col-span-2 resize-none"
              rows={4}
            />
            <div className="col-span-2 flex justify-center gap-4 mt-6">
              <button
                type="submit"
                className="bg-[#154473] text-white px-6 py-2 rounded-md"
              >
                Submit
              </button>
              <button
                type="button"
                className="border border-red-500 text-red-500 px-6 py-2 rounded-md"
                onClick={handleReset}
              >
                Reset
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
