import React from "react";
import TeacherCard from "./TeacherCard";

const teachers = [
  {
    name: "Emeka Adewale",
    classLevel: "CHE 121",
    imageUrl: "/img/teacher.jpg", 
  },
  {
    name: "Adebayo James",
    classLevel: "Bio 111",
    imageUrl: "/img/teacher.jpg",
  },
  {
    name: "Garba Lawal",
    classLevel: "Mat 112",
    imageUrl: "/img/teacher.jpg", 
  },
  {
    name: "Emeka Adewale",
    classLevel: "CHE 121",
    imageUrl: "/img/teacher.jpg", 
  },
  {
    name: "Adebayo James",
    classLevel: "Bio 111",
    imageUrl: "/img/teacher.jpg",
  },
  {
    name: "Garba Lawal",
    classLevel: "Mat 112",
    imageUrl: "/img/teacher.jpg", 
  },
  {
    name: "Emeka Adewale",
    classLevel: "CHE 121",
    imageUrl: "/img/teacher.jpg", 
  },
  {
    name: "Adebayo James",
    classLevel: "Bio 111",
    imageUrl: "/img/teacher.jpg",
  },
  {
    name: "Garba Lawal",
    classLevel: "Mat 112",
    imageUrl: "/img/teacher.jpg", 
  },

];

const TeacherGrid: React.FC = () => {
  return (
    <div className="pt-6 bg-gray-50 ">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold mb-6 text-black">All Teachers</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-6 ">
        {teachers.map((teacher, index) => (
          <TeacherCard key={index} teacher={teacher} />
        ))}
      </div>
    </div>
  );
};

export default TeacherGrid;
