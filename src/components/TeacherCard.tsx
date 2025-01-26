'use client'
import React from 'react';
import { useRouter } from 'next/navigation';

interface Teacher {
  name: string;
  classLevel: string; 
  imageUrl: string;   
}

interface TeacherCardProps {
  teacher: Teacher;
}

const TeacherCard: React.FC<TeacherCardProps> = ({ teacher }) => (
<div className="p-4 border border-gray-200 rounded shadow-sm bg-white h-64 flex flex-col justify-between">
  <img
    src={teacher.imageUrl} // Updated
    alt={teacher.name}
    className="w-16 h-16 rounded-full mx-auto mb-2"
  />
  <h3 className="text-center text-lg font-semibold">{teacher.name}</h3>
  <p className="text-center text-gray-500">{teacher.classLevel}</p> {/* Updated */}
  <div className="flex justify-center mt-4">
    <button className="px-4 py-1 bg-gray-200 text[#154473] rounded">View Profile</button>
  </div>
</div>

);

export default TeacherCard;
