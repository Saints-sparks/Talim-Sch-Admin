'use client';
import React from 'react';

interface FloatingHeaderProps {
  classes: string[];
  selectedClass: string;
  onSelectClass: (selected: string) => void;
}

const FloatingHeader: React.FC<FloatingHeaderProps> = ({
  classes,
  selectedClass,
  onSelectClass,
}) => {
  return (
    <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0">
    <div className="text-2xl font-medium text-gray-700">Curriculum</div>
  
    <div className="flex items-center gap-3">
      <select
        className="border px-3 py-2 rounded-md text-gray-700 bg-white text-sm"
        value={selectedClass}
        onChange={(e) => onSelectClass(e.target.value)}
      >
        <option value="">Select a class</option>
        {classes.map((className) => (
          <option key={className} value={className}>
            {className}
          </option>
        ))}
      </select>
  
      <button className="bg-[#154473] hover:bg-blue-900 text-white px-3 py-2 rounded-md text-sm">
        <span className="hidden sm:inline">+ Add Class</span>
        <span className="sm:hidden">+ Class</span>
      </button>
    </div>
  </div>  
  );
};

export default FloatingHeader;
