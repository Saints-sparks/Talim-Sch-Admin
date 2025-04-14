"use client";

import { Header } from "@/components/Header";
import StudentGrid from "@/components/TeacherGrid";
import { use } from "react";

const StudentPage: React.FC = () => {
  const text = "Student Overview";
  const tent = "View detailed information and progress for each student.";
  return (
    <div className="p-6 space-y-1 bg-[F8F8F8]">
      <Header />
      <StudentGrid />
    </div>
  );
};
export default StudentPage;
