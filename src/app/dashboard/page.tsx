'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import {
  HiOutlineBookOpen,
  HiOutlineClipboard
} from "react-icons/hi";
import { IoPeopleOutline } from "react-icons/io5";
import {AiOutlineBook } from  'react-icons/ai'
import { FiChevronRight, FiChevronDown, FiEdit, FiTrash } from "react-icons/fi";




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

  const [expandedCard, setExpandedCard] = useState<null | number>(null); // Track which card is expanded

  const toggleExpand = (cardIndex: number) => {
    setExpandedCard(expandedCard === cardIndex ? null : cardIndex); // Toggle the selected card
  };

  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpandAll = () => {
    setIsExpanded(!isExpanded);
  }

  

  return (
    <div className="flex h-screen bg-gray-100">

      {/* Main Content */}
      <main className="flex-grow p-8">

        {/* Header */}
          <Header/>
          <h1 className='font-semibold text-3xl py-5 px-5'>Class Overview</h1>
      

        {/* Class Overview */}
        <section className="grid grid-cols-3 gap-4 mb-8">
       
        {/* Card 1 */}
      <div className="bg-white p-6 shadow rounded-2xl flex flex-col items-center">
        <h3 className="text-4xl font-semibold">15</h3>
        <HiOutlineBookOpen className="text-4xl text-[#154473]" />
        <p className="text-gray-500">Total Number of Classes</p>
        <div
          onClick={() => toggleExpand(1)}
          className="flex items-center text-blue-500 mt-4 cursor-pointer"
        >
          {expandedCard === 1 ? (
            <FiChevronDown className="text-xl" />
          ) : (
            <FiChevronRight className="text-xl" />
          )}
          <span
            className={`ml-2 font-bold text-[#154473] hover:text-blue-700 transition-colors duration-200`}
          >
            {expandedCard === 1 ? "See less" : "See more"}
          </span>
        </div>
        {expandedCard === 1 && (
          <div className="mt-4 text-gray-700">
            <p>Here you can add detailed information about the total number of classes.</p>
            <ul className="list-disc ml-6">
              <li>Class A: 5 sessions</li>
              <li>Class B: 6 sessions</li>
              <li>Class C: 4 sessions</li>
            </ul>
          </div>
        )}
      </div>

      {/* Card 2 */}
      <div className="bg-white p-6 shadow rounded-2xl flex flex-col items-center">
        <h3 className="text-4xl font-semibold">520</h3>
        <IoPeopleOutline className="text-4xl text-[#154473]" />
        <p className="text-gray-500">Total Number of Students</p>
        <div
          onClick={() => toggleExpand(2)}
          className="flex items-center text-blue-500 mt-4 cursor-pointer"
        >
          {expandedCard === 2 ? (
            <FiChevronDown className="text-xl" />
          ) : (
            <FiChevronRight className="text-xl" />
          )}
          <span
            className={`ml-2 font-bold text-[#154473] hover:text-blue-700 transition-colors duration-200`}
          >
            {expandedCard === 2 ? "See less" : "See more"}
          </span>
        </div>
        {expandedCard === 2 && (
          <div className="mt-4 text-gray-700">
            <p>Here you can add detailed information about the total number of students.</p>
            <ul className="list-disc ml-6">
              <li>Grade 1: 100 students</li>
              <li>Grade 2: 150 students</li>
              <li>Grade 3: 270 students</li>
            </ul>
          </div>
        )}
      </div>

      {/* Card 3 */}
      <div className="bg-white p-6 shadow rounded-2xl flex flex-col items-center">
        <h3 className="text-4xl font-semibold">234</h3>
        <HiOutlineClipboard className="text-4xl text-[#154473]" />
        <p className="text-gray-500">Total Number of Subjects</p>
        <div
          onClick={() => toggleExpand(3)}
          className="flex items-center text-blue-500 mt-4 cursor-pointer"
        >
          {expandedCard === 3 ? (
            <FiChevronDown className="text-xl" />
          ) : (
            <FiChevronRight className="text-xl" />
          )}
          <span
            className={`ml-2 font-bold text-[#154473] hover:text-blue-700 transition-colors duration-200`}
          >
            {expandedCard === 3 ? "See less" : "See more"}
          </span>
        </div>
        {expandedCard === 3 && (
          <div className="mt-4 text-gray-700">
            <p>Here you can add detailed information about the total number of subjects.</p>
            <ul className="list-disc ml-6">
              <li>Mathematics</li>
              <li>Science</li>
              <li>History</li>
            </ul>
          </div>
        )}
      
      

      <div className="flex items-center">
        <button
          className="ml-auto py-2 font-bold text-[#154473] hover:text-blue-500 transition duration-200"
          onClick={toggleExpandAll}
        >
          {isExpanded ? "See less" : "See all"}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4">
          <p className="text-gray-600">Here you can display the expanded content or additional details.</p>
          <ul className="list-disc ml-6">
            <li>Detail 1</li>
            <li>Detail 2</li>
            <li>Detail 3</li>
          </ul>
        </div>
      )}

      </div>





      </section>

        {/* Classes Table */}
        <section className="bg-white shadow rounded p-6">
          <div className="flex justify-left gap-6 items-center mb-4">
            <h3 className="text-lg font-semibold">Classes</h3>
            <button className="font-bold text-[#154473]">+ Add</button>
          
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Class Name</th>
                <th className="text-left py-2 px-4">Capacity</th>
                <th className="text-left py-2 px-4">Subjects Assigned</th>
                <th className="text-left py-2 px-4">View</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((item, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4">{item.name}</td>
                  <td className="py-2 px-4">{item.capacity}</td>
                  <td className="py-2 px-4">{item.subjects}</td>
                  <td className="py-2 px-4">
                    <button className="px-3 py-1 bg-[#154473] text-white rounded hover:bg-blue-600">
                      View
                    </button>
                    <button className="ml-2 px-2 py-1 text-gray-500 hover:text-gray-700">
                    <FiEdit className="text-xl" />
                  </button>
                  <button className="ml-2 px-2 py-1 text-red-500 hover:text-red-700">
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
  );
};

export default Dashboard;
