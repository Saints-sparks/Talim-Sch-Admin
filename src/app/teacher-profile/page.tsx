'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePageIndicator } from '../context/PageIndicatorContext';
import Header from '@/components/Header';
import {useRouter, usePathname} from 'next/navigation'
import {useNavigationHelpers} from '../../utils/useNavigationHelpers'

interface FormData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  emailAddress: string;
  // dateOfBirth: Date;
  country: string;
  logo: File | null;
}

export default function Step1() {
  const { currentPage, setCurrentPage } = usePageIndicator();
  const router = useRouter()
  const pathname = usePathname()

  const {goBack} = useNavigationHelpers();

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    emailAddress: '',
    // dateOfBirth: Date.toString(),
    country: '',
    logo: null,
  });


 

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({
        ...formData,
        logo: e.target.files[0],
      });
    }
  };



  return (
    <div className="flex bg-gray-100">
     


      <div className="bg-gray-100 p-8 rounded shadow-md w-full h-auto min-h-[90vh]">
      <Header/>
        <h2 className="text-2xl font-semibold mb-6">Personal Details</h2>
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-24 h-24 rounded-full border flex justify-center items-center overflow-hidden bg-gray-200">
            {formData.logo ? (
              <img
                src={URL.createObjectURL(formData.logo)}
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
            <label className="block mb-1 font-medium">First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="Enter your first name"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Enter you last name"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Phone Number</label>
            <input
              type="number"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              placeholder="Enter your phone number"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Email Address</label>
            <input
              type="email"
              name="emailAddress"
              value={formData.emailAddress}
              onChange={handleInputChange}
              placeholder="Enter your email address"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Date of Birth</label>
            <input
              type="date"
              name="dateOfBirth"
              // value={formData.dateOfBirth}
              onChange={handleInputChange}
              placeholder="Enter your email address"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Gender</label>
            <select
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>

      {/* Navigation Buttons */}
      <div className="flex justify-left space-x-4 mt-8">
      <button
          className="px-4 py-2 bg-[#123961] text-white rounded hover:bg-blue-600"
        >
          Update
        </button>

        <button
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"  
        >
          Remove User
        </button>

      </div>



      </div>
    </div>
     
  );
}
