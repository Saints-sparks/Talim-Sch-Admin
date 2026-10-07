/**
 * `/profile` → the signed-in administrator's own account: their photo, their
 * personal details and the change-password card.
 *
 * Every admin role may edit their own account, so nothing here is permission
 * gated. The email is read-only — `UpdateUserProfilePayload` has no email
 * field, and the sign-in address is changed through account recovery.
 */
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Camera, Mail, Phone, Shield, User } from "lucide-react";
import { toast } from "@/components/CustomToast";
import { Tooltip } from "@/components/ui/Tooltip";
import ChangePasswordCard from "@/components/auth/ChangePasswordCard";
import { ProfileCardHeader, ProfileField, ProfileSaveBar } from "@/components/profile/ProfileAtoms";
import { useProfileImage } from "@/components/profile/useProfileImage";
import { useSaveAdminDetails, type AdminDetails } from "@/components/profile/useProfileData";

/** The fields this card lets the administrator change. */
type EditableAdmin = Pick<AdminDetails, "firstName" | "lastName" | "phone">;

/**
 * Rejects details the API would reject, before they are sent.
 *
 * @param form - The details as typed.
 * @returns The problem, or `null` when they are valid.
 */
export function adminDetailsProblem(form: EditableAdmin): string | null {
  if (!form.firstName.trim()) return "First name is required";
  if (!form.lastName.trim()) return "Last name is required";
  if (!form.phone.trim()) return "Phone number is required";
  return null;
}

/**
 * @param props.admin - The administrator's details as the server has them.
 * @returns The administrator card.
 */
export function AdminDetailsCard({ admin }: { admin: AdminDetails }) {
  const { save, saveAvatar, saving } = useSaveAdminDetails();
  const avatar = useProfileImage("profile/avatar", admin.avatar, (url) => saveAvatar(url));

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditableAdmin>({
    firstName: admin.firstName,
    lastName: admin.lastName,
    phone: admin.phone,
  });

  // Take the server's values whenever they change and nothing is being edited,
  // so a save elsewhere (Settings → Admin Account) is reflected here.
  useEffect(() => {
    if (editing) return;
    setForm({ firstName: admin.firstName, lastName: admin.lastName, phone: admin.phone });
  }, [editing, admin.firstName, admin.lastName, admin.phone]);

  const set = (field: keyof EditableAdmin) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const initials = `${form.firstName?.[0] ?? ""}${form.lastName?.[0] ?? ""}`.toUpperCase() || "AD";
  const fullName = [form.firstName, form.lastName].filter(Boolean).join(" ") || "Administrator";

  const handleSave = async () => {
    const problem = adminDetailsProblem(form);
    if (problem) {
      toast.error(problem);
      return;
    }
    if (avatar.busy) {
      toast.error("Please wait for the image upload to finish");
      return;
    }
    await save(form);
    setEditing(false);
  };

  return (
    <>
      {/* Hero row: photo and name */}
      <div className="flex flex-col sm:flex-row items-start gap-6">
        <div className="relative flex-shrink-0">
          <div className="w-24 h-24 rounded-full bg-tl-brand-fill flex items-center justify-center overflow-hidden border-4 border-tl-surface shadow-lg">
            {avatar.preview ? (
              <Image
                src={avatar.preview}
                alt="Administrator photo"
                width={96}
                height={96}
                className="object-cover w-full h-full"
                unoptimized
              />
            ) : (
              <span className="text-white text-2xl font-bold">{initials}</span>
            )}
          </div>
          {avatar.busy && (
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
              <span className="text-white text-xs font-medium">{avatar.progress}%</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold text-tl-ink">{fullName}</h2>
            <p className="text-tl-muted text-sm flex items-center gap-1.5 mt-0.5">
              <Shield className="w-3.5 h-3.5" />
              School Administrator
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Tooltip
              content="Shown alongside your name in messages, announcements, and leave request responses."
              side="top"
            >
              <label
                htmlFor="admin-avatar-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-tl-brand-fill text-white text-sm font-medium rounded-lg cursor-pointer hover:bg-tl-brand-fill-hover transition"
              >
                <Camera className="w-4 h-4" />
                Change Photo
                <input
                  id="admin-avatar-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={avatar.onFileChange}
                />
              </label>
            </Tooltip>
            {avatar.preview && (
              <button
                type="button"
                onClick={avatar.remove}
                disabled={avatar.busy}
                className="px-4 py-2 text-sm font-medium text-tl-danger border border-tl-danger/30 rounded-lg hover:bg-tl-danger-bg transition disabled:opacity-50"
              >
                Remove Photo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Details card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-tl-surface rounded-xl border border-tl-line shadow-sm overflow-hidden"
      >
        <ProfileCardHeader
          title="Personal Information"
          editing={editing}
          canEdit
          onToggle={() => setEditing((was) => !was)}
        />

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ProfileField
              label="First Name"
              icon={User}
              value={form.firstName}
              editing={editing}
              placeholder="First name"
              onChange={set("firstName")}
            />
            <ProfileField
              label="Last Name"
              icon={User}
              value={form.lastName}
              editing={editing}
              placeholder="Last name"
              onChange={set("lastName")}
            />
            <ProfileField
              label="Email Address"
              icon={Mail}
              value={admin.email}
              type="email"
              editing={false}
              note="Your sign-in email can't be changed here."
            />
            <ProfileField
              label="Phone Number"
              icon={Phone}
              value={form.phone}
              type="tel"
              editing={editing}
              placeholder="Phone number"
              onChange={set("phone")}
            />
          </div>

          <div className="mt-6 border-t border-tl-line-soft pt-6">
            <ChangePasswordCard />
          </div>

          {editing && (
            <ProfileSaveBar
              saving={saving}
              blocked={avatar.busy}
              onSave={() => void handleSave()}
              onCancel={() => setEditing(false)}
            />
          )}
        </div>
      </motion.div>
    </>
  );
}
