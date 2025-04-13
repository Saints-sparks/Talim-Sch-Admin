// FloatingHeader.tsx
'use client';
import { Class } from '@/app/services/student.service';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface FloatingHeaderProps {
  selectedClass: string;
  onSelectClass: (selected: string) => void;
  classList: Class[];
}

const FloatingHeader: React.FC<FloatingHeaderProps> = ({
  selectedClass,
  onSelectClass,
  classList,
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
          {classList.map((cls) => (
            <option key={cls._id} value={cls._id}>
              {cls.name}
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
