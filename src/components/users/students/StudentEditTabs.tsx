"use client";

import React from "react";
import { FiUpload } from "react-icons/fi";
import { Calendar, Heart, Mail, Phone, School, User, UserCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RosterClass } from "@/hooks/users/useRosterClasses";
import { GENDERS, PARENT_RELATIONSHIPS, type StudentDraft } from "@/hooks/users/useStudentEditor";

type SetField = <K extends keyof StudentDraft>(field: K, value: StudentDraft[K]) => void;

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {label}
      </span>
      {children}
    </div>
  );
}

function TabHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
        <p className="text-gray-600 dark:text-slate-400 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

/** Name, contact, date of birth, gender and the profile photo. */
export function StudentEditPersonalTab({
  draft,
  setField,
  onPhotoSelected,
  isUploading,
}: {
  draft: StudentDraft;
  setField: SetField;
  onPhotoSelected: (file: File) => void;
  isUploading: boolean;
}) {
  return (
    <div className="space-y-8">
      <TabHeader title="Personal Information" subtitle="Edit the student's personal details" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <Avatar className="w-32 h-32 ring-4 ring-gray-100 dark:ring-slate-700">
              <AvatarImage src={draft.userAvatar || "/placeholder.svg"} alt={`${draft.firstName} ${draft.lastName}`} />
              <AvatarFallback className="bg-blue-500 text-white text-2xl font-semibold">
                {draft.firstName?.[0]}
                {draft.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              aria-label="Upload a new profile photo"
              disabled={isUploading}
              onClick={() => document.getElementById("photoInput")?.click()}
              className="absolute bottom-2 right-2 w-8 h-8 bg-blue-500 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center hover:bg-blue-600 transition-colors disabled:opacity-60"
            >
              <FiUpload className="w-4 h-4 text-white" />
            </button>
            <input
              type="file"
              id="photoInput"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onPhotoSelected(file);
                event.target.value = "";
              }}
            />
          </div>

          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {draft.firstName} {draft.lastName}
            </h3>
            <p className="text-gray-600 dark:text-slate-400 mt-1">
              {isUploading ? "Uploading photo…" : "Student"}
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field icon={User} label="First Name">
            <Input
              value={draft.firstName}
              onChange={(e) => setField("firstName", e.target.value)}
              placeholder="Enter first name"
            />
          </Field>
          <Field icon={User} label="Last Name">
            <Input
              value={draft.lastName}
              onChange={(e) => setField("lastName", e.target.value)}
              placeholder="Enter last name"
            />
          </Field>
          <Field icon={Mail} label="Email Address">
            <Input
              type="email"
              value={draft.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="Enter email address"
            />
          </Field>
          <Field icon={Phone} label="Phone Number">
            <Input
              value={draft.phoneNumber}
              onChange={(e) => setField("phoneNumber", e.target.value)}
              placeholder="Enter phone number"
            />
          </Field>
          <Field icon={Calendar} label="Date of Birth">
            <Input
              type="date"
              value={draft.dateOfBirth}
              onChange={(e) => setField("dateOfBirth", e.target.value)}
            />
          </Field>
          <Field icon={UserCheck} label="Gender">
            <Select value={draft.gender} onValueChange={(value) => setField("gender", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {GENDERS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>
    </div>
  );
}

/** The guardian's name, relationship and contact details. */
export function StudentEditGuardianTab({ draft, setField }: { draft: StudentDraft; setField: SetField }) {
  return (
    <div className="space-y-8">
      <TabHeader
        title="Parent/Guardian Information"
        subtitle="Edit contact information for the student's parent or guardian"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field icon={User} label="Full Name">
          <Input
            value={draft.parentFullName}
            onChange={(e) => setField("parentFullName", e.target.value)}
            placeholder="Enter parent/guardian full name"
          />
        </Field>
        <Field icon={Heart} label="Relationship">
          <Select
            value={draft.relationship}
            onValueChange={(value) => setField("relationship", value as StudentDraft["relationship"])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select relationship" />
            </SelectTrigger>
            <SelectContent>
              {PARENT_RELATIONSHIPS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field icon={Phone} label="Phone Number">
          <Input
            value={draft.parentPhone}
            onChange={(e) => setField("parentPhone", e.target.value)}
            placeholder="Enter phone number"
          />
        </Field>
        <Field icon={Mail} label="Email Address">
          <Input
            type="email"
            value={draft.parentEmail}
            onChange={(e) => setField("parentEmail", e.target.value)}
            placeholder="Enter email address"
          />
        </Field>
      </div>
    </div>
  );
}

/** Class assignment and account status. */
export function StudentEditSettingsTab({
  draft,
  setField,
  classes,
}: {
  draft: StudentDraft;
  setField: SetField;
  classes: RosterClass[];
}) {
  return (
    <div className="space-y-8">
      <TabHeader title="Student Settings" subtitle="Manage the student's class and account status" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field icon={School} label="Class">
          <Select value={draft.classId} onValueChange={(value) => setField("classId", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls._id} value={cls._id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field icon={UserCheck} label="Account Status">
          <Select
            value={draft.isActive ? "active" : "inactive"}
            onValueChange={(value) => setField("isActive", value === "active")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Actions</h3>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-lg">
            <h4 className="text-red-800 dark:text-red-300 font-semibold mb-2">Danger Zone</h4>
            <p className="text-red-600 dark:text-red-400 text-sm mb-4">
              Deactivating stops the student signing in. Their records are kept, and you can
              reactivate them here at any time. The change is applied when you save.
            </p>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
              disabled={!draft.isActive}
              onClick={() => {
                if (window.confirm("Are you sure you want to deactivate this student account?")) {
                  setField("isActive", false);
                }
              }}
            >
              Deactivate Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
