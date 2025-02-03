"use client";

import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { usePageIndicator } from "./context/PageIndicatorContext";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentPage, setCurrentPage } = usePageIndicator();
  const [name, setName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    router.push("/account-section-1");
  };

  // Sync current page indicator with pathname changes
  useEffect(() => {
    const routes = ["/", "/account-section-1", "/account-section-2"];
    const pageIndex = routes.indexOf(pathname);
    if (pageIndex !== -1) {
      setCurrentPage(pageIndex);
    }
  }, [pathname, setCurrentPage]);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-white">

      {/* Left Section - Login Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-6 md:px-8">
        {/* Tree Image (Above Form) */}
        <div className="mb-6">
        <Image
              src="/icons/tree.svg"
              alt="Tree Logo"
              width={64}
              height={64}
              className="h-[80px] w-[76.32px]"
              priority
            />
        </div>

        <div className="w-full md:w-[70%] bg-white shadow-lg rounded-lg p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3 md:mb-4 text-center">
            Welcome Back!
          </h1>
          <p className="text-sm text-gray-600 mb-4 md:mb-6 text-center">
            Sign in to School Admin
          </p>
          <form className="flex flex-col space-y-4 md:space-y-6" onSubmit={handleFormSubmit}>
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
                className="mt-1 w-full px-3 py-2 rounded-lg shadow-sm text-gray-800 border border-gray-300 transition-all duration-200 hover:ring-2 hover:ring-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Password Input with Toggle */}
            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Enter your password"
                value={password}
                onChange={handlePasswordChange}
                className="mt-1 w-full px-3 py-2 rounded-lg shadow-sm text-gray-800 border border-gray-300 transition-all duration-200 hover:ring-2 hover:ring-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-9 transform -translate-y-1/2 text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>

            <button
              type="submit"
              className="w-full md:w-[60%] bg-[#154473] text-white py-2 px-3 rounded-lg shadow-lg hover:bg-[#123961] focus:outline-none focus:ring focus:ring-[#5A7EA6] mx-auto"
            >
              Sign In
            </button>
          </form>

          <p className="text-center p-5">
            Don't have an account? <a href="#" className="font-bold text-[#154473]"> Sign Up</a>
          </p>
        </div>
      </div>

      {/* Right Section - Image (Hidden on Mobile) */}
      <div className="hidden md:flex w-1/2 items-center justify-center bg-gray-200">
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
