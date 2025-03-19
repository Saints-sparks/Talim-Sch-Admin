'use client';

import Image from "next/legacy/image";
import { useState, useEffect } from 'react';
import { usePageIndicator } from '../context/PageIndicatorContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import {useRouter, usePathname} from 'next/navigation'
import {useNavigationHelpers} from '../../utils/useNavigationHelpers'

interface FormData {
  schoolName: string;
  schoolPrefix: string;
  street: string;
  city: string;
  state: string;
  country: string;
  logo: File | null;
}

export default function Step1() {
  const { currentPage, setCurrentPage } = usePageIndicator();
  const router = useRouter()
  const pathname = usePathname()

  const {goBack} = useNavigationHelpers();

  const [formData, setFormData] = useState<FormData>({
    schoolName: '',
    schoolPrefix: '',
    street: '',
    city: '',
    state: '',
    country: '',
    logo: null,
  });


  const handleDotClick = (index: number) => {
    setCurrentPage(index);
  
    const routes = ['/step1', '/step2']; 
    router.push(routes[index]);
  };



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


  const handleNext = (e: any) => {
    e.preventDefault();
    router.push('/step2');
  };
 


  useEffect(() => {
    const routeToPageMap: Record<string, number> = {
      '/step1': 0,
      '/step2': 1,
    };
    setCurrentPage(routeToPageMap[pathname] || 0);
  }, [pathname, setCurrentPage]);


  return (
    <div className="flex w-screen bg-gray-100">

     
      <div className="w-64 bg-white text-white flex flex-col p-6">
        {/* Page Indicator */}
        <div className="flex justify-center mt-auto">
        {[...Array(2)].map((_, index) => (
          <span
            key={index}
            onClick={() => handleDotClick(index)} // Add click handler
            className={`h-2 w-2 mx-1 rounded-full cursor-pointer ${
              currentPage === index ? 'bg-[#123961]' : 'bg-gray-300'
            }`}
          ></span>
        ))}
        </div>
      </div>

      <div className="bg-white p-8 rounded shadow-md w-full w-screen h-auto min-h-[90vh]">
        <h2 className="text-2xl font-semibold mb-6">School Information & Contact Details</h2>
        <div className="flex items-center space-x-4 mb-6">
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
        </div>

      {/* Navigation Buttons */}
      <div className="flex justify-end space-x-4 mt-8">
        <button
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          onClick={goBack}
        >
          Go Back
        </button>
        <button
          className="px-4 py-2 bg-[#123961] text-white rounded hover:bg-blue-600"
          onClick={handleNext}
        >
          Next
        </button>
      </div>



      </div>
    </div>
     
  );
}
