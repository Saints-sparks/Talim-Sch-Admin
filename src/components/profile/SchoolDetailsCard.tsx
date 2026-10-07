/**
 * `/profile` → the school record: its logo, name, address and location.
 *
 * `PUT /schools/update/:id` requires `manage:settings` for school staff, so
 * the editing controls only appear for a role that holds it; everyone else
 * sees the school read-only rather than a form the API would refuse.
 *
 * The school prefix is shown but never editable: the backend strips
 * `schoolPrefix` (and `active`) from a school-staff update, because the id
 * prefix student and parent numbers are built from is a platform decision.
 */
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Building, Camera, Globe, MapPin, School } from "lucide-react";
import { toast } from "@/components/CustomToast";
import { Tooltip } from "@/components/ui/Tooltip";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/permissions";
import {
  ProfileCardHeader,
  ProfileField,
  ProfileSaveBar,
  ProfileSelectField,
} from "@/components/profile/ProfileAtoms";
import { useProfileImage } from "@/components/profile/useProfileImage";
import { useSaveSchoolDetails, type SchoolDetails } from "@/components/profile/useProfileData";

/** The states the school can be in. */
const STATES = [
  { value: "Lagos State", label: "Lagos State" },
  { value: "FCT Abuja", label: "FCT Abuja" },
  { value: "Rivers State", label: "Rivers State" },
  { value: "Kano State", label: "Kano State" },
  { value: "Oyo State", label: "Oyo State" },
] as const;

/** The countries the school can be in. */
const COUNTRIES = [
  { value: "Nigeria", label: "Nigeria" },
  { value: "Ghana", label: "Ghana" },
  { value: "Kenya", label: "Kenya" },
  { value: "South Africa", label: "South Africa" },
] as const;

/** The fields this card lets a school admin change. */
type EditableSchool = Omit<SchoolDetails, "prefix" | "logo">;

/**
 * Rejects school details the API would reject, before they are sent.
 *
 * @param form - The details as typed.
 * @returns The problem, or `null` when they are valid.
 */
export function schoolDetailsProblem(form: EditableSchool): string | null {
  if (!form.name.trim()) return "School name is required";
  if (!form.street.trim()) return "Street address is required";
  if (!form.state) return "State is required";
  if (!form.country) return "Country is required";
  return null;
}

/**
 * @param props.school - The school as the server has it.
 * @returns The school card.
 */
export function SchoolDetailsCard({ school }: { school: SchoolDetails }) {
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission(Permission.MANAGE_SETTINGS);

  const { save, saveLogo, saving } = useSaveSchoolDetails();
  const logo = useProfileImage("profile/school-logo", school.logo, (url) => saveLogo(url || null));

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditableSchool>({
    name: school.name,
    street: school.street,
    state: school.state,
    country: school.country,
  });

  useEffect(() => {
    if (editing) return;
    setForm({
      name: school.name,
      street: school.street,
      state: school.state,
      country: school.country,
    });
  }, [editing, school.name, school.street, school.state, school.country]);

  const set = (field: keyof EditableSchool) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    const problem = schoolDetailsProblem(form);
    if (problem) {
      toast.error(problem);
      return;
    }
    if (logo.busy) {
      toast.error("Please wait for the image upload to finish");
      return;
    }
    await save(form);
    setEditing(false);
  };

  return (
    <>
      {/* Hero row: logo and name */}
      <div className="flex flex-col sm:flex-row items-start gap-6 mt-4">
        <div className="relative flex-shrink-0">
          <div className="w-24 h-24 rounded-xl bg-tl-select border-2 border-tl-surface shadow-lg flex items-center justify-center overflow-hidden">
            {logo.preview ? (
              <Image
                src={logo.preview}
                alt="School logo"
                width={96}
                height={96}
                className="object-cover w-full h-full"
                unoptimized
              />
            ) : (
              <School className="w-10 h-10 text-tl-brand" />
            )}
          </div>
          {logo.busy && (
            <div className="absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center">
              <span className="text-white text-xs font-medium">{logo.progress}%</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold text-tl-ink">{school.name || "Your School"}</h2>
            {school.prefix && (
              <p className="text-tl-muted text-sm mt-0.5">Prefix: {school.prefix}</p>
            )}
          </div>
          {canEdit && (
            <div className="flex flex-wrap gap-3">
              <Tooltip
                content="Appears on reports, the student app, and the parent app. Square format recommended."
                side="top"
              >
                <label
                  htmlFor="school-logo-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-tl-brand-fill text-white text-sm font-medium rounded-lg cursor-pointer hover:bg-tl-brand-fill-hover transition"
                >
                  <Camera className="w-4 h-4" />
                  Change Logo
                  <input
                    id="school-logo-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={logo.onFileChange}
                  />
                </label>
              </Tooltip>
              {logo.preview && (
                <button
                  type="button"
                  onClick={logo.remove}
                  disabled={logo.busy}
                  className="px-4 py-2 text-sm font-medium text-tl-danger border border-tl-danger/30 rounded-lg hover:bg-tl-danger-bg transition disabled:opacity-50"
                >
                  Remove Logo
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Details card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-tl-surface rounded-xl border border-tl-line shadow-sm overflow-hidden"
      >
        <ProfileCardHeader
          title="School Information"
          editing={editing}
          canEdit={canEdit}
          onToggle={() => setEditing((was) => !was)}
        />

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ProfileField
              label="School Name"
              icon={Building}
              value={form.name}
              editing={editing}
              placeholder="School name"
              onChange={set("name")}
            />
            <Tooltip
              content='A short code prepended to student IDs (e.g. "TLM" → student ID "TLM-0042").'
              side="right"
            >
              <div>
                <ProfileField
                  label="School Prefix"
                  icon={Building}
                  value={school.prefix}
                  editing={false}
                  note="Set when the school was created; contact Talim support to change it."
                />
              </div>
            </Tooltip>
            <ProfileField
              label="Street Address"
              icon={MapPin}
              value={form.street}
              editing={editing}
              placeholder="Street address"
              onChange={set("street")}
            />
            <ProfileSelectField
              label="State"
              icon={MapPin}
              value={form.state}
              editing={editing}
              placeholder="Choose your state"
              options={STATES}
              onChange={set("state")}
            />
            <ProfileSelectField
              label="Country"
              icon={Globe}
              value={form.country}
              editing={editing}
              placeholder="Choose your country"
              options={COUNTRIES}
              onChange={set("country")}
            />
          </div>

          {!canEdit && (
            <p className="mt-6 text-xs text-tl-muted">
              Only an administrator with the &ldquo;manage settings&rdquo; permission can change the
              school&apos;s details.
            </p>
          )}

          {editing && (
            <ProfileSaveBar
              saving={saving}
              blocked={logo.busy}
              onSave={() => void handleSave()}
              onCancel={() => setEditing(false)}
            />
          )}
        </div>
      </motion.div>
    </>
  );
}
