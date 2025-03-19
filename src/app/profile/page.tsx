'use client';

import Image from "next/legacy/image";
import Header from '@/components/Header';
import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

type Tab = 'personal' | 'academic' ;

export default function Profile() {
  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

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

  interface FormData {
    schoolName: string;
    schoolPrefix: string;
    street: string;
    city: string;
    state: string;
    country: string;
    logo: string;
  }
  

    const handleInputChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: value });
    };
  const [formData, setFormData] = useState<FormData>({
    schoolName: '',
    schoolPrefix: '',
    street: '',
    city: '',
    state: '',
    country: '',
    logo: "/img/teacher.jpg",
  });


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({
        ...formData,
        // logo: e.target.files[0],
      });
    }
  };

  return (
    <div className="p-6 space-y-1">
      <Header />

      {/* Main Content */}
      <div className="p-5">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow p-5">
          

          {/* Tabs */}
          <div className="flex space-x-4 border-b border-gray-200 mb-5 px-4 py-3 rounded-lg bg-white">
            <button
              className={`pb-2 px-4 ${
                activeTab === 'personal'
                  ? 'text-[#154473] border-b-2 border-[#154473] font-semibold'
                  : 'text-gray-500 hover:bg-gray-100'
              } rounded-md transition duration-300 hover:text-gray-800`}
              onClick={() => setActiveTab('personal')}
            >
              School information and Contact details
            </button>
            <button
              className={`pb-2 px-4 ${
                activeTab === 'academic'
                  ? 'text-[#154473] border-b-2 border-[#154473] font-semibold'
                  : 'text-gray-500  hover:bg-gray-100'
              } rounded-md transition duration-300 hover:text-gray-800`}
              onClick={() => setActiveTab('academic')}
            >
             Administrator details
            </button>
         
          </div>

          {/* Details Section */}
          <div className="grid md:grid-cols-1 gap-6 px-4">
            {activeTab === 'personal' && (

            <div>

                {/* Student Details - Right */}
            <div className="bg-gray-50 p-6  rounded-lg border border-gray-200 shadow hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-2xl font-semibold mb-6">School Information & Contact Details</h2>
              {/* <div className="flex items-center space-x-4 mb-6"> */}
                <div className="w-24 h-24 rounded-full border flex justify-center items-center overflow-hidden bg-gray-200">
                  {formData.logo ? (
                    <img
                      src={"/img/teacher.jpg"}
                      alt="School Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>Logo</span>
                  )}
                </div>
                <label className="cursor-pointer">
                  <span className="text-blue-500 underline">Upload Photo</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-medium">School Name</label>
                  <input
                    type="text"
                    name="schoolName"
                    value={formData.schoolName}
                    onChange={handleInputChange}
                    placeholder="Enter your school name"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-medium">School Prefix</label>
                  <input
                    type="text"
                    name="schoolPrefix"
                    value={formData.schoolPrefix}
                    onChange={handleInputChange}
                    placeholder="e.g SHS"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-medium">Street</label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    placeholder="Enter your school street name"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-medium">City</label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
                  >
                    <option value="">Choose your city</option>
                    <option value="City1">City1</option>
                    <option value="City2">City2</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-medium">State</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
                  >
                    <option value="">Choose your state</option>
                    <option value="State1">State1</option>
                    <option value="State2">State2</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-medium">Country</label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
                  >
                    <option value="">Choose your country</option>
                    <option value="Country1">Country1</option>
                    <option value="Country2">Country2</option>
                  </select>
                </div>
              {/* </div> */}
              </div>
            </div>
            )}

            {activeTab === 'academic' && (
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow hover:shadow-lg transition-shadow duration-300">

              {/* Academic Details - Right */}
            <div className="bg-gray-50 p-6  rounded-lg border border-gray-200 shadow hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-2xl font-semibold mb-6">Academic Details</h2>
              {/* <div className="flex items-center space-x-4 mb-6"> */}
                <div className="w-24 h-24 rounded-full border flex justify-center items-center overflow-hidden bg-gray-200">
                  {formData.logo ? (
                    <img
                      src={"/img/teacher.jpg"}
                      alt="School Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>Logo</span>
                  )}
                </div>
                <label className="cursor-pointer">
                  <span className="text-blue-500 underline">Upload Photo</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-medium">Admin Name</label>
                  <input
                    type="text"
                    name="schoolName"
                    value={formData.schoolName}
                    onChange={handleInputChange}
                    placeholder="Enter your school name"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-medium">Admin Email</label>
                  <input
                    type="email"
                    name="email"
                    // value={}
                    onChange={handleInputChange}
                    placeholder="example@example.com"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-medium">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    // value={}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
                  />
                </div>

                {/* Password Field */}
          <div className="mb-4 relative">
            <label
              htmlFor="password"
              className="block mb-1 font-medium"
            >
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={password}
              onChange={handlePasswordChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-3 flex items-center text-gray-600"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Confirm Password Field */}
          <div className="mb-4 relative">
            <label
              htmlFor="confirm-password"
              className="block mb-1 font-medium"
            >
              Confirm Password
            </label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirm-password"
              name="confirm-password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={toggleConfirmPasswordVisibility}
              className="absolute inset-y-0 right-3 flex items-center text-gray-600"
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          

              
              </div>
              {/* </div> */}
              </div>
            )}


          </div>
        </div>
      </div>
    </div>
  );
}
