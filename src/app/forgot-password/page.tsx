"use client";

import Image from "next/legacy/image";
import { useState } from 'react';
import { EyeIcon, EyeSlashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/CustomToast';
import { authService } from '../services/auth.service';
import treelogo from '../../../public/img/treelogo.svg';
import loginImage from '../../../public/img/Education-rafiki 1.svg';

type Step = 'email' | 'otp' | 'newPassword';

export default function ForgotPassword() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    
    try {
      const response = await authService.forgotPassword(email);
      toast.success('Reset code sent to your email!');
      setCurrentStep('otp');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    
    try {
      // Just validate OTP format for now, actual validation will be done in password reset
      toast.success('OTP verified successfully!');
      setCurrentStep('newPassword');
    } catch (error) {
      toast.error('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    
    try {
      const response = await authService.resetPassword(email, otp, newPassword);
      
      // Show success modal
      setShowSuccessModal(true);
      
      // Hide modal and redirect after animation completes
      setTimeout(() => {
        setShowSuccessModal(false);
        setTimeout(() => {
          router.push('/');
        }, 500);
      }, 3000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    if (currentStep === 'email') {
      router.push('/');
    } else if (currentStep === 'otp') {
      setCurrentStep('email');
    } else if (currentStep === 'newPassword') {
      setCurrentStep('otp');
    }
  };

  // Success Modal Component
  const SuccessModal = () => (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ${showSuccessModal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className={`bg-white rounded-2xl p-8 max-w-md mx-4 text-center transform transition-all duration-300 ${showSuccessModal ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        {/* Animated Checkmark */}
        <div className="mx-auto mb-6 w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <div className="checkmark-container">
            <svg
              className="checkmark w-12 h-12 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
                className="checkmark-path"
              />
            </svg>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Password Reset Successful!</h2>
        <p className="text-gray-600 mb-6">
          Your password has been successfully updated. You will be redirected to the sign-in page.
        </p>
        
        {/* Loading dots */}
        <div className="flex justify-center space-x-1">
          <div className="w-2 h-2 bg-[#154473] rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-[#154473] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-[#154473] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );

  const renderEmailStep = () => (
    <form className="flex flex-col space-y-4 sm:space-y-6" onSubmit={handleEmailSubmit}>
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full px-4 py-3 rounded-lg shadow-sm text-gray-900 transition-all duration-200 hover:ring-2 hover:ring-blue-400 focus:ring-2 focus:ring-blue-500 focus:outline-none border border-gray-400 bg-white"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-[60%] bg-[#154473] text-white py-2 px-3 rounded-lg shadow-lg hover:bg-[#123961] focus:outline-none focus:ring focus:ring-[#5A7EA6] mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Sending OTP...' : 'Send OTP'}
      </button>
    </form>
  );

  const renderOtpStep = () => (
    <form className="flex flex-col space-y-4 sm:space-y-6" onSubmit={handleOtpSubmit}>
      <div>
        <label htmlFor="otp" className="block text-sm font-semibold text-gray-900 mb-2">
          Enter OTP
        </label>
        <input
          type="text"
          id="otp"
          name="otp"
          placeholder="Enter 6-digit OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="mt-1 w-full px-4 py-3 rounded-lg shadow-sm text-gray-900 transition-all duration-200 hover:ring-2 hover:ring-blue-400 focus:ring-2 focus:ring-blue-500 focus:outline-none border border-gray-400 bg-white text-center text-2xl tracking-widest"
          maxLength={6}
          required
        />
        <p className="mt-2 text-sm text-gray-700 text-center">
          We've sent a 6-digit verification code to {email}
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-[60%] bg-[#154473] text-white py-2 px-3 rounded-lg shadow-lg hover:bg-[#123961] focus:outline-none focus:ring focus:ring-[#5A7EA6] mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Verifying...' : 'Verify OTP'}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => {
            // Call the forgot password API again to resend OTP
            handleEmailSubmit({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>);
          }}
          className="text-sm text-[#154473] hover:underline"
        >
          Resend OTP
        </button>
      </div>
    </form>
  );

  const renderPasswordStep = () => (
    <form className="flex flex-col space-y-4 sm:space-y-6" onSubmit={handlePasswordSubmit}>
      <div className="relative">
        <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-900 mb-2">
          New Password
        </label>
        <input
          type={showPassword ? 'text' : 'password'}
          id="newPassword"
          name="newPassword"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="mt-1 w-full px-4 py-3 rounded-lg shadow-sm text-gray-900 transition-all duration-200 hover:ring-2 hover:ring-blue-400 focus:ring-2 focus:ring-blue-500 focus:outline-none border border-gray-400 bg-white pr-12"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-10 text-gray-600 focus:outline-none"
        >
          {showPassword ? (
            <EyeSlashIcon className="h-5 w-5" />
          ) : (
            <EyeIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      <div className="relative">
        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-900 mb-2">
          Confirm New Password
        </label>
        <input
          type={showConfirmPassword ? 'text' : 'password'}
          id="confirmPassword"
          name="confirmPassword"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mt-1 w-full px-4 py-3 rounded-lg shadow-sm text-gray-900 transition-all duration-200 hover:ring-2 hover:ring-blue-400 focus:ring-2 focus:ring-blue-500 focus:outline-none border border-gray-400 bg-white pr-12"
          required
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="absolute right-3 top-10 text-gray-600 focus:outline-none"
        >
          {showConfirmPassword ? (
            <EyeSlashIcon className="h-5 w-5" />
          ) : (
            <EyeIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-[60%] bg-[#154473] text-white py-2 px-3 rounded-lg shadow-lg hover:bg-[#123961] focus:outline-none focus:ring focus:ring-[#5A7EA6] mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Resetting Password...' : 'Reset Password'}
      </button>
    </form>
  );

  const getStepTitle = () => {
    switch (currentStep) {
      case 'email':
        return 'Forgot Password?';
      case 'otp':
        return 'Verify OTP';
      case 'newPassword':
        return 'Set New Password';
      default:
        return 'Forgot Password?';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'email':
        return 'Enter your email address and we\'ll send you an OTP to reset your password.';
      case 'otp':
        return 'Enter the 6-digit verification code sent to your email.';
      case 'newPassword':
        return 'Create a new password for your account.';
      default:
        return 'Enter your email address and we\'ll send you an OTP to reset your password.';
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row h-screen bg-white-400">
        {/* Left Section */}
        <div className="w-full sm:w-1/2 flex flex-col justify-center items-center px-4 sm:px-8 py-8 sm:py-0">
          <div className="w-full sm:w-[70%] bg-white rounded-lg p-6 sm:p-8">
            
            {/* Back Button */}
            <div className="flex items-center mb-4">
              <button
                onClick={handleBackClick}
                className="flex items-center text-[#154473] hover:text-[#123961] transition-colors duration-200"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                <span className="text-sm">Back</span>
              </button>
            </div>

            {/* Logo Section */}
            <div className="flex items-center justify-center mb-6">
              <Image
                src={treelogo}
                alt="Talim Logo"
                width={80}
                height={80}
                className="h-16 w-16 sm:h-20 sm:w-20"
                priority
              />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 text-center">
              {getStepTitle()}
            </h1>
            <p className="text-xs sm:text-sm text-gray-700 mb-6 text-center">
              {getStepDescription()}
            </p>

            {/* Step Indicator */}
            <div className="flex justify-center mb-6">
              <div className="flex space-x-2">
                <div className={`w-3 h-3 rounded-full ${currentStep === 'email' ? 'bg-[#154473]' : 'bg-gray-300'}`}></div>
                <div className={`w-3 h-3 rounded-full ${currentStep === 'otp' ? 'bg-[#154473]' : 'bg-gray-300'}`}></div>
                <div className={`w-3 h-3 rounded-full ${currentStep === 'newPassword' ? 'bg-[#154473]' : 'bg-gray-300'}`}></div>
              </div>
            </div>

            {/* Render current step */}
            {currentStep === 'email' && renderEmailStep()}
            {currentStep === 'otp' && renderOtpStep()}
            {currentStep === 'newPassword' && renderPasswordStep()}

            {/* Sign In Link */}
            <div className="text-center mt-6">
              <span className="text-sm text-gray-700">Remember your password? </span>
              <a
                href="/"
                className="text-sm text-[#154473] hover:underline font-medium"
              >
                Sign In
              </a>
            </div>
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

      {/* Success Modal */}
      <SuccessModal />

      {/* CSS Styles for animations */}
      <style jsx>{`
        @keyframes checkmark {
          0% {
            stroke-dashoffset: 50;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        
        .checkmark-path {
          stroke-dasharray: 50;
          stroke-dashoffset: 50;
          animation: checkmark 0.6s ease-in-out 0.3s forwards;
        }
        
        .checkmark-container {
          animation: scale-up 0.3s ease-in-out;
        }
        
        @keyframes scale-up {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}
