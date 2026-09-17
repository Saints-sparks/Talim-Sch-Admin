"use client";

import React, { useEffect, useRef, useState } from "react";
import { Info, MapPin, Pencil, Phone, School, Upload, User } from "lucide-react";
import { useSchoolProfile, useUpdateSchoolProfile } from "@/hooks/settings/useSchoolProfile";
import { useImageUpload } from "@/hooks/settings/useImageUpload";
import type { PrimaryContact } from "@/app/services/school-settings.service";
import {
  Card,
  CardHeader,
  InputField,
  Notice,
  OutlineBtn,
  PrimaryBtn,
  ReadOnlyField,
  SectionError,
  SectionHeader,
  SectionSkeleton,
} from "@/components/settings/ui";

const TITLE = "School Profile";
const DESC = "School information and branding";

/** Max length the backend accepts for `physicalAddress`. */
const ADDRESS_MAX = 500;

interface ProfileForm {
  physicalAddress: string;
  contactName: string;
  contactPhone: string;
  contactRole: string;
}

const EMPTY_FORM: ProfileForm = { physicalAddress: "", contactName: "", contactPhone: "", contactRole: "" };

/**
 * Settings → School Profile: the school's logo, its read-only identity
 * (managed by Talim support) and the contact details the school may edit.
 *
 * @param props.canManage - False for a role without `manage:settings`, which
 *   hides every edit affordance instead of letting the API refuse the save.
 */
export function SchoolProfileSection({ canManage }: { canManage: boolean }) {
  const { data: school, isLoading, isError, error, refetch } = useSchoolProfile();
  const { save, saving } = useUpdateSchoolProfile();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const fileRef = useRef<HTMLInputElement>(null);

  const { uploading, onFileChange } = useImageUpload("settings/school-logo", (logo) =>
    save({ logo })
  );

  // Seed the form from the loaded school, and re-seed whenever it changes.
  useEffect(() => {
    if (!school) return;
    const contact = school.primaryContacts?.[0];
    setForm({
      physicalAddress: school.physicalAddress || "",
      contactName: contact?.name || "",
      contactPhone: contact?.phone || "",
      contactRole: contact?.role || "",
    });
  }, [school]);

  if (isLoading) return <SectionSkeleton title={TITLE} desc={DESC} />;
  if (isError || !school) {
    return (
      <SectionError
        title={TITLE}
        desc={DESC}
        error={error}
        fallback="Failed to load the school profile."
        onRetry={() => refetch()}
      />
    );
  }

  const contact = school.primaryContacts?.[0];
  const addressTooLong = form.physicalAddress.length > ADDRESS_MAX;

  const handleSave = async () => {
    if (addressTooLong) return;
    const contacts: PrimaryContact[] = form.contactName
      ? [
          {
            name: form.contactName,
            phone: form.contactPhone,
            email: school.email || "",
            role: form.contactRole || "Principal",
          },
        ]
      : (school.primaryContacts ?? []);

    try {
      await save({ physicalAddress: form.physicalAddress, primaryContacts: contacts });
      setEditing(false);
    } catch {
      // The mutation already reported it; stay in edit mode so nothing is lost.
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader title={TITLE} desc={DESC} />

      <Card>
        <CardHeader title="School Logo" />
        <div className="p-5 flex items-center gap-5">
          <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-600 flex items-center justify-center bg-gray-50 dark:bg-slate-700 overflow-hidden">
            {school.logo ? (
              <img src={school.logo} alt="School logo" className="w-full h-full object-contain" />
            ) : (
              <School className="w-8 h-8 text-gray-300 dark:text-slate-500" />
            )}
          </div>
          {canManage && (
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={onFileChange}
              />
              <OutlineBtn onClick={() => fileRef.current?.click()} disabled={uploading}>
                <Upload className="w-4 h-4" />
                {uploading ? "Uploading…" : "Change Logo"}
              </OutlineBtn>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1.5">PNG, JPG — max 2MB</p>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="School Information"
          action={
            !canManage ? null : editing ? (
              <div className="flex gap-2">
                <OutlineBtn onClick={() => setEditing(false)} disabled={saving}>
                  Cancel
                </OutlineBtn>
                <PrimaryBtn onClick={handleSave} loading={saving} disabled={addressTooLong}>
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
            <ReadOnlyField label="School Name" value={school.name} />
            <ReadOnlyField label="School Email" value={school.email} />
            <ReadOnlyField label="School Code" value={school.schoolPrefix} />
            <ReadOnlyField label="Status" value={school.active ? "Active" : "Inactive"} />
          </div>

          {editing ? (
            <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-slate-700">
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                Editable Fields
              </p>
              <InputField
                label="Physical Address"
                value={form.physicalAddress}
                onChange={(v) => setForm({ ...form, physicalAddress: v })}
                placeholder="e.g. 123 Education Lane, Lagos"
                error={addressTooLong ? `Keep the address under ${ADDRESS_MAX} characters` : undefined}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Primary Contact Name"
                  value={form.contactName}
                  onChange={(v) => setForm({ ...form, contactName: v })}
                  placeholder="e.g. Mrs. Amaka Obi"
                />
                <InputField
                  label="Contact Phone"
                  value={form.contactPhone}
                  onChange={(v) => setForm({ ...form, contactPhone: v })}
                  placeholder="e.g. +234 800 000 0000"
                />
                <InputField
                  label="Contact Role"
                  value={form.contactRole}
                  onChange={(v) => setForm({ ...form, contactRole: v })}
                  placeholder="e.g. Principal"
                />
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2 pt-2">
                <MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-slate-300">
                  {school.physicalAddress || "—"}
                </span>
              </div>
              {contact && (
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
                    {contact.name} ({contact.role})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
                    {contact.phone}
                  </span>
                </div>
              )}
            </>
          )}

          <Notice icon={<Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />}>
            School name, email and code are managed by Talim support. Contact{" "}
            <a href="mailto:support@mytalim.com" className="underline font-medium">
              support@mytalim.com
            </a>{" "}
            to request changes.
          </Notice>
        </div>
      </Card>
    </div>
  );
}
