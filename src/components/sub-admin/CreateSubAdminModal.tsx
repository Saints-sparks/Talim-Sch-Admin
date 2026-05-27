"use client";

import React, { useState } from "react";
import { UserPlus, Loader2 } from "lucide-react";
import TalimModal from "@/components/ui/TalimModal";
import { PermissionSelector } from "./PermissionSelector";
import {
  subAdminService,
  CreateSubAdminDto,
  SubAdmin,
} from "@/services/subAdminService";
import { toast } from "@/components/CustomToast";

interface CreateSubAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (subAdmin: SubAdmin) => void;
}

export function CreateSubAdminModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateSubAdminModalProps) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
  });
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.firstName.trim()) errs.firstName = "First name is required";
    if (!form.lastName.trim()) errs.lastName = "Last name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Enter a valid email address";
    if (permissions.length === 0)
      errs.permissions = "Select at least one permission";
    return errs;
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setForm({ firstName: "", lastName: "", email: "", phoneNumber: "" });
    setPermissions([]);
    setErrors({});
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSubmitting(true);
    try {
      const dto: CreateSubAdminDto = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        permissions,
        ...(form.phoneNumber.trim() && { phoneNumber: form.phoneNumber.trim() }),
      };
      const created = await subAdminService.createSubAdmin(dto);
      const name = `${created.firstName} ${created.lastName}`;
      if (created.temporaryPassword) {
        toast.success(
          `Sub-admin created for ${name}. Temporary password: ${created.temporaryPassword}`
        );
      } else {
        toast.success(`Sub-admin account created for ${name}`);
      }
      onSuccess(created);
      handleClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to create sub-admin");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TalimModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Sub-Admin"
      subtitle="Set up a new sub-admin account with specific responsibilities"
      icon={<UserPlus className="w-5 h-5 text-white" />}
      isSubmitting={isSubmitting}
      footer={
        <div className="flex justify-end gap-3 px-8 py-5 border-t border-gray-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || permissions.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#003366] text-white text-sm font-medium hover:bg-[#002244] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating…
              </>
            ) : (
              "Create Sub-Admin"
            )}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
        {/* Personal info */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Personal Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => {
                  setForm((f) => ({ ...f, firstName: e.target.value }));
                  if (errors.firstName)
                    setErrors((er) => ({ ...er, firstName: "" }));
                }}
                placeholder="John"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.firstName ? "border-red-400" : "border-gray-200"
                }`}
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => {
                  setForm((f) => ({ ...f, lastName: e.target.value }));
                  if (errors.lastName)
                    setErrors((er) => ({ ...er, lastName: "" }));
                }}
                placeholder="Doe"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.lastName ? "border-red-400" : "border-gray-200"
                }`}
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => {
                setForm((f) => ({ ...f, email: e.target.value }));
                if (errors.email) setErrors((er) => ({ ...er, email: "" }));
              }}
              placeholder="john.doe@school.com"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? "border-red-400" : "border-gray-200"
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Phone Number{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="tel"
              value={form.phoneNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, phoneNumber: e.target.value }))
              }
              placeholder="+234 800 000 0000"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Permissions */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            Assign Permissions *
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Choose which areas of the portal this sub-admin can access and
            manage.
          </p>
          {errors.permissions && (
            <p className="text-red-500 text-xs mb-2">{errors.permissions}</p>
          )}
          <PermissionSelector
            selected={permissions}
            onChange={(p) => {
              setPermissions(p);
              if (errors.permissions)
                setErrors((er) => ({ ...er, permissions: "" }));
            }}
          />
        </div>
      </form>
    </TalimModal>
  );
}
