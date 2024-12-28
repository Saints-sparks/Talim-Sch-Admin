"use client"
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import StudentCard from "@/components/StudentCard";
import { useRouter } from 'next/navigation';
import React from "react";


interface Student {
  name: string;
  class: string;
  image: string;
}

const DashboardPage: React.FC = () => {
    const router = useRouter(); // Initialize the router
  const user = "Administrator";
  const tent = "Staff Management!";
  interface Student {
    name: string;
    classLevel: string; // Updated from 'class'
    imageUrl: string;    // Updated from 'image'
  }
  
  const students: Student[] = Array(12).fill({
    name: 'Emeka Adewale',
    classLevel: 'SS 3',         // Updated
    imageUrl: './img/profile.jpg', // Updated
  });  
  
  
  const handleNavigate = (path: string) => {
    console.log(`Navigating to: ${path}`); // Debugging statement
    router.push(path); // Navigate to the specified path
  };


  

  return (
    <div className="p-6 space-y-1 bg-[F8F8F8]">
      <Header user={user} tent={tent} />
    

      <main className="p-6 text-gray-800">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold"> Manage all students registered in the Learning Management System</h1>
            <button className="px-4 py-2 bg-[#154473]  text-white rounded"
            onClick={() => handleNavigate("/add-student")}
            >+ Add Student</button>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {students.map((student, index) => (
              <StudentCard key={index} student={student} />
            ))}
          </div>
        </main>

    </div>
  );
};

export default DashboardPage;


