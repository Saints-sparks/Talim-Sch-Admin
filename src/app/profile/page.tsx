"use client";

import { useState } from "react";

import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";


type Tab = "school" | "admin";

export default function Profile() {
  const [activeTab, setActiveTab] = useState<Tab>("school");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);

  interface FormData {
    schoolName: string;
    schoolPrefix: string;
    street: string;
    city: string;
    state: string;
    country: string;
    logo: string | null;
    adminName: string;
    adminEmail: string;
    adminPhone: string;
  }

  const [formData, setFormData] = useState<FormData>({
    schoolName: "",
    schoolPrefix: "",
    street: "",
    city: "",
    state: "",
    country: "",
    logo: null,
    adminName: "",
    adminEmail: "",
    adminPhone: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setConfirmPassword(e.target.value);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) {
          setFormData({
            ...formData,
            logo: event.target.result as string,
          });
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleUpdate = () => {
    console.log("Form data:", formData);
    // Add API call to update profile
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1">
        <div className="p-4 ">
          

          {/* Tabs */}
          <div className="border-b border-gray-200 mt-10">
            <div className="flex space-x-8">
              <button
                className={`py-4 px-1 ${
                  activeTab === "school"
                    ? "text-blue-900 border-b-2 border-blue-900 font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("school")}
              >
                School Information & Contact Details
              </button>
              <button
                className={`py-4 px-1 ${
                  activeTab === "admin"
                    ? "text-blue-900 border-b-2 border-blue-900 font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("admin")}
              >
                Administrator Details
              </button>
            </div>
          </div>

          {/* School Information Tab */}
          {activeTab === "school" && (
            <div className="py-6">
              <h2 className="text-xl font-medium text-gray-900 mb-6">
                School Information & Contact Details
              </h2>

              <div className="grid grid-cols-3 gap-4">
                {/* Logo Section */}
                <div className="flex gap-3 ml-6 ">
                  
                  <div className="w-[150px] h-[150px] rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                    {formData.logo ? (
                      <img
                        src={formData.logo || "/placeholder.svg"}
                        alt="School Logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400">School Logo</div>
                    )}
                  </div>
                  <label className="cursor-pointer flex flex-col gap-1 mt-8">
                    <span className="text-[#000000] font-medium">
                      School Logo
                    </span>
                    <span className="text-[#003366] font-medium px-2 py-1 bg-[#F3F3F3] border-[#003366] border-2 rounded-[10px]">
                      Upload Photo
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept="image/*"
                    />
                  </label>
                </div>

                {/* Form Fields */}
                <div className="col-span-2 grid grid-cols-2 gap-6 max-w-[45vw] ml-[-100px] mt-[20px]">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      School Name
                    </label>
                    <input
                      type="text"
                      name="schoolName"
                      value={formData.schoolName}
                      onChange={handleInputChange}
                      placeholder="Enter your school name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      School Prefix
                    </label>
                    <input
                      type="text"
                      name="schoolPrefix"
                      value={formData.schoolPrefix}
                      onChange={handleInputChange}
                      placeholder="e.g SHS"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street
                    </label>
                    <input
                      type="text"
                      name="street"
                      value={formData.street}
                      onChange={handleInputChange}
                      placeholder="Enter your school street name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <div className="relative">
                      <select
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                      >
                        <option value="">Choose your city</option>
                        <option value="City1">City1</option>
                        <option value="City2">City2</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <div className="relative">
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                      >
                        <option value="">Choose your state</option>
                        <option value="State1">State1</option>
                        <option value="State2">State2</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <div className="relative">
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                      >
                        <option value="">Choose your country</option>
                        <option value="Country1">Country1</option>
                        <option value="Country2">Country2</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex space-x-4">
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors"
                >
                  Update
                </button>
                <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Administrator Details Tab */}
          {activeTab === "admin" && (
            <div className="py-6">
              <h2 className="text-xl font-medium text-gray-900 mb-6">Administrator Details</h2>
              <div className="flex  ml-6 gap-10 ">
                <div className="flex gap-2">
                  <div className="w-[150px] h-[150px] rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                    {formData.logo ? (
                      <img
                        src={formData.logo || "/placeholder.svg"}
                        alt="School Logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400">School Logo</div>
                    )}
                  </div>
                  <label className="cursor-pointer flex flex-col gap-1 mt-8">
                    <span className="text-[#000000] font-medium">School Logo</span>
                    <span className="text-[#003366] font-medium px-2 py-1 bg-[#F3F3F3] border-[#003366] border-2 rounded-[10px]">
                      Upload Photo
                    </span>
                    <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                  </label>
                </div>

                <div className="col-span-2 grid grid-cols-2 gap-6 w-[50vw]  mt-[20px]">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin Name</label>
                    <input
                      type="text"
                      name="adminName"
                      value={formData.adminName}
                      onChange={handleInputChange}
                      placeholder="Enter admin name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
                    <input
                      type="email"
                      name="adminEmail"
                      value={formData.adminEmail}
                      onChange={handleInputChange}
                      placeholder="example@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      name="adminPhone"
                      value={formData.adminPhone}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Password Field */}
                  <div className="relative">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={password}
                        onChange={handlePasswordChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                      >
                        {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  <div className="relative">
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirm-password"
                        name="confirm-password"
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={toggleConfirmPasswordVisibility}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                      >
                        {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex space-x-4">
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors"
                >
                  Update
                </button>
                <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
