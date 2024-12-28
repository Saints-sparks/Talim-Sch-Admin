import React from "react";
import { useRouter } from "next/navigation"; // Import useRouter hook
import { FaCalendarAlt } from "react-icons/fa";

// Define ClassCardProps
type ClassCardProps = {
  subject: string;
  title: string;
  duration: string;
  time: string;
  students: number;
  isActive?: boolean;
};

const ClassCard: React.FC<ClassCardProps> = ({
  subject,
  title,
  duration,
  time,
  students,
  isActive = false,
}) => {
  return (
    <div
      className={`p-4 rounded-lg shadow-md border w-[434px] h-[221px] ${
        isActive ? "bg-[#ADBECE] border-blue-300" : "bg-white border-gray-200"
      }`}
    >
      <div className="flex justify-between items-center mb-7">
        <span
          className={`text-sm font-semibold ${isActive ? "text-white" : "text-black"}`}
        >
          {subject}
        </span>
        <span
          className={`text-xs ${isActive ? "text-[#A5A5A5]" : "text-gray-600"} bg-[#F8F8F8] px-2 py-1 rounded-lg`}
        >
          {duration}
        </span>
      </div>
      <h3
        className={`mt-6 text-lg font-medium ${isActive ? "text-white" : "text-black"}`}
      >
        {title}
      </h3>
      <div className="flex justify-between mt-4">
        <p className={`mt-4 text-sm ${isActive ? "text-[#003366]" : "text-gray-600"}`}>
          Class {isActive ? "in" : "by"} {time}
        </p>
        <div className="mt-2 flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-gray-300"></div>
          <span
            className={`text-sm w-6 h-6 rounded-full ${isActive ? "text-white" : "text-gray-600"}`}
          >
            +{students}
          </span>
        </div>
      </div>
    </div>
  );
};

const UpcomingClasses: React.FC = () => {
  const router = useRouter(); // Initialize the router

  // Handle the click event to navigate to create class page
  const handleCreateClass = () => {
    router.push("/managetrack/curriculum/classes/create"); // Navigate to the create class page
  };

  const classes = [
    {
      subject: "MATHS",
      title: "Understanding Differentiation and Its Practical Applications",
      duration: "2 hours",
      time: "00:59:05",
      students: 25,
      isActive: true,
    },
    {
      subject: "MATHS",
      title: "Understanding Differentiation and Its Practical Applications",
      duration: "2 hours",
      time: "2:00pm",
      students: 25,
    },
    {
      subject: "MATHS",
      title: "Understanding Differentiation and Its Practical Applications",
      duration: "2 hours",
      time: "4:00pm",
      students: 25,
    },
  ];

  return (
    <div className="px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[24px] font-medium text-[#030E18]">Upcoming Classes</h2>
          <p className="text-sm text-gray-600">You have 5 classes left today</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleCreateClass} // Add the onClick handler for the button
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
          >
            + Create Class
          </button>
          <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option>Today</option>
            <option>Tomorrow</option>
          </select>
        </div>
      </div>

      {/* Class Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((classItem, index) => (
          <ClassCard key={index} {...classItem} />
        ))}
      </div>
    </div>
  );
};

export default UpcomingClasses;
