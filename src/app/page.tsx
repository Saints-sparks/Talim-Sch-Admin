'use client';

import Image from 'next/image';
import { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify'; // Import toast from react-toastify
import { authService } from './services/auth.service';
import nookies from 'nookies'

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
    <div className="flex h-screen bg-white-400">
      {/* Left Section */}
      <div className="w-1/2 flex flex-col justify-center items-center px-8">
        <div className="w-[70%] bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">
            Welcome Back!
          </h1>
          <p className="text-sm text-gray-600 mb-6 text-center">
            Sign in to begin your learning journey.
          </p>
          <form className="flex flex-col space-y-6" onSubmit={handleFormSubmit}>
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
              className="w-[60%] bg-[#154473] text-white py-2 px-3 rounded-lg shadow-lg hover:bg-[#123961] focus:outline-none focus:ring focus:ring-[#5A7EA6] mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'} {/* Change button text based on loading state */}
            </button>
          </form>
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


// "use client";

// import Image from "next/image";
// import { useRouter, usePathname } from "next/navigation";
// import { useState, useEffect, ChangeEvent, FormEvent } from "react";
// import { usePageIndicator } from "./context/PageIndicatorContext";
// import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

// export default function Home() {
//   const router = useRouter();
//   const pathname = usePathname();
//   const { currentPage, setCurrentPage } = usePageIndicator();
//   const [name, setName] = useState<string>("");
//   const [password, setPassword] = useState<string>("");
//   const [showPassword, setShowPassword] = useState<boolean>(false);

//   const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
//     setName(e.target.value);
//   };

//   const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
//     setPassword(e.target.value);
//   };

//   const togglePasswordVisibility = () => {
//     setShowPassword(!showPassword);
//   };

//   const handleFormSubmit = (e: FormEvent) => {
//     e.preventDefault();
//     setCurrentPage(1);
//     router.push("/account-section-1");
//   };

//   // Sync current page indicator with pathname changes
//   useEffect(() => {
//     const routes = ["/", "/account-section-1", "/account-section-2"];
//     const pageIndex = routes.indexOf(pathname);
//     if (pageIndex !== -1) {
//       setCurrentPage(pageIndex);
//     }
//   }, [pathname, setCurrentPage]);

//   return (
//     <div className="flex flex-col md:flex-row h-screen bg-white">

//       {/* Left Section - Login Form */}
//       <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-6 md:px-8">
//         {/* Tree Image (Above Form) */}
//         <div className="mb-6">
//         <Image
//               src="/icons/tree.svg"
//               alt="Tree Logo"
//               width={64}
//               height={64}
//               className="h-[80px] w-[76.32px]"
//               priority
//             />
//         </div>

//         <div className="w-full md:w-[70%] bg-white shadow-lg rounded-lg p-6 md:p-8">
//           <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3 md:mb-4 text-center">
//             Welcome Back!
//           </h1>
//           <p className="text-sm text-gray-600 mb-4 md:mb-6 text-center">
//             Sign in to School Admin
//           </p>
//           <form className="flex flex-col space-y-4 md:space-y-6" onSubmit={handleFormSubmit}>
//             <div>
//               <label htmlFor="name" className="block text-sm font-medium text-gray-700">
//                 School ID
//               </label>
//               <input
//                 type="text"
//                 id="id"
//                 name="id"
//                 placeholder="Enter School ID"
//                 value={name}
//                 onChange={handleNameChange}
//                 className="mt-1 w-full px-3 py-2 rounded-lg shadow-sm text-gray-800 border border-gray-300 transition-all duration-200 hover:ring-2 hover:ring-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
//               />
//             </div>

//             {/* Password Input with Toggle */}
//             <div className="relative">
//               <label htmlFor="password" className="block text-sm font-medium text-gray-700">
//                 Password
//               </label>
//               <input
//                 type={showPassword ? "text" : "password"}
//                 id="password"
//                 name="password"
//                 placeholder="Enter your password"
//                 value={password}
//                 onChange={handlePasswordChange}
//                 className="mt-1 w-full px-3 py-2 rounded-lg shadow-sm text-gray-800 border border-gray-300 transition-all duration-200 hover:ring-2 hover:ring-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
//               />
//               <button
//                 type="button"
//                 onClick={togglePasswordVisibility}
//                 className="absolute right-3 top-9 transform -translate-y-1/2 text-gray-600 focus:outline-none"
//               >
//                 {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
//               </button>
//             </div>

//             <button
//               type="submit"
//               className="w-full md:w-[60%] bg-[#154473] text-white py-2 px-3 rounded-lg shadow-lg hover:bg-[#123961] focus:outline-none focus:ring focus:ring-[#5A7EA6] mx-auto"
//             >
//               Sign In
//             </button>
//           </form>

//           <p className="text-center p-5">
//             Don't have an account? <a href="/signup" className="font-bold text-[#154473]"> Sign Up</a>
//           </p>
//         </div>
//       </div>

//       {/* Right Section - Image (Hidden on Mobile) */}
//       <div className="hidden md:flex w-1/2 items-center justify-center bg-gray-200">
//         <div className="w-full h-full relative">
//           <Image
//             src="/img/home.png"
//             alt="High School"
//             layout="fill"
//             objectFit="cover"
//           />
//         </div>
//       </div>
//     </div>
//   );
// }
