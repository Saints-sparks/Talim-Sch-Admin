"use client";

import React from "react";
import {
  Award,
  Badge,
  BookOpen,
  Briefcase,
  Clock,
  GraduationCap,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tooltip } from "@/components/ui/Tooltip";
import type { TeacherById } from "@/app/services/teacher.service";
import {
  AccentField,
  orNotRecorded,
  PlainField,
  ProfileCircle,
  ProfileHeading,
  tabFieldsClass,
  tabGridClass,
} from "./teacherProfileAtoms";

/** Name, staff number, contact details and account status. */
export function TeacherPersonalTab({ teacher }: { teacher: TeacherById }) {
  const isActive = teacher.userId.isActive;

  return (
    <div className="space-y-6 sm:space-y-8">
      <ProfileHeading icon={User} title="Personal Details" tone="blue" />

      <div className={tabGridClass}>
        <div className="flex flex-col items-center space-y-4 order-1 lg:order-1">
          <div className="text-center">
            <Label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-4 block">
              Profile Picture
            </Label>
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg mx-auto">
                <span className="text-xl sm:text-3xl font-bold text-white">
                  {teacher.userId.firstName?.[0] || "T"}
                  {teacher.userId.lastName?.[0] || ""}
                </span>
              </div>
              <div className="absolute -bottom-2 -right-2">
                <div
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center ${
                    isActive ? "bg-green-500" : "bg-gray-400"
                  }`}
                >
                  {isActive && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full" />}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                {teacher.userId.firstName} {teacher.userId.lastName}
              </h3>
              {teacher.isFormTeacher && (
                <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm rounded-full font-medium">
                  <Badge className="w-3 h-3" />
                  Form Teacher
                </span>
              )}
              <div className="flex items-center justify-center gap-1">
                <span className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-gray-400"}`} />
                <span
                  className={`text-xs font-medium ${
                    isActive ? "text-green-700 dark:text-green-400" : "text-gray-500 dark:text-slate-400"
                  }`}
                >
                  {isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={tabFieldsClass}>
          <PlainField icon={Badge} label="Staff Number" value={teacher.staffNumber || "Not assigned"} mono />
          <PlainField icon={User} label="First Name" value={orNotRecorded(teacher.userId.firstName)} />
          <PlainField icon={User} label="Last Name" value={orNotRecorded(teacher.userId.lastName)} />
          <PlainField icon={Phone} label="Phone Number" value={orNotRecorded(teacher.userId.phoneNumber)} />
          <PlainField icon={Mail} label="Email Address" value={orNotRecorded(teacher.userId.email)} />
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
              <Badge className="w-4 h-4" />
              Account Status
            </Label>
            <div className="bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-lg px-4 py-3">
              <span
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                  isActive
                    ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                    : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"}`} />
                {isActive ? "Active Account" : "Inactive Account"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Highest qualification, years of experience and specialization. */
export function TeacherQualificationsTab({ teacher }: { teacher: TeacherById }) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <ProfileHeading icon={GraduationCap} title="Qualifications & Experience" tone="emerald" />

      <div className={tabGridClass}>
        <ProfileCircle icon={GraduationCap} tone="emerald" label="Academic Profile">
          <div className="text-center space-y-1">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              {orNotRecorded(teacher.specialization)}
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-400">Specialization</p>
          </div>
        </ProfileCircle>

        <div className={tabFieldsClass}>
          <div className="space-y-3">
            <Tooltip content="Academic credential. For record-keeping only." side="right">
              <div>
                <AccentField
                  icon={Award}
                  label="Highest Qualification"
                  tone="emerald"
                  value={orNotRecorded(teacher.highestAcademicQualification)}
                />
              </div>
            </Tooltip>
          </div>
          <AccentField
            icon={Clock}
            label="Teaching Experience"
            tone="blue"
            value={
              <span className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold">{teacher.yearsOfExperience ?? 0}</span>
                <span className="font-medium">years</span>
              </span>
            }
          />
          <AccentField
            icon={BookOpen}
            label="Subject Expertise"
            tone="purple"
            className="sm:col-span-2"
            value={orNotRecorded(teacher.specialization)}
            caption="Primary teaching subject"
          />
        </div>
      </div>
    </div>
  );
}

/** Employment type and role. */
export function TeacherEmploymentTab({ teacher }: { teacher: TeacherById }) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <ProfileHeading icon={Briefcase} title="Employment Details" tone="amber" />

      <div className={tabGridClass}>
        <ProfileCircle icon={Briefcase} tone="amber" label="Employment Status">
          <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs sm:text-sm rounded-full font-medium">
            <Briefcase className="w-3 h-3" />
            {orNotRecorded(teacher.employmentType)}
          </span>
        </ProfileCircle>

        <div className={tabFieldsClass}>
          <AccentField
            icon={Clock}
            label="Employment Type"
            tone="amber"
            value={orNotRecorded(teacher.employmentType)}
            caption="Work schedule"
          />
          <AccentField
            icon={Badge}
            label="Employment Role"
            tone="blue"
            value={orNotRecorded(teacher.employmentRole)}
            caption="Position type"
          />
        </div>
      </div>
    </div>
  );
}
