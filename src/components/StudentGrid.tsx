import React from "react";
import StudentCard from "./StudentCard";

const students = [
  {
    name: "Emeka Adewale",
    classLevel: "SS 3",
    imageUrl: "/img/profile.jpg", // Ensure these images exist in your `public` folder
  },
  {
    name: "Adebayo James",
    classLevel: "SS 2",
    imageUrl: "/img/profile.jpg",
  },
];

const StudentGrid: React.FC = () => {
  return (
    <div className="pt-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold mb-6 text-black">All Students</h1>
        <button className="bg-[#154473]  text-white px-4 py-2 rounded-md mb-6">
          + Add Student
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {students.map((student, index) => (
          <StudentCard key={index} student={student} />
        ))}
      </div>
    </div>
  );
};

export default StudentGrid;
