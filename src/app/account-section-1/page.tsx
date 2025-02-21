'use client';

import { useState, useEffect } from 'react';
import { usePageIndicator } from '../context/PageIndicatorContext';
import { useRouter, usePathname } from 'next/navigation';
import { useNavigationHelpers } from '../../utils/useNavigationHelpers';

interface FormData {
  schoolName: string;
  schoolPrefix: string;
  street: string;
  city: string;
  state: string;
  country: string;
  logo: string;
}

export default function Step1() {
  const { currentPage, setCurrentPage } = usePageIndicator();
  const router = useRouter();
  const pathname = usePathname();
  const { goBack } = useNavigationHelpers();

  const [formData, setFormData] = useState<FormData>({
    schoolName: '',
    schoolPrefix: '',
    street: '',
    city: '',
    state: '',
    country: '',
    logo: "/icons/tree.svg",
  });

  const handleDotClick = (index: number) => {
    setCurrentPage(index);
    const routes = ['/account-section-1', '/account-section-2'];
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
        // logo: e.target.files[0],
      });
    }
  };

  const handleNext = (e: any) => {
    e.preventDefault();
    router.push('/account-section-2');
  };

  useEffect(() => {
    const routeToPageMap: Record<string, number> = {
      '/account-section-1': 0,
      '/account-section-2': 1,
    };
    setCurrentPage(routeToPageMap[pathname] || 0);
  }, [pathname, setCurrentPage]);

  return (
    <div className="flex w-screen bg-white">

      {/* Left Sidebar */}
      <div className="w-64 bg-white text-white flex flex-col p-6">
        <div className="flex justify-center mt-auto">
          {[...Array(2)].map((_, index) => (
            <span
              key={index}
              onClick={() => handleDotClick(index)}
              className={`h-2 w-2 mx-1 rounded-full cursor-pointer ${
                currentPage === index ? 'bg-[#123961]' : 'bg-gray-300'
              }`}
            ></span>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white p-8 rounded shadow-md w-full sm:w-[80%] min-h-[90vh] mx-auto">
        <h2 className="text-2xl font-semibold mb-6">School Information & Contact Details</h2>

        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-x-4 sm:space-y-0 mb-6">
          {/* Profile Image */}
          <div className="w-24 h-24 rounded-full border flex justify-center items-center overflow-hidden bg-white">
            {formData.logo ? (
              <img
                src={"/icons/tree.svg"}
                alt="School Logo"
                className="w-full h-full object-cover"
              />
            ) : (
              <span>Logo</span>
            )}
          </div>

          {/* Upload Button */}
          <label className="cursor-pointer">
            <span className="text-[#123961] px-4 py-2 bg-gray-300 border-2 border-[#123961] rounded-lg">
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

        {/* Input Fields */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">School Name</label>
            <input
              type="text"
              name="schoolName"
              value={formData.schoolName}
              onChange={handleInputChange}
              placeholder="Enter your school name"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
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
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
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
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">City</label>
            <select
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
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
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
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
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
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
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            onClick={goBack}
          >
            Go Back
          </button>
          <button
            className="px-4 py-2 bg-[#123961] text-white rounded-lg hover:bg-blue-600"
            onClick={handleNext}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
