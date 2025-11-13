"use client";

import Image from "next/legacy/image";
import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import treelogo from "../../public/img/treelogo.svg";
import loginImage from "../../public/img/Education-rafiki 1.svg";

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon,
  trend,
}) => (
  <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm sm:text-lg font-medium text-gray-600">
          {title}
        </h3>
        <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 sm:mt-2">
          {value}
        </p>
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
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

    setLoading(true);

    try {
      const success = await login(email, password);

      if (success) {
        toast.success("Login successful! Redirecting...");

        // Redirect to dashboard on successful login
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        toast.error("Invalid credentials. Please try again.");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      toast.error(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row h-screen leading-[32px]">
      {/* Left Section */}
      <div className="w-full sm:w-1/2 flex bg-white flex-col justify-center items-center ">
        <div className="w-full bg-white  max-w-[400px]">
          {/* Logo Section */}
          <div className="flex items-center justify-center mb-6">
            <Image
              src={treelogo}
              alt="Talim Logo"
              width={100}
              height={100}
              className="h-16 w-16 sm:h-20 sm:w-20"
            />
          </div>
          <h1 className="text-[32px] font-medium leading-[32px] text-[#030E18] mb-4 text-center">
            Welcome Back!
          </h1>
          <p className="text-[18px] text-[#444444]  mb-6 text-center">
            Sign In to School Admin
          </p>
          <form
            className="flex flex-col space-y-4 sm:space-y-6"
            onSubmit={handleFormSubmit}
          >
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-[18px] font-medium text-[#030E18]"
              >
                Email
              </label>
              <input
                type="text"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={email}
                onChange={handleEmailChange}
                className="mt-1 border border-[#EEEEEE] w-full px-3 py-2 rounded-lg placeholder-[#AAAAAA] text-gray-800 transition-all duration-200 hover:ring-2 hover:ring-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Password Input with Toggle */}
            <div className="relative">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#030E18]"
              >
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"} // Toggle password visibility
                id="password"
                name="password"
                placeholder="Enter your password"
                value={password}
                onChange={handlePasswordChange}
                className="mt-1 border border-[#EEEEEE] w-full px-3 py-2 rounded-lg placeholder-[#AAAAAA] text-gray-800 transition-all duration-200 hover:ring-2 hover:ring-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-2/3 transform -translate-y-1/2 text-gray-600 focus:outline-none"
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
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-[#D2D2D2] rounded"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-[#030E18]">
                Keep me signed in for easy access
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading} // Disable the button when loading
              className="w-full  bg-[#003366] text-white py-2 px-3 rounded-lg font-medium text-[18px] hover:bg-[#123961] focus:outline-none focus:ring focus:ring-[#5A7EA6] mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}{" "}
              {/* Change button text based on loading state */}
            </button>

            {/* Forgot Password Link */}
            <div className="text-center mt-2">
              <a
                href="/forgot-password"
                className="leading-[15px] text-[#003366] hover:underline"
              >
                Forgot your password?
              </a>
            </div>
          </form>
        </div>
      </div>

      {/* Right Section */}
      <div className="w-full sm:w-1/2 flex items-center justify-center bg-[#F8F8F8]">
        <div className="h-[610px] w-[610px] relative">
          <Image
            src={loginImage}
            alt="High School"
            layout="fill"
            objectFit="fill"
          />
        </div>
      </div>
    </div>
  );
}
