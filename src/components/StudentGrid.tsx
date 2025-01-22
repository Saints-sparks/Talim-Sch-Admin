import React from "react";
import StudentCard from "./StudentCard";

const students = [
  {
    name: "Emeka Adewale",
    classLevel: "CHE 121",
    imageUrl: "/img/student.jpg", 
  },
  {
    name: "Adebayo James",
    classLevel: "Bio 111",
    imageUrl: "/img/student.jpg",
  },
  {
    name: "Garba Lawal",
    classLevel: "Mat 112",
    imageUrl: "/img/student.jpg", 
  },
  {
    name: "Emeka Adewale",
    classLevel: "CHE 121",
    imageUrl: "/img/student.jpg", 
  },
  {
    name: "Adebayo James",
    classLevel: "Bio 111",
    imageUrl: "/img/student.jpg",
  },
  {
    name: "Garba Lawal",
    classLevel: "Mat 112",
    imageUrl: "/img/student.jpg", 
  },
  {
    name: "Emeka Adewale",
    classLevel: "CHE 121",
    imageUrl: "/img/student.jpg", 
  },
  {
    name: "Adebayo James",
    classLevel: "Bio 111",
    imageUrl: "/img/student.jpg",
  },
  {
    name: "Garba Lawal",
    classLevel: "Mat 112",
    imageUrl: "/img/student.jpg", 
  },

];

const StudentGrid: React.FC = () => {
  return (
    <div className="pt-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold mb-6 text-black">All Students</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-6">
        {students.map((student, index) => (
          <StudentCard key={index} student={student} />
        ))}
      </div>
    </div>
  );
};

export default StudentGrid;
