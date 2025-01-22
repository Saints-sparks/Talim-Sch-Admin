"use client"

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";

const Timetable = () => {
  const hourHeight = 130; // Height for each hour (in pixels)
  const startHour = 8; // Start of the timetable (8 AM)

  // Set your custom time here (use a 24-hour format)
  const [manualTime, setManualTime] = useState("11:00");

  const [currentTimePosition, setCurrentTimePosition] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  useEffect(() => {
    // Parse the manually set time
    const [hours, minutes] = manualTime.split(":").map(Number);

    // Calculate the position based on hours and minutes
    const timePosition = ((hours - startHour) + minutes / 60) * hourHeight + 65;

    setCurrentTimePosition(timePosition);
  }, [manualTime, hourHeight]);

  const subjects = [
    { name: "Biology", day: "Monday", start: 8, end: 10 },
    { name: "Mathematics", day: "Tuesday", start: 8, end: 9 },
    { name: "Physics", day: "Tuesday", start: 9, end: 10 },
    { name: "English Language", day: "Wednesday", start: 10, end: 11 },
    { name: "French", day: "Thursday", start: 9, end: 10 },
    { name: "Break time", day: "All", start: 12, end: 13 },
    { name: "Agric Science", day: "All", start: 13, end: 14 },
  ];

  return (
    <div className="px-4">
      <div className="mx-auto bg-[#F8F8F8] rounded-lg p-6">
        <Header/>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold">Timetable</h1>
          <button
              className="font-bold text-[#154473]"
              onClick={toggleModal}
            >
              + Add
            </button>

        </div>
        <p className="text-gray-500 mb-6">Stay on Track with Your Class Schedule!</p>

        <div className="overflow-x-auto border border-gray-300 rounded-t-3xl max-h-[510px] 2xl:max-h-[800px] overflow-y-scroll">
          <div className="grid sticky top-0 z-30" style={{ gridTemplateColumns: "103px repeat(5, 1fr)" }}>
            <div className="font-semibold text-center bg-[#FFFFFF] py-6">Time</div>
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day, index) => (
              <div key={index} className="font-semibold text-center bg-[#FFFFFF] py-6 border-l border-gray-300">
                {day}
              </div>
            ))}
          </div>

          <div className="grid relative" style={{ gridTemplateColumns: "103px repeat(5, 1fr)" }}>
            <div className="left-0 bg-white">
              {["8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM"].map((time, index) => (
                <div key={index} className="flex items-center justify-center border-b border-gray-300" style={{ height: `${hourHeight}px` }}>
                  {time}
                </div>
              ))}
            </div>

            {subjects
              .filter((subject) => subject.name === "Break time")
              .map((breakTime, index) => {
                const topPosition = (breakTime.start - startHour) * hourHeight + 65;
                const subjectHeight = (breakTime.end - breakTime.start) * hourHeight - 16;

                return (
                  <div
                    key={index}
                    className="absolute left-[103px] right-0 m-1 p-2 rounded shadow-md bg-gray-400 flex items-center justify-center text-center"
                    style={{
                      top: `${topPosition}px`,
                      height: `${subjectHeight}px`,
                      gridColumn: "span 5",
                    }}
                  >
                    <div>
                      <div className="font-semibold">{breakTime.name}</div>
                      <div className="text-sm text-gray-500">
                        {breakTime.start}:00 PM - {breakTime.end}:00 PM
                      </div>
                    </div>
                  </div>
                );
              })}

            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day, dayIndex) => (
              <div key={dayIndex} className="col-span-1 border-l border-gray-300 relative">
                {subjects
                  .filter((subject) => subject.day === day)
                  .map((subject, subjectIndex) => {
                    const topPosition = (subject.start - startHour) * hourHeight + 65;
                    const subjectHeight = (subject.end - subject.start) * hourHeight - 16;

                    return (
                      <div
                        key={subjectIndex}
                        className="absolute left-0 right-0 m-1 p-2 rounded shadow-orange-800  bg-[#ffffff] flex items-center justify-center text-center"
                        style={{
                          top: `${topPosition}px`,
                          height: `${subjectHeight}px`,
                        }}
                      >
                        <div>
                          <div className="font-semibold">{subject.name}</div>
                          <div className="text-sm text-gray-500">
                            {subject.start}:00 AM - {subject.end}:00 AM
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ))}
 
            {/* Dynamic Time Indicator Based on Custom Time */}
            <div
  className="absolute left-[110px] w-[88%] 2xl:w-[93%]"
  style={{
    top: `${currentTimePosition - 7}px `, // Position based on the calculated time
    zIndex: 20,
 
  }}
>
  {/* Time Pill */}
  <div className="absolute top-[-6px] left-[-87px] px-3 py-1 flex items-center justify-center bg-[#002B5B] text-white font-medium rounded-full">
    {manualTime}
  </div>

  {/* Blue Dot */}
  <div className="absolute  left-[-8px] right-0 h-2 w-2 rounded-full bg-[#002B5B]" 
  style={{
    top: `5.4px`, // Position based on the calculated time
    
  }}/>

  {/* Horizontal Line */}
  <div
    className="absolute top-2 left-0 right-0 bg-[#002B5B]"
    style={{
      height: "3px", // Line thickness
      
      
    }}
  />
</div>

          
          </div>
        </div>
      </div>



     {/* Add Class Modal */}
     {isModalOpen && (
  <div
    className={`fixed inset-0 bg-gray-900 bg-opacity-50 z-50 transition-opacity duration-300 ease-in-out ${
      isModalOpen ? "opacity-100" : "opacity-0"
    }`}
    onClick={toggleModal} // Close modal on clicking the overlay
  >
    <div
      className={`absolute right-0 top-0 h-full w-full md:w-1/2 bg-white p-6 shadow-lg transform transition-transform duration-300 ease-in-out ${
        isModalOpen ? "translate-x-0" : "translate-x-full"
      } flex flex-col`}
      onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
    >
      {/* Modal Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-semibold text-gray-800">Timetable</h3>
        <button
          className="text-gray-500 hover:text-gray-700 text-2xl"
          onClick={toggleModal}
        >
          ✕
        </button>
      </div>

      {/* Modal Body */}
      <form className="flex-grow">
        <div className="mb-4 gap-4">

          <div className="flex-1">
            <label className="block text-gray-700 font-semibold mb-2">
              Class 
            </label>
            <select
              className="w-1/3 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled selected>
                Select class
              </option>
              <option value="JSS 1">JSS 1</option>
              <option value="JSS 2">JSS 2</option>
              <option value="JSS 3">JSS 3</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-gray-700 font-semibold mb-2">
              Subject 
            </label>
            <select
              className="w-1/3 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled selected>
                Select Subject
              </option>
              <option value="Mathematics">Mathematics</option>
              <option value="English Language">English Language</option>
              <option value="Physics">Physics</option>
            </select>
            <div>

            <div className="flex-1">
            <label className="block mb-1 font-medium">Date</label>
              <input
                type="date"
                name="date"
                placeholder="Select date"
                className="w-1/3 px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
              />

            <label className="block text-gray-700 font-semibold mb-2">
              Start Time 
            </label>
            <select
              className="w-1/3 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled selected>
                Select Time
              </option>
              <option value="8:00 AM">8:00 AM</option>
              <option value="8:30 AM">8:30 AM</option>
              <option value="9:00 AM">9:00 AM</option>


            </select>
            </div>

            <div className="flex-1">
            <label className="block text-gray-700 font-semibold mb-2">
              End Time
            </label>
            <select
              className="w-1/3 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled selected>
                Select Time
              </option>
              <option value="8:00 AM">8:00 AM</option>
              <option value="8:30 AM">8:30 AM</option>
              <option value="9:00 AM">9:00 AM</option>


            </select>
          </div>
           
          </div>

          </div>
        </div>
      </form>

      {/* Modal Footer */}
      <div className="flex justify-end gap-4 mt-auto">
        <button
          className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          onClick={toggleModal}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-3 bg-[#154473] text-white rounded-lg hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}




    </div>
  );
};

export default Timetable;