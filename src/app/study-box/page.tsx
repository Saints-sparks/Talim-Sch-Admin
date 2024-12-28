'use client'

import React from "react";
import { useRouter } from 'next/navigation';

import { HiPlus, HiTrash } from "react-icons/hi";
import Header from "@/components/Header";

const UserManagement: React.FC = () => {

  const router = useRouter();


  const handleNavigate = (path: string) => {
    console.log(`Navigating to: ${path}`); // Debugging statement
    router.push(path); // Navigate to the specified path
  };

  const users = [
    { id: 1, name: "Maria John", email: "mariajames.com", role: "Student", contact: "(417) 646-6377", date: "01 August 2024" },
    { id: 2, name: "Collins Mogbulu", email: "mariajames.com", role: "Parent", contact: "(417) 646-6377", date: "01 August 2024" },
    { id: 3, name: "Precious Bello", email: "mariajames.com", role: "Student", contact: "(417) 646-6377", date: "01 August 2024" },
    { id: 4, name: "Apollo Jeremiah", email: "mariajames.com", role: "Staff", contact: "(417) 646-6377", date: "01 August 2024" },
    { id: 5, name: "Ifeoluwa Davies", email: "mariajames.com", role: "Student", contact: "(417) 646-6377", date: "01 August 2024" },
    { id: 6, name: "Cooper Jackline", email: "mariajames.com", role: "Student", contact: "(417) 646-6377", date: "01 August 2024" },
    { id: 7, name: "Ibrahim Bello", email: "mariajames.com", role: "Staff", contact: "(417) 646-6377", date: "01 August 2024" },
    { id: 8, name: "Muhammad Tukur", email: "mariajames.com", role: "Student", contact: "(417) 646-6377", date: "01 August 2024" },
    { id: 9, name: "Emmanuel Habila", email: "mariajames.com", role: "Student", contact: "(417) 646-6377", date: "01 August 2024" },
    { id: 10, name: "Wisdom Unbeze", email: "mariajames.com", role: "Student", contact: "(417) 646-6377", date: "01 August 2024" },
    { id: 11, name: "Adetoye Michael", email: "mariajames.com", role: "Student", contact: "(417) 646-6377", date: "01 August 2024" },
    { id: 12, name: "Ayomide Tobin", email: "mariajames.com", role: "Staff", contact: "(417) 646-6377", date: "01 August 2024" },
    { id: 13, name: "Jameson Ayotomi", email: "mariajames.com", role: "Parent", contact: "(417) 646-6377", date: "01 August 2024" },
    { id: 14, name: "Chinora Eke", email: "mariajames.com", role: "Student", contact: "(417) 646-6377", date: "01 August 2024" },
  ];

  return (
    <div className="p-6 space-y-1 bg-[F8F8F8]">
      {/* Header */}
      <Header user={'Administrator'} tent={"User Management"} />


      {/* Add Staff Button */}
      <div className="flex justify-between items-center mb-6 p-6">
            <h1 className="text-2xl font-semibold"> Manage all staff registered in the Learning Management System</h1>
            <button className="px-4 py-2 bg-[#154473]  text-white rounded"
             onClick={() => handleNavigate("/add-staff")}
            >+ Add Staff</button>
          </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">S/N</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Full Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Email Address</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">User Role</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Contact Details</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Joining Date</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3 text-gray-800 text-sm">{index + 1}</td>
                <td className="px-6 py-3 text-gray-800 text-sm">{user.name}</td>
                <td className="px-6 py-3 text-gray-800 text-sm">{user.email}</td>
                <td className="px-6 py-3 text-gray-800 text-sm">{user.role}</td>
                <td className="px-6 py-3 text-gray-800 text-sm">{user.contact}</td>
                <td className="px-6 py-3 text-gray-800 text-sm">{user.date}</td>
                <td className="px-6 py-3">
                  <button className="text-red-500 hover:text-red-700">
                    <HiTrash className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
