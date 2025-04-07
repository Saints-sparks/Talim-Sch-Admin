'use client'

import { useState } from "react";
import { HiUserCircle, HiHome, HiPencil, HiTrash } from "react-icons/hi";
import Header from "@/components/Header";

export default function AddStudent() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    admissionDate: "",
    institutionId: "",
    gradeClass: "",
    nationalId: "",
    dateOfBirth: "",
    gender: "",
    city: "",
    parentsName: "",
    homeAddress: "",
  });

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleDeletePhoto = () => {
    setPhoto(null);
    setPhotoPreview("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitted Data:", formData);
    console.log("Uploaded Photo:", photo);
    // Add your submission logic here
  };

  return (
    <div className="p-6 space-y-1 bg-[F8F8F8]">
        
     <Header user="Administrator" title="Add Student" />

      {/* Main Content */}
      <main className="flex-1">
      <h1 className="text-2xl p-5"> Add Student</h1>

        <section className="bg-white p-10 rounded-lg shadow-md">
          {/* Photo Upload */}
          <div className="flex flex-col items-center mb-10 relative">
            {photoPreview ? (
              <div className="relative">
                <img
                src={photoPreview || '/img/profile.jpg'} // Use `photoPreview` if available, otherwise fallback
                alt="Student Photo"
                className="w-32 h-32 object-cover rounded-full mb-4"
                />
                <div className="absolute top-0 right-0 flex gap-2">
                  <button
                    onClick={() => document.getElementById("photoInput")?.click()}
                    className="bg-gray-100 p-2 rounded-full hover:bg-gray-200"
                  >
                    <HiPencil className="text-gray-600" />
                  </button>
                  <button
                    onClick={handleDeletePhoto}
                    className="bg-gray-100 p-2 rounded-full hover:bg-gray-200"
                  >
                    <HiTrash className="text-red-600" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-500">No Photo</span>
              </div>
            )}
            <input
              type="file"
              id="photoInput"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => document.getElementById("photoInput")?.click()}
              className="mt-4 bg-[#154473] text-white px-4 py-2 rounded-md"
            >
              {photo ? "Change Photo" : "Upload Photo"}
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 rounded-md"
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 rounded-md"
            />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 rounded-md"
            />
            <input
              type="date"
              name="admissionDate"
              placeholder="Date of Admission"
              value={formData.admissionDate}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 rounded-md"
            />
            <input
              type="text"
              name="institutionId"
              placeholder="Institution Admission Number"
              value={formData.institutionId}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 rounded-md"
            />
            <input
              type="text"
              name="gradeClass"
              placeholder="Grade/Class"
              value={formData.gradeClass}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 rounded-md"
            />
            <input
              type="text"
              name="nationalId"
              placeholder="National Identification Number"
              value={formData.nationalId}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 rounded-md"
            />
            <input
              type="date"
              name="dateOfBirth"
              placeholder="Date of Birth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 rounded-md"
            />
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 rounded-md"
            >
              <option value="">Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <input
              type="text"
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 rounded-md"
            />
            <input
              type="text"
              name="parentsName"
              placeholder="Parent's Name"
              value={formData.parentsName}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 rounded-md"
            />
            <input
              type="text"
              name="homeAddress"
              placeholder="Home Address"
              value={formData.homeAddress}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 rounded-md"
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
                onClick={() => {
                  setFormData({
                    firstName: "",
                    lastName: "",
                    email: "",
                    admissionDate: "",
                    institutionId: "",
                    gradeClass: "",
                    nationalId: "",
                    dateOfBirth: "",
                    gender: "",
                    city: "",
                    parentsName: "",
                    homeAddress: "",
                  });
                  setPhoto(null);
                  setPhotoPreview("");
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
