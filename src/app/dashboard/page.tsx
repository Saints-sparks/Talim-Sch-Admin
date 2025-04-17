"use client";

import { useState } from "react";
import { HiOutlineBookOpen, HiOutlineClipboard } from "react-icons/hi";
import { IoPeopleOutline } from "react-icons/io5";
import {
  FiChevronRight,
  FiChevronDown,
  FiEdit,
  FiTrash,
  FiPlus,
} from "react-icons/fi";
import ProtectedRoute from "../../components/ProtectedRoutes";
import { Header } from "@/components/Header";
import book from "../../../public/icons/book-saved.svg";
import pro from "../../../public/icons/profile-2user.svg";
import Image from "next/image";

const Dashboard = () => {
  const [classes] = useState([
    { name: "Grade 1", capacity: "40/50", subjects: "Mathematics, Science..." },
    { name: "Grade 2", capacity: "40/50", subjects: "Mathematics, Science..." },
    { name: "Grade 3", capacity: "40/50", subjects: "Mathematics, Science..." },
    { name: "Grade 4", capacity: "40/50", subjects: "Mathematics, Science..." },
    { name: "Grade 5", capacity: "40/50", subjects: "Mathematics, Science..." },
    { name: "Grade 6", capacity: "40/50", subjects: "Mathematics, Science..." },
    { name: "Grade 7", capacity: "40/50", subjects: "Mathematics, Science..." },
    { name: "Grade 8", capacity: "40/50", subjects: "Mathematics, Science..." },
  ]);

  const cards = [
    {
      id: 1,
      icon: book,
      count: "15",
      label: "Total Number of Classes",
      details: (
        <>
          <p>
            Here you can add detailed information about the total number of
            classes.
          </p>
          <ul className="list-disc ml-6">
            <li>Class A: 5 sessions</li>
            <li>Class B: 6 sessions</li>
            <li>Class C: 4 sessions</li>
          </ul>
        </>
      ),
    },
    {
      id: 2,
      icon: pro,
      count: "520",
      label: "Total Number of Students",
      details: (
        <>
          <p>
            Here you can add detailed information about the total number of
            students.
          </p>
          <ul className="list-disc ml-6">
            <li>Grade 1: 100 students</li>
            <li>Grade 2: 150 students</li>
            <li>Grade 3: 270 students</li>
          </ul>
        </>
      ),
    },
    {
      id: 3,
      icon: book,
      count: "234",
      label: "Total Number of Subjects",
      details: (
        <>
          <p>
            Here you can add detailed information about the total number of
            subjects.
          </p>
          <ul className="list-disc ml-6">
            <li>Mathematics</li>
            <li>Science</li>
            <li>History</li>
          </ul>
        </>
      ),
    },
  ];

  const [expandedCards, setExpandedCards] = useState<number[]>([]); // Track expanded cards

  const toggleExpand = (id: number) => {
    setExpandedCards((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleExpandAll = () => {
    if (expandedCards.length === cards.length) {
      setExpandedCards([]);
    } else {
      setExpandedCards(cards.map((card) => card.id));
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
    console.log("Adding a new class");
    // Add logic to open a modal or navigate to a form
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-[#F8F8F8] p-2">
        {/* Main Content */}
        <main className="flex-grow overflow-y-auto">
          {/* Header */}
          <Header />
          <h1 className="font-medium text-xl py-5 px-5 text-[#2F2F2F]">
            Class Overview
          </h1>

          {/* Class Overview Cards */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 px-8 items-start">
            {cards.map((card) => (
              <div
                key={card.id}
                className="bg-white p-6 shadow rounded-2xl flex flex-col"
              >
                <div className="flex items-center gap-5 pt-5">
                  <div className="border-2 rounded-[10px] p-2 border-[#F1F1F1]">
                    <Image src={card.icon} alt="icon" width={32} height={32} />
                  </div>
                  <div className="flex flex-col">
                    <p className="text-[30px] font-medium text-[#030E18]">
                      {card.count}
                    </p>
                    <p className="text-[#878787] text-[16px] font-medium">
                      {card.label}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-b-2 border-[#F1F1F1]"></div>

                <div
                  onClick={() => toggleExpand(card.id)}
                  className="flex items-center justify-between mt-4 cursor-pointer text-gray-800"
                >
                  <span className="font-bold text-[#606060] hover:text-blue-700 transition-colors duration-200">
                    {expandedCards.includes(card.id) ? "See less" : "See more"}
                  </span>
                  {expandedCards.includes(card.id) ? (
                    <FiChevronDown className="text-xl" />
                  ) : (
                    <FiChevronRight className="text-xl" />
                  )}
                </div>

                {expandedCards.includes(card.id) && (
                  <div className="mt-4 text-gray-800">{card.details}</div>
                )}
              </div>
            ))}

            {/* See All / See Less button */}
            <div className="col-span-1 md:col-span-3 flex justify-center">
              <button
                className="py-2 font-bold text-[#154473] hover:text-blue-500 transition duration-200"
                onClick={toggleExpandAll}
              >
                {expandedCards.length === cards.length ? "See less" : "See all"}
              </button>
            </div>
          </section>

          {/* Classes Table */}
          <div className="px-8 ">
          <section className="bg-white shadow rounded-[20px] p-6 ">
            <div className="">
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
                  <th className="text-left py-2 px-4 text-gray-800">
                    Class Name
                  </th>
                  <th className="text-left py-2 px-4 text-gray-800">
                    Capacity
                  </th>
                  <th className="text-left py-2 px-4 text-gray-800">
                    Subjects Assigned
                  </th>
                  <th className="text-left py-2 px-4 text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b hover:bg-gray-50 transition-colors duration-200"
                  >
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
            </div>
          </section>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;
