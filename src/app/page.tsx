'use client';

import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { usePageIndicator } from './context/PageIndicatorContext';

export default function Home() {
  const router = useRouter();
  const pathname = usePathname(); 
  const { currentPage, setCurrentPage } = usePageIndicator();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    router.push('/dashboard');  // Redirect to /dashboard page
  };

  const handleDotClick = (index: number) => {
    setCurrentPage(index);
    const routes = ['/', '/email-verification', '/signup'];
    router.push(routes[index]);
  };

  // Sync current page indicator with pathname changes
  useEffect(() => {
    const routes = ['/', '/email-verification', '/signup'];
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
            Welcome Home!
          </h1>
          <p className="text-sm text-gray-600 mb-6 text-center">
            Sign up to begin your management journey.
          </p>
          <form className="flex flex-col space-y-6" onSubmit={handleFormSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Enter the name of the School"
                value={name}
                onChange={handleNameChange}
                className="mt-1 w-[100%] px-3 py-2 rounded-lg shadow-sm text-gray-800 transition-all duration-200 hover:ring-2 hover:ring-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                placeholder="Enter the school's location"
                value={location}
                onChange={handleLocationChange}
                className="mt-1 w-[100%] px-3 py-2 rounded-lg shadow-sm text-gray-800 transition-all duration-200 hover:ring-2 hover:ring-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-[60%] bg-[#154473] text-white py-2 px-3 rounded-lg shadow-lg hover:bg-[#123961] focus:outline-none focus:ring focus:ring-[#5A7EA6] mx-auto"
            >
              Save & Continue
            </button>
          </form>

          {/* Page Indicator */}
          <div className="flex justify-center mt-4">
            {[...Array(3)].map((_, index) => (
              <span
                key={index}
                onClick={() => handleDotClick(index)}
                className={`h-2 w-2 mx-1 rounded-full cursor-pointer ${
                  currentPage === index ? 'bg-indigo-500' : 'bg-gray-300'
                }`}
              ></span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="w-1/2 flex items-center justify-center bg-gray-200">
        <div className="w-full h-full relative">
          <Image
            src="/img/signup.png"
            alt="High School"
            layout="fill"
            objectFit="cover"
          />
        </div>
      </div>
    </div>
  );
}
