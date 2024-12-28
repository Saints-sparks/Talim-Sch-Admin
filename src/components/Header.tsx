// components/Header.tsx
import React, { useEffect, useState } from 'react';
import { FaCalendarAlt } from 'react-icons/fa';
import { HiOutlineBell } from "react-icons/hi";

// Define the prop type for the greeting
interface HeaderProps {
  user: string;
  tent: string; // Make sure tent is included in the type
}

const Header: React.FC<HeaderProps> = ({ user, tent }) => { 
    const [currentDate, setCurrentDate] = useState('');
    
    useEffect(() => {
  const date = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
    setCurrentDate(date);
    }, []);
  

  return (
    <header className="flex justify-between items-center bg-white py-4 px-3 mt-[-15px] shadow-md">
      {/* Greeting Section */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
          {user} 
        </h1>
        <p className="text-sm text-gray-600">{tent}</p> {/* Display tent here */}
      </div>

      {/* Date and Notification Section */}
      <div className="flex items-center space-x-6">
        <div className='flex items-center space-x-2 text-gray-500'>
          <span className="text-sm text-gray-500">{currentDate}</span>
          <FaCalendarAlt className="text-lg" />
        </div>
        <HiOutlineBell className="text-xl text-gray-500 cursor-pointer hover:text-gray-700" />
      </div>
    </header>
  );
};

export default Header;
