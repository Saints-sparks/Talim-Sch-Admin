'use client';

import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { usePageIndicator } from './context/PageIndicatorContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function Home() {
  const router = useRouter();
  const pathname = usePathname(); 
  const { currentPage, setCurrentPage } = usePageIndicator();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handlePasswordChange = (e: any) => {
    setPassword(e.target.value);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    router.push('/account-section-1');  // Redirect to /dashboard page
  };

  // Sync current page indicator with pathname changes
  useEffect(() => {
    const routes = ['/', '/account-section-1', '/account-section-2'];
    const pageIndex = routes.indexOf(pathname); // Determine the current page index
    if (pageIndex !== -1) {
      setCurrentPage(pageIndex);
    }
  }, [pathname, setCurrentPage]); // Trigger whenever the pathname changes

  return (
    <div className="flex h-screen bg-white">
      {/* Left Section */}
      <div className="w-1/2 flex flex-col justify-center items-center px-8">
        <div className="w-[70%] bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">
            Welcome Back!
          </h1>
          <p className="text-sm text-gray-600 mb-6 text-center">
            Sign in to School Admin
          </p>
          <form className="flex flex-col space-y-6" onSubmit={handleFormSubmit}>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                School ID
              </label>
              <input
                type="text"
                id="id"
                name="id"
                placeholder="Enter School ID"
                value={name}
                onChange={handleNameChange}
                className="mt-1 w-[100%] px-3 py-2 rounded-lg shadow-sm text-gray-800 transition-all duration-200 hover:ring-2 hover:ring-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
              {/* Password Input with Toggle */}
              <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'} // Toggle password visibility
                id="password"
                name="password"
                placeholder="Enter your password"
                value={password}
                onChange={handlePasswordChange}
                className="mt-1 w-full px-3 py-2 rounded-lg shadow-sm text-gray-800 transition-all duration-200 hover:ring-2 hover:ring-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-9 transform -translate-y-1/2 text-gray-600 focus:outline-none"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>


            <button
              type="submit"
              className="w-[60%] bg-[#154473] text-white py-2 px-3 rounded-lg shadow-lg hover:bg-[#123961] focus:outline-none focus:ring focus:ring-[#5A7EA6] mx-auto"
            >
              Sign In
            </button>
          </form>

          <p className='text-center p-5 '>Don't have an account? <a href="#" className='font-bold text-[#154473]'> Sign Up</a></p> 

  
        </div>
      </div>

      {/* Right Section */}
      <div className="w-1/2 flex items-center justify-center bg-gray-200">
        <div className="w-full h-full relative">
          <Image
            src="/img/home.png"
            alt="High School"
            layout="fill"
            objectFit="cover"
          />
        </div>
      </div>
    </div>
  );
}
