'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { HiOutlineBookOpen, HiOutlineClipboard } from 'react-icons/hi';
import { IoPeopleOutline } from 'react-icons/io5';
import { FiChevronRight, FiChevronDown, FiEdit, FiTrash, FiPlus } from 'react-icons/fi';
import ProtectedRoute from '../../components/ProtectedRoutes';

const Dashboard = () => {
  const [classes] = useState([
    { name: 'Grade 1', capacity: '40/50', subjects: 'Mathematics, Science...' },
    { name: 'Grade 2', capacity: '40/50', subjects: 'Mathematics, Science...' },
    { name: 'Grade 3', capacity: '40/50', subjects: 'Mathematics, Science...' },
    { name: 'Grade 4', capacity: '40/50', subjects: 'Mathematics, Science...' },
    { name: 'Grade 5', capacity: '40/50', subjects: 'Mathematics, Science...' },
    { name: 'Grade 6', capacity: '40/50', subjects: 'Mathematics, Science...' },
    { name: 'Grade 7', capacity: '40/50', subjects: 'Mathematics, Science...' },
    { name: 'Grade 8', capacity: '40/50', subjects: 'Mathematics, Science...' },
  ]);

  const [expandedCards, setExpandedCards] = useState<number[]>([]); // Track expanded cards

  const toggleExpand = (cardIndex: number) => {
    setExpandedCards((prev) =>
      prev.includes(cardIndex)
        ? prev.filter((index) => index !== cardIndex) // Collapse the card
        : [...prev, cardIndex] // Expand the card
    );
  };

  const toggleExpandAll = () => {
    if (expandedCards.length === 3) {
      setExpandedCards([]); // Collapse all cards
    } else {
      setExpandedCards([1, 2, 3]); // Expand all cards
    }
  };

  const handleView = (className: string) => {
    console.log(`Viewing ${className}`);
    // Add navigation or modal logic here
  };

  const handleEdit = (className: string) => {
    console.log(`Editing ${className}`);
    // Add edit logic here
  };

  const handleDelete = (className: string) => {
    console.log(`Deleting ${className}`);
    // Add delete logic here
  };

  const handleAddClass = () => {
    console.log('Adding a new class');
    // Add logic to open a modal or navigate to a form
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-100">
        {/* Main Content */}
        <main className="flex-grow p-8 overflow-y-auto">
          {/* Header */}
          <Header />
          <h1 className="font-semibold text-3xl py-5 px-5 text-gray-800">Class Overview</h1>

          {/* Class Overview Cards */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Card 1: Total Classes */}
            <div className="bg-white p-6 shadow rounded-2xl flex flex-col items-center">
              <h3 className="text-4xl font-semibold text-gray-800">15</h3>
              <HiOutlineBookOpen className="text-4xl text-[#154473]" />
              <p className="text-gray-500 text-gray-800">Total Number of Classes</p>
              <div
                onClick={() => toggleExpand(1)}
                className="flex items-center text-blue-500 mt-4 cursor-pointer text-gray-800"
              >
                {expandedCards.includes(1) ? (
                  <FiChevronDown className="text-xl" />
                ) : (
                  <FiChevronRight className="text-xl" />
                )}
                <span className="ml-2 font-bold text-[#154473] hover:text-blue-700 transition-colors duration-200">
                  {expandedCards.includes(1) ? 'See less' : 'See more'}
                </span>
              </div>
              {expandedCards.includes(1) && (
                <div className="mt-4 text-gray-700 text-gray-800">
                  <p className="text-gray-800">Here you can add detailed information about the total number of classes.</p>
                  <ul className="list-disc ml-6">
                    <li>Class A: 5 sessions</li>
                    <li>Class B: 6 sessions</li>
                    <li>Class C: 4 sessions</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Card 2: Total Students */}
            <div className="bg-white p-6 shadow rounded-2xl flex flex-col items-center">
              <h3 className="text-4xl font-semibold text-gray-800">520</h3>
              <IoPeopleOutline className="text-4xl text-[#154473]" />
              <p className="text-gray-500 text-gray-800">Total Number of Students</p>
              <div
                onClick={() => toggleExpand(2)}
                className="flex items-center text-blue-500 mt-4 cursor-pointer text-gray-800"
              >
                {expandedCards.includes(2) ? (
                  <FiChevronDown className="text-xl" />
                ) : (
                  <FiChevronRight className="text-xl" />
                )}
                <span className="ml-2 font-bold text-[#154473] hover:text-blue-700 transition-colors duration-200 text-gray-800">
                  {expandedCards.includes(2) ? 'See less' : 'See more'}
                </span>
              </div>
              {expandedCards.includes(2) && (
                <div className="mt-4 text-gray-700 text-gray-800">
                  <p className="text-gray-800">Here you can add detailed information about the total number of students.</p>
                  <ul className="list-disc ml-6">
                    <li>Grade 1: 100 students</li>
                    <li>Grade 2: 150 students</li>
                    <li>Grade 3: 270 students</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Card 3: Total Subjects */}
            <div className="bg-white p-6 shadow rounded-2xl flex flex-col items-center">
              <h3 className="text-4xl font-semibold text-gray-800">234</h3>
              <HiOutlineClipboard className="text-4xl text-[#154473]" />
              <p className="text-gray-500 text-gray-800">Total Number of Subjects</p>
              <div
                onClick={() => toggleExpand(3)}
                className="flex items-center text-blue-500 mt-4 cursor-pointer text-gray-800"
              >
                {expandedCards.includes(3) ? (
                  <FiChevronDown className="text-xl" />
                ) : (
                  <FiChevronRight className="text-xl" />
                )}
                <span className="ml-2 font-bold text-[#154473] hover:text-blue-700 transition-colors duration-200">
                  {expandedCards.includes(3) ? 'See less' : 'See more'}
                </span>
              </div>
              {expandedCards.includes(3) && (
                <div className="mt-4 text-gray-700">
                  <p>Here you can add detailed information about the total number of subjects.</p>
                  <ul className="list-disc ml-6">
                    <li>Mathematics</li>
                    <li>Science</li>
                    <li>History</li>
                  </ul>
                </div>
              )}
            </div>

            {/* See All/See Less Button */}
            <div className="col-span-1 md:col-span-3 flex justify-center">
              <button
                className="py-2 font-bold text-[#154473] hover:text-blue-500 transition duration-200"
                onClick={toggleExpandAll}
              >
                {expandedCards.length === 3 ? 'See less' : 'See all'}
              </button>
            </div>
          </section>

          {/* Classes Table */}
          <section className="bg-white shadow rounded p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Classes</h3>
              <button
                className="flex items-center font-bold text-[#154473] hover:text-blue-500 transition duration-200"
                onClick={handleAddClass}
              >
                <FiPlus className="mr-2" /> Add Class
              </button>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 text-gray-800">Class Name</th>
                  <th className="text-left py-2 px-4 text-gray-800">Capacity</th>
                  <th className="text-left py-2 px-4 text-gray-800">Subjects Assigned</th>
                  <th className="text-left py-2 px-4 text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50 transition-colors duration-200">
                    <td className="py-2 px-4 text-gray-800">{item.name}</td>
                    <td className="py-2 px-4 text-gray-800">{item.capacity}</td>
                    <td className="py-2 px-4 text-gray-800">{item.subjects}</td>
                    <td className="py-2 px-4 flex items-center">
                      <button
                        className="px-3 py-1 bg-[#154473] text-white rounded hover:bg-blue-600"
                        onClick={() => handleView(item.name)}
                      >
                        View
                      </button>
                      <button
                        className="ml-2 px-2 py-1 text-gray-500 hover:text-gray-700"
                        onClick={() => handleEdit(item.name)}
                      >
                        <FiEdit className="text-xl" />
                      </button>
                      <button
                        className="ml-2 px-2 py-1 text-red-500 hover:text-red-700"
                        onClick={() => handleDelete(item.name)}
                      >
                        <FiTrash className="text-xl" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;