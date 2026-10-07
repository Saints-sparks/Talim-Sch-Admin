"use client";

import React, { useState, useEffect } from "react";
import { GraduationCap, Loader2, Search } from "lucide-react";
import TalimModal from "@/components/ui/TalimModal";
import { PermissionSelector } from "./PermissionSelector";
import { subAdminService, PromoteTeacherDto, SubAdmin } from "@/app/services/sub-admin.service";
import { toast } from "@/components/CustomToast";
import { apiClient, unwrapEnvelope } from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/apiError";
import { API_ENDPOINTS } from "@/app/lib/api/config";
import type { PermissionValue } from "@/lib/permissions";

interface Teacher {
  userId: string;
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  userAvatar?: string;
}

interface PromoteTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (subAdmin: SubAdmin) => void;
}

export function PromoteTeacherModal({ isOpen, onClose, onSuccess }: PromoteTeacherModalProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [permissions, setPermissions] = useState<PermissionValue[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load teachers when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setLoadingTeachers(true);
      try {
        const res = await apiClient.get(API_ENDPOINTS.GET_TEACHERS);
        if (res.ok) {
          const data = unwrapEnvelope<unknown>(await res.json()) as
            | Teacher[]
            | { data?: Teacher[] };
          // API may return { data: Teacher[] } or Teacher[]
          setTeachers(Array.isArray(data) ? data : (data.data ?? []));
        }
      } catch {
        // silent — teachers list is non-critical
      } finally {
        setLoadingTeachers(false);
      }
    };
    load();
  }, [isOpen]);

  const filteredTeachers = teachers.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.firstName.toLowerCase().includes(q) ||
      t.lastName.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q)
    );
  });

  const handleClose = () => {
    if (isSubmitting) return;
    setSearchQuery("");
    setSelectedTeacher(null);
    setPermissions([]);
    setErrors({});
    onClose();
  };

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    if (!selectedTeacher) errs.teacher = "Please select a teacher";
    if (permissions.length === 0) errs.permissions = "Select at least one permission";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSubmitting(true);
    try {
      const dto: PromoteTeacherDto = {
        userId: selectedTeacher!.userId,
        permissions,
      };
      const promoted = await subAdminService.promoteTeacher(dto);
      toast.success(`${promoted.firstName} ${promoted.lastName} has been promoted to sub-admin`);
      onSuccess(promoted);
      handleClose();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to promote teacher"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TalimModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Promote Teacher to Sub-Admin"
      subtitle="Assign an existing teacher additional administrative responsibilities"
      icon={<GraduationCap className="w-5 h-5 text-white" />}
      isSubmitting={isSubmitting}
      footer={
        <div className="flex justify-end gap-3 px-8 py-5 border-t border-tl-line-soft">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl border border-tl-line text-tl-body text-sm font-medium hover:bg-tl-bg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedTeacher || permissions.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-tl-brand-fill text-white text-sm font-medium hover:bg-tl-brand-fill-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Promoting…
              </>
            ) : (
              "Promote Teacher"
            )}
          </button>
        </div>
      }
    >
      <div className="px-8 py-6 space-y-6">
        {/* Teacher selection */}
        <div>
          <h3 className="text-sm font-semibold text-tl-body mb-3">Select Teacher</h3>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tl-faint" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-tl-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-tl-link"
            />
          </div>

          {errors.teacher && <p className="text-tl-danger text-xs mb-2">{errors.teacher}</p>}

          {/* Teacher list */}
          <div className="border border-tl-line rounded-lg overflow-hidden max-h-48 overflow-y-auto">
            {loadingTeachers ? (
              <div className="flex items-center justify-center py-8 text-tl-faint">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading teachers…
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="text-center py-8 text-sm text-tl-faint">
                {searchQuery ? "No teachers match your search" : "No teachers found"}
              </div>
            ) : (
              filteredTeachers.map((teacher) => {
                const isSelected = selectedTeacher?.userId === teacher.userId;
                return (
                  <button
                    key={teacher.userId}
                    type="button"
                    onClick={() => {
                      setSelectedTeacher(teacher);
                      if (errors.teacher) setErrors((er) => ({ ...er, teacher: "" }));
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-tl-line-soft last:border-0 ${
                      isSelected ? "bg-tl-select text-tl-link" : "hover:bg-tl-bg text-tl-body"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-tl-line flex items-center justify-center shrink-0 text-xs font-semibold text-tl-muted overflow-hidden">
                      {teacher.userAvatar ? (
                        <img
                          src={teacher.userAvatar}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        `${teacher.firstName[0]}${teacher.lastName[0]}`
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {teacher.firstName} {teacher.lastName}
                      </p>
                      <p className="text-xs text-tl-faint truncate">{teacher.email}</p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-tl-brand-fill flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-white">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {selectedTeacher && (
            <div className="mt-2 px-3 py-2 bg-tl-select rounded-lg text-xs text-tl-link">
              Selected:{" "}
              <span className="font-semibold">
                {selectedTeacher.firstName} {selectedTeacher.lastName}
              </span>{" "}
              — They will retain their teacher role in the teacher portal.
            </div>
          )}
        </div>

        {/* Permissions */}
        <div>
          <h3 className="text-sm font-semibold text-tl-body mb-1">Assign Permissions *</h3>
          <p className="text-xs text-tl-muted mb-3">
            Choose which areas of the admin portal this teacher can also access.
          </p>
          {errors.permissions && (
            <p className="text-tl-danger text-xs mb-2">{errors.permissions}</p>
          )}
          <PermissionSelector
            selected={permissions}
            onChange={(p) => {
              setPermissions(p);
              if (errors.permissions) setErrors((er) => ({ ...er, permissions: "" }));
            }}
          />
        </div>
      </div>
    </TalimModal>
  );
}
