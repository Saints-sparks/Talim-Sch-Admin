"use client";

import Image from "next/legacy/image";
import { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify'; // Import toast from react-toastify
import { authService } from './services/auth.service';
import nookies from 'nookies'

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon, trend }) => (
  <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm sm:text-lg font-medium text-gray-600">{title}</h3>
        <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 sm:mt-2">{value}</p>
      </div>
      <div className="p-2 sm:p-3 bg-[#154473] rounded-full text-white">
        {icon}
      </div>
    </div>
    {trend && (
      <div className="mt-2 sm:mt-4 text-xs sm:text-sm text-gray-500">
        <span>{trend}</span>
      </div>
    )}
  </div>
);

export default function SignIn() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // Loading state
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Set loading to true when the form is submitted
    setLoading(true);

    console.log('Login request:', { email, password });
    try {
      // Prepare the request body
      const requestBody = {
        email,
        password,
        deviceToken: '123456', // Replace with actual device token
        platform: 'web', // Replace with actual platform (e.g., 'web', 'ios', 'android')
      };

      // Send login request to the backend
      const response = await authService.login(requestBody);

      nookies.set(null, 'access_token', response.access_token, {
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      })
      nookies.set(null, 'refresh_token', response.refresh_token, {
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      })

      // Get user info
      const userInfo = await authService.introspectToken(response.access_token)

      // Store user info in localStorage
      localStorage.setItem('user', JSON.stringify(userInfo.user))
      localStorage.setItem('accessToken', response.access_token); // Store access token
      localStorage.setItem('refreshToken', response.refresh_token)
      toast.success('Login successful! Redirecting...');

      // Redirect to dashboard or home page on successful login
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000); // Delay redirect to allow toast to be seen
    } catch (err) {
      // Display error toast
      toast.error('An error occurred. Please try again.');
    } finally {
      // Reset loading state
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row h-screen bg-white-400">
      {/* Left Section */}
      <div className="w-full sm:w-1/2 flex flex-col justify-center items-center px-4 sm:px-8 py-8 sm:py-0">
        <div className="w-full sm:w-[70%] bg-white shadow-lg rounded-lg p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 text-center">
            Welcome Back!
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mb-6 text-center">
            Sign in to begin your learning journey.
          </p>
          <form className="flex flex-col space-y-4 sm:space-y-6" onSubmit={handleFormSubmit}>
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="text"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={email}
                onChange={handleEmailChange}
                className="mt-1 w-full px-3 py-2 rounded-lg shadow-sm text-gray-800 transition-all duration-200 hover:ring-2 hover:ring-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="rememberMe"
                className="ml-2 block text-sm text-gray-700"
              >
                Keep me signed in for easy access
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading} // Disable the button when loading
              className="w-full sm:w-[60%] bg-[#154473] text-white py-2 px-3 rounded-lg shadow-lg hover:bg-[#123961] focus:outline-none focus:ring focus:ring-[#5A7EA6] mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'} {/* Change button text based on loading state */}
            </button>
          </form>
        </div>
      </div>

      {/* Right Section */}
      <div className="w-full sm:w-1/2 flex items-center justify-center bg-gray-200">
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