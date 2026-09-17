"use client";

import React from "react";
import {
  Badge,
  BookOpen,
  Calendar,
  GraduationCap,
  Heart,
  Mail,
  Phone,
  School,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import type { StudentById } from "@/app/services/student.service";
import { DetailField, localDate, StudentIdentityCard, TabHeading } from "./profileAtoms";

const gridClass = "lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 order-2 lg:order-none";
const sectionClass = "grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8";

/** Personal details: name, contact, date of birth and gender. */
export function StudentPersonalTab({ student }: { student: StudentById }) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <TabHeading icon={User} title="Personal Information" tone="blue" />
      <div className={sectionClass}>
        <StudentIdentityCard
          student={student}
          tone="blue"
          badge={student.isActive ? "Active" : "Inactive"}
        />
        <div className={gridClass}>
          <DetailField icon={User} label="First Name" value={student.userId.firstName || "Not specified"} />
          <DetailField icon={User} label="Last Name" value={student.userId.lastName || "Not specified"} />
          <DetailField icon={Mail} label="Email Address" value={student.userId.email || "Not specified"} />
          <DetailField
            icon={Phone}
            label="Phone Number"
            value={student.userId.phoneNumber || "Not specified"}
          />
          <DetailField icon={Calendar} label="Date of Birth" value={localDate(student.userId.dateOfBirth)} />
          <DetailField icon={UserCheck} label="Gender" value={student.userId.gender || "Not specified"} />
        </div>
      </div>
    </div>
  );
}

/** The guardian the student was enrolled with. */
export function StudentGuardianTab({ student }: { student: StudentById }) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <TabHeading icon={Users} title="Parent/Guardian Information" tone="green" />
      <div className={sectionClass}>
        <StudentIdentityCard
          student={student}
          tone="green"
          badge={student.isActive ? "Active" : "Inactive"}
        />
        <div className={gridClass}>
          <DetailField
            icon={User}
            label="Full Name"
            value={student.parentContact?.fullName || "Not specified"}
          />
          <DetailField
            icon={Heart}
            label="Relationship"
            value={student.parentContact?.relationship || "Not specified"}
          />
          <DetailField
            icon={Phone}
            label="Phone Number"
            value={student.parentContact?.phoneNumber || "Not specified"}
          />
          <DetailField
            icon={Mail}
            label="Email Address"
            value={student.parentContact?.email || "Not specified"}
          />
        </div>
      </div>
    </div>
  );
}

/** Admission number, class, grade level, enrolment date and subjects. */
export function StudentAcademicTab({ student }: { student: StudentById }) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <TabHeading icon={BookOpen} title="Academic Information" tone="purple" />
      <div className={sectionClass}>
        <StudentIdentityCard
          student={student}
          tone="purple"
          badge={student.classId?.name || "No Class Assigned"}
        />
        <div className={gridClass}>
          <DetailField
            icon={Badge}
            label="Admission Number"
            value={student.admissionNumber || "Not assigned"}
            mono
          />
          <DetailField icon={School} label="Class" value={student.classId?.name || "Not assigned"} />
          <DetailField
            icon={GraduationCap}
            label="Grade Level"
            value={student.gradeLevel || "Not specified"}
          />
          <DetailField icon={Calendar} label="Enrollment Date" value={localDate(student.enrollmentDate)} />
          <DetailField
            icon={BookOpen}
            label="Assigned Subjects"
            className="sm:col-span-2"
            value={
              student.assignedSubjects && student.assignedSubjects.length > 0
                ? student.assignedSubjects.join(", ")
                : "No subjects assigned"
            }
          />
        </div>
      </div>
    </div>
  );
}
