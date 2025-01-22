'use client';

import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { usePageIndicator } from '../context/PageIndicatorContext';
import { useRouter, usePathname } from 'next/navigation';
import { useNavigationHelpers } from '../../utils/useNavigationHelpers';

interface FormData {
  adminName: string;
  adminEmail: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  profilePhoto: File | null;
}

export default function Step2() {
  const { currentPage, setCurrentPage } = usePageIndicator();
  const router = useRouter();
  const pathname = usePathname();
  const { goBack } = useNavigationHelpers();

  const [formData, setFormData] = useState<FormData>({
    adminName: '',
    adminEmail: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    profilePhoto: null,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleDotClick = (index: number) => {
    setCurrentPage(index);
    const routes = ['/step1', '/step2'];
    router.push(routes[index]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        profilePhoto: e.target.files[0],
      });
    }
  };

  const handleNext = (e: any) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    router.push('/dashboard');
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

      
      {/* Sidebar */}
      <div className="w-64 bg-white flex flex-col p-6">
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
      <div className="bg-white p-8 rounded shadow-md w-full h-auto min-h-[90vh]">
        <h2 className="text-2xl font-semibold mb-6">
          School Information & Contact Details
        </h2>

        {/* Profile Photo */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-24 h-24 rounded-full border flex justify-center items-center overflow-hidden bg-gray-200">
            {formData.profilePhoto ? (
              <img
                src={URL.createObjectURL(formData.profilePhoto)}
                alt="Admin Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span>Admin Profile</span>
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

        {/* Admin Information */}
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Admin Name"
            name="adminName"
            type="text"
            value={formData.adminName}
            onChange={handleInputChange}
            placeholder="Enter admin name"
          />
          <InputField
            label="Admin Email"
            name="adminEmail"
            type="email"
            value={formData.adminEmail}
            onChange={handleInputChange}
            placeholder="Enter admin email address"
          />
          <InputField
            label="Phone Number"
            name="phoneNumber"
            type="text"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            placeholder="Enter admin phone number"
          />
          <PasswordField
            label="Password"
            name="password"
            value={formData.password}
            show={showPassword}
            toggleShow={() => setShowPassword(!showPassword)}
            onChange={handleInputChange}
            placeholder="Enter password"
          />
          <PasswordField
            label="Confirm Password"
            name="confirmPassword"
            value={formData.confirmPassword}
            show={showConfirmPassword}
            toggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
            onChange={handleInputChange}
            placeholder="Confirm password"
          />
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
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function InputField({
  label,
  name,
  type,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  name: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block mb-1 font-medium">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
      />
    </div>
  );
}

function PasswordField({
  label,
  name,
  value,
  show,
  toggleShow,
  onChange,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  show: boolean;
  toggleShow: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block mb-1 font-medium">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
        />
        <button
          type="button"
          onClick={toggleShow}
          className="absolute inset-y-0 right-3 flex items-center"
        >
          {show ? (
            <EyeSlashIcon className="h-5 w-5 text-gray-500" />
          ) : (
            <EyeIcon className="h-5 w-5 text-gray-500" />
          )}
        </button>
      </div>
    </div>
  );
}
