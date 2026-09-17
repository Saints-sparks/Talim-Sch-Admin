"use client";

import React from "react";
import { motion } from "framer-motion";
import Avatar from "@/components/Avatar";
import type { Student } from "@/app/services/student.service";

interface StudentRosterCardProps {
  /** The student to show. */
  student: Student;
  /** Position in the grid, used only to stagger the entry animation. */
  index: number;
  /** Opens the student's profile. */
  onViewProfile: (studentId: string) => void;
}

/** One card in the students grid. */
export function StudentRosterCard({ student, index, onViewProfile }: StudentRosterCardProps) {
  return (
    <motion.div
      className="bg-white dark:bg-slate-800 rounded-2xl w-[266px] border border-[#F0F0F0] dark:border-slate-700 p-6 flex flex-col items-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.03, duration: 0.2 }}
    >
      <Avatar
        src={student.userId.userAvatar}
        firstName={student.userId.firstName}
        lastName={student.userId.lastName}
        className="w-[80px] h-[80px] flex-shrink-0"
      />
      <div className="mt-4 text-center leading-[120%] flex flex-col items-center flex-1 w-full">
        <div className="font-semibold text-[15px] text-gray-900 dark:text-white">
          {student.userId.firstName} {student.userId.lastName}
        </div>
        <div className="mt-2 text-[12px] font-medium text-[#003366] dark:text-blue-400">
          ID {student.admissionNumber || "Not assigned"}
        </div>
        <div className="flex justify-center gap-1 mt-2">
          <span className="bg-[#F2F2F2] dark:bg-slate-700 border border-[#E0E0E0] dark:border-slate-600 text-[12px] text-gray-700 dark:text-slate-200 px-3 py-1 rounded-xl">
            {student.gradeLevel}
          </span>
          <span
            className={`text-[12px] font-semibold px-2 py-1 border rounded-xl ${
              student.isActive
                ? "border-[#003366]/30 text-[#003366] bg-[#003366]/10 dark:border-blue-500/40 dark:text-blue-300 dark:bg-blue-500/10"
                : "border-gray-300 text-gray-500 bg-gray-100 dark:border-slate-600 dark:text-slate-400 dark:bg-slate-700"
            }`}
          >
            {student.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <button
          onClick={() => onViewProfile(student._id)}
          className="mt-auto pt-4 w-full bg-[#F2F2F2] dark:bg-slate-700 border border-[#E0E0E0] dark:border-slate-600 hover:border-blue-400 text-gray-800 dark:text-slate-100 font-semibold py-2 rounded-xl transition-colors text-sm"
        >
          View Profile
        </button>
      </div>
    </motion.div>
  );
}

export default StudentRosterCard;
