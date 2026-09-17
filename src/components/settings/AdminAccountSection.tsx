"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Camera, Loader2, Lock, Pencil } from "lucide-react";
import { useAdminProfile, useUpdateAdminAvatar, useUpdateAdminProfile } from "@/hooks/settings/useAdminProfile";
import { useImageUpload } from "@/hooks/settings/useImageUpload";
import { useAuth } from "@/context/AuthContext";
import { ChangePasswordModal } from "@/components/settings/ChangePasswordModal";
import {
  Card,
  CardHeader,
  InputField,
  OutlineBtn,
  PrimaryBtn,
  ReadOnlyField,
  SectionHeader,
  SectionSkeleton,
} from "@/components/settings/ui";

const TITLE = "Admin Profile";
const DESC = "Manage your personal profile and preferences";

interface AdminForm {
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

/**
 * Settings → Admin Profile: the signed-in administrator's own picture, name,
 * phone number and password. Every admin role may edit their own account, so
 * nothing here is gated on `manage:settings`.
 */
export function AdminAccountSection() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useAdminProfile();
  const { save, saving } = useUpdateAdminProfile();
  const avatar = useUpdateAdminAvatar();
  const [editing, setEditing] = useState(false);
  const [showPwModal, setShowPwModal] = useState(false);
  const [form, setForm] = useState<AdminForm>({ firstName: "", lastName: "", phoneNumber: "" });
  const avatarRef = useRef<HTMLInputElement>(null);

  const { uploading, onFileChange } = useImageUpload("settings/avatar", (url) => avatar.save(url));

  // Seed from the session user straight away, then from the fetched profile.
  useEffect(() => {
    const source = profile ?? user;
    if (!source) return;
    setForm({
      firstName: source.firstName || "",
      lastName: source.lastName || "",
      phoneNumber: source.phoneNumber || "",
    });
  }, [profile, user]);

  // The session user covers the first paint; the query only fills in the rest.
  if (isLoading && !user) return <SectionSkeleton title={TITLE} desc={DESC} />;

  const firstName = profile?.firstName ?? user?.firstName ?? "";
  const lastName = profile?.lastName ?? user?.lastName ?? "";
  const email = profile?.email ?? user?.email ?? "";
  const phoneNumber = profile?.phoneNumber ?? user?.phoneNumber ?? "";
  const role = (profile?.role ?? user?.role ?? "school_admin").replace(/_/g, " ");
  const userAvatar = user?.userAvatar ?? profile?.userAvatar ?? "";
  const lastLogin = profile?.lastLogin;
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    try {
      await save({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumber: form.phoneNumber.trim(),
      });
      setEditing(false);
    } catch {
      // Reported by the mutation; keep the form open so nothing is lost.
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader title={TITLE} desc={DESC} />

      <Card>
        <CardHeader title="Profile Picture" />
        <div className="p-5 flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-2 border-gray-200 dark:border-slate-600 flex items-center justify-center bg-[#EBF0F7] dark:bg-slate-700 overflow-hidden">
              {userAvatar ? (
                <img src={userAvatar} alt="Your profile picture" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-[#003366] dark:text-blue-300">{initials || "A"}</span>
              )}
            </div>
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            )}
          </div>
          <div>
            <input
              ref={avatarRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={onFileChange}
            />
            <OutlineBtn onClick={() => avatarRef.current?.click()} disabled={uploading}>
              <Camera className="w-4 h-4" />
              {uploading ? "Uploading…" : "Change Picture"}
            </OutlineBtn>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1.5">PNG, JPG — max 2MB</p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Profile Information"
          action={
            editing ? (
              <div className="flex gap-2">
                <OutlineBtn onClick={() => setEditing(false)} disabled={saving}>
                  Cancel
                </OutlineBtn>
                <PrimaryBtn
                  onClick={handleSave}
                  loading={saving}
                  disabled={!form.firstName.trim() || !form.lastName.trim()}
                >
                  Save Changes
                </PrimaryBtn>
              </div>
            ) : (
              <OutlineBtn onClick={() => setEditing(true)}>
                <Pencil className="w-3.5 h-3.5" /> Edit
              </OutlineBtn>
            )
          }
        />
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {editing ? (
              <>
                <InputField
                  label="First Name"
                  value={form.firstName}
                  onChange={(v) => setForm({ ...form, firstName: v })}
                  required
                  error={form.firstName.trim() ? undefined : "First name is required"}
                />
                <InputField
                  label="Last Name"
                  value={form.lastName}
                  onChange={(v) => setForm({ ...form, lastName: v })}
                  required
                  error={form.lastName.trim() ? undefined : "Last name is required"}
                />
                <InputField
                  label="Phone Number"
                  value={form.phoneNumber}
                  onChange={(v) => setForm({ ...form, phoneNumber: v })}
                />
                <ReadOnlyField label="Email" value={email} />
              </>
            ) : (
              <>
                <ReadOnlyField label="Full Name" value={`${firstName} ${lastName}`.trim()} />
                <ReadOnlyField label="Email" value={email} />
                <ReadOnlyField label="Phone Number" value={phoneNumber || "Not set"} />
                <ReadOnlyField label="Role" value={role} />
              </>
            )}
          </div>
          {lastLogin && (
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Last login: {new Date(lastLogin).toLocaleString()}
            </p>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Account Security" />
        <div className="p-5">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-slate-200">Password</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">Update your account password</p>
            </div>
            <OutlineBtn onClick={() => setShowPwModal(true)}>
              <Lock className="w-3.5 h-3.5" /> Change Password
            </OutlineBtn>
          </div>
        </div>
      </Card>

      <AnimatePresence>
        {showPwModal && <ChangePasswordModal onClose={() => setShowPwModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
