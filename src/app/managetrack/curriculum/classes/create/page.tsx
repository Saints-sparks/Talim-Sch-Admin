// app/manage-track/curriculum/classes/create/page.tsx
import React from "react";

const CreateClassPage: React.FC = () => {
  return (
    <div className="px-6 py-8">
      <h1 className="text-2xl font-semibold text-gray-800">Create New Class</h1>
      <form className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Class Title</label>
          <input
            type="text"
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            placeholder="Enter class title"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Subject</label>
          <input
            type="text"
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            placeholder="Enter subject"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Duration</label>
          <input
            type="text"
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            placeholder="Enter class duration"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Time</label>
          <input
            type="text"
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            placeholder="Enter class time"
          />
        </div>
        <div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md">Create Class</button>
        </div>
      </form>
    </div>
  );
};

export default CreateClassPage;
