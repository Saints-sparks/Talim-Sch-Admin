"use client";
import React from "react";

type Subject = {
  _id: string;
  name: string;
  code: string;
};

type Props = {
  subjects: Subject[];
  onDelete: (id: string) => void;
};

const SubjectList: React.FC<Props> = ({ subjects, onDelete }) => {
  return (
    <div className="border rounded">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-3">Name</th>
            <th className="p-3">Code</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((subject) => (
            <tr key={subject._id} className="border-t">
              <td className="p-3">{subject.name}</td>
              <td className="p-3">{subject.code}</td>
              <td className="p-3">
                <button
                  onClick={() => onDelete(subject._id)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
                {/* TODO: Add link to view courses */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SubjectList;
