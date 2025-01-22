'use client';

import Image from 'next/image';
import Header from '@/components/Header';
import React, { useState } from 'react';

type Tab = 'personal' | 'academic' | 'behavior' | 'achievements';

export default function Profile() {
  const [activeTab, setActiveTab] = useState<Tab>('personal');

  return (
    <div className="p-6 space-y-1">
      <Header />

      {/* Main Content */}
      <div className="p-5">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between mb-5">
            {/* Student Info */}
            <div className="flex items-center space-x-4">
              <Image
                src="/img/teacher.jpg" // Replace with actual path
                alt="Student"
                width={100}
                height={100}
                className="rounded-full"
              />
              <div>
                <h2 className="text-lg font-semibold">Emeka Adewale</h2>
                <p className="text-gray-500">Status: Online</p>
                <p className="text-gray-500">Class: S3</p>
              </div>
            </div>
            <button className="bg-[#154473] text-white px-4 py-2 rounded-md">
              Message
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 border-b border-gray-200 mb-5 px-4 py-3 rounded-lg bg-white">
            <button
              className={`pb-2 px-4 ${
                activeTab === 'personal'
                  ? 'text-[#154473] border-b-2 border-[#154473] font-semibold'
                  : 'text-gray-500 hover:bg-gray-100'
              } rounded-md transition duration-300 hover:text-gray-800`}
              onClick={() => setActiveTab('personal')}
            >
              School information and Contact details
            </button>
            <button
              className={`pb-2 px-4 ${
                activeTab === 'academic'
                  ? 'text-[#154473] border-b-2 border-[#154473] font-semibold'
                  : 'text-gray-500  hover:bg-gray-100'
              } rounded-md transition duration-300 hover:text-gray-800`}
              onClick={() => setActiveTab('academic')}
            >
             Administrator details
            </button>
            <button
              className={`pb-2 px-4 ${
                activeTab === 'behavior'
                  ? 'text-[#154473] border-b-2 border-[#154473] font-semibold'
                  : 'text-gray-500 hover:bg-gray-100 '
              } rounded-md transition duration-300 hover:text-gray-800`}
              onClick={() => setActiveTab('behavior')}
            >
              Behavior/Engagement Data
            </button>
            <button
              className={`pb-2 px-4 ${
                activeTab === 'achievements'
                  ? 'text-[#154473] border-b-2 border-[#154473] font-semibold'
                  : 'text-gray-500 hover:bg-gray-100  '
              } rounded-md transition duration-300 hover:text-gray-800`}
              onClick={() => setActiveTab('achievements')}
            >
              Achievements
            </button>
          </div>

          {/* Details Section */}
          <div className="grid md:grid-cols-1 gap-6 px-4">
            {activeTab === 'personal' && (

            <div className="grid md:grid-cols-2 gap-10 px-4">

                {/* Student Details - Right */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Student Details</h3>
            <table className="w-full border-collapse border-spacing-0 text-left bg-white rounded-lg overflow-hidden">
                <tbody>
                <tr>
                    <td className="px-4 py-3 border-b border-gray-200 text-gray-700">
                    Full Name
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 font-medium">
                    Emeka Adewale
                    </td>
                </tr>
                <tr>
                    <td className="px-4 py-3 border-b border-gray-200 text-gray-700">
                    Class/Grade Level
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 font-medium">S3</td>
                </tr>
                <tr>
                    <td className="px-4 py-3 border-b border-gray-200 text-gray-700">
                    Student ID
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 font-medium">
                    12345678
                    </td>
                </tr>
                <tr>
                    <td className="px-4 py-3 border-b border-gray-200 text-gray-700">
                    Date of Birth
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 font-medium">
                    January 1, 2005
                    </td>
                </tr>
                <tr>
                    <td className="px-4 py-3 border-b border-gray-200 text-gray-700">
                    Gender
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 font-medium">
                    Female
                    </td>
                </tr>
                <tr>
                    <td className="px-4 py-3 border-b border-gray-200 text-gray-700">
                    Phone Number
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 font-medium">
                    +234 701 246 5678
                    </td>
                </tr>
                <tr>
                    <td className="px-4 py-3 text-gray-700">Email Address</td>
                    <td className="px-4 py-3 font-medium">emeka.adewale@gmail.com</td>
                </tr>
                </tbody>
            </table>
            </div>

            {/* Guardian/Parent Details - Left */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Guardian/Parent Details</h3>
            <table className="w-full border-collapse border-spacing-0 text-left bg-white rounded-lg overflow-hidden">
                <tbody>
                <tr>
                    <td className="px-4 py-3 border-b border-gray-200 text-gray-700">Father's Name</td>
                    <td className="px-4 py-3 border-b border-gray-200 font-medium">Mr. Adewale Johnson</td>
                </tr>
                <tr>
                    <td className="px-4 py-3 border-b border-gray-200 text-gray-700">Father's Contact</td>
                    <td className="px-4 py-3 border-b border-gray-200 font-medium">+234 906 234 6789</td>
                </tr>
                <tr>
                    <td className="px-4 py-3 border-b border-gray-200 text-gray-700">Mother's Name</td>
                    <td className="px-4 py-3 border-b border-gray-200 font-medium">Mrs. Ngozi Adewale</td>
                </tr>
                <tr>
                    <td className="px-4 py-3 border-b border-gray-200 text-gray-700">Mother's Contact</td>
                    <td className="px-4 py-3 border-b border-gray-200 font-medium">+234 812 456 6789</td>
                </tr>
                <tr>
                    <td className="px-4 py-3 border-b border-gray-200 text-gray-700">Guardian's Name</td>
                    <td className="px-4 py-3 border-b border-gray-200 font-medium">Mrs. Amaka Okafor</td>
                </tr>
                <tr>
                    <td className="px-4 py-3 border-b border-gray-200 text-gray-700">Guardian's Contact</td>
                    <td className="px-4 py-3 border-b border-gray-200 font-medium">+234 705 567 6543</td>
                </tr>
                <tr>
                    <td className="px-4 py-3 text-gray-700">Guardian's Email</td>
                    <td className="px-4 py-3 font-medium">amakadokafor@gmail.com</td>
                </tr>
                </tbody>
            </table>
            </div>


            </div>

        
                


            )}

            {activeTab === 'academic' && (
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow hover:shadow-lg transition-shadow duration-300">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  Academic Information
                </h3>
                <p>Subjects Enrolled: Mathematics, English, Biology</p>
                <p>Average Grade: A</p>
              </div>
            )}

            {activeTab === 'behavior' && (
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow hover:shadow-lg transition-shadow duration-300">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  Behavior/Engagement Data
                </h3>
                <p>Attendance: 95%</p>
                <p>Disciplinary Notes: None</p>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow hover:shadow-lg transition-shadow duration-300">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  Achievements
                </h3>
                <p>Top Scorer in Mathematics Competition</p>
                <p>Sports Captain: Basketball Team</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
