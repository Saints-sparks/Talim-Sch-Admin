"use client";

/**
 * The "Class Details" form on the class edit screen.
 *
 * Presentational: the page owns the form state and the save, because the same
 * values drive the statistics preview underneath.
 */
import React from "react";
import { BookOpen, User, Users } from "lucide-react";
import {
  CardHeader,
  StatGrid,
  StatTile,
  card,
  describedByFor,
  fieldControl,
  fieldError,
  fieldLabel,
  sectionTitle,
  textareaControl,
} from "@/components/tl";
import {
  GRADE_OPTIONS,
  type ClassFormErrors,
  type ClassPayload,
} from "@/components/classes/class.model";

/** Props for {@link ClassDetailsForm}. */
interface ClassDetailsFormProps {
  /** The form's values. */
  form: ClassPayload;
  /** What is wrong with them, keyed by field. */
  errors: ClassFormErrors;
  /** Called with a field and its new value. */
  onChange: (field: keyof ClassPayload, value: string) => void;
  /** Read-only figures shown under the form. */
  courseCount: number;
  /** The class teacher's name, for the preview. */
  teacherName: string;
  /** False for a role that may not edit the class; the fields go read-only. */
  canManage: boolean;
}

/**
 * The red line under a field, tied to it by id.
 *
 * @param props - The control's id and its message.
 * @param props.id - The control's id.
 * @param props.message - The error, if any.
 * @returns The message, or null.
 */
function FieldMessage({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} className={fieldError}>
      {message}
    </p>
  );
}

/**
 * `aria-invalid` and `aria-describedby` for one control.
 *
 * @param id - The control's id.
 * @param message - Its error, if any.
 * @returns The attributes.
 */
function a11y(id: string, message?: string) {
  return {
    "aria-invalid": message ? true : undefined,
    "aria-describedby": describedByFor(id, undefined, message),
  } as const;
}

/**
 * Renders the edit form and its statistics preview.
 *
 * @param props - See {@link ClassDetailsFormProps}.
 * @param props.form - The values.
 * @param props.errors - The problems.
 * @param props.onChange - Change handler.
 * @param props.courseCount - Courses assigned.
 * @param props.teacherName - The class teacher.
 * @param props.canManage - Whether the fields are editable.
 * @returns The tab body.
 */
export function ClassDetailsForm({
  form,
  errors,
  onChange,
  courseCount,
  teacherName,
  canManage,
}: ClassDetailsFormProps) {
  return (
    <section className={card}>
      <CardHeader
        title="Edit Class Information"
        subtitle={
          canManage
            ? "Save Changes sends these fields. The class teacher is changed on the other tab."
            : "Your role can view these details but not change them."
        }
      />

      <div className="mt-[18px] flex flex-col gap-[18px]">
        <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className={fieldLabel} htmlFor="edit-class-name">
              Class Name *
            </label>
            <input
              id="edit-class-name"
              type="text"
              value={form.name}
              onChange={(event) => onChange("name", event.target.value)}
              disabled={!canManage}
              className={fieldControl}
              placeholder="Enter class name (e.g., Grade 1A)"
              {...a11y("edit-class-name", errors.name)}
            />
            <FieldMessage id="edit-class-name" message={errors.name} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={fieldLabel} htmlFor="edit-class-grade">
              Grade Level *
            </label>
            <select
              id="edit-class-grade"
              value={form.gradeLevel}
              onChange={(event) => onChange("gradeLevel", event.target.value)}
              disabled={!canManage}
              className={fieldControl}
              {...a11y("edit-class-grade", errors.gradeLevel)}
            >
              <option value="">Select grade</option>
              {GRADE_OPTIONS.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
            <FieldMessage id="edit-class-grade" message={errors.gradeLevel} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={fieldLabel} htmlFor="edit-class-capacity">
              Class Capacity *
            </label>
            <input
              id="edit-class-capacity"
              type="number"
              min="1"
              value={form.classCapacity}
              onChange={(event) => onChange("classCapacity", event.target.value)}
              disabled={!canManage}
              className={fieldControl}
              placeholder="Enter maximum number of students"
              {...a11y("edit-class-capacity", errors.classCapacity)}
            />
            <FieldMessage id="edit-class-capacity" message={errors.classCapacity} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={fieldLabel} htmlFor="edit-class-description">
            Class Description
          </label>
          <textarea
            id="edit-class-description"
            rows={4}
            value={form.classDescription}
            onChange={(event) => onChange("classDescription", event.target.value)}
            disabled={!canManage}
            className={`${textareaControl} resize-none`}
            placeholder="Enter class description (optional)"
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-tl-line-soft pt-[18px]">
          <h3 className={sectionTitle}>Current Class Statistics</h3>
          <StatGrid label="Current class statistics">
            <StatTile
              subtle
              label="Total Courses"
              value={courseCount}
              hint="assigned"
              icon={<BookOpen />}
            />
            <StatTile
              subtle
              label="Capacity"
              value={form.classCapacity || "0"}
              hint="students"
              icon={<Users />}
            />
            <StatTile
              subtle
              label="Class Teacher"
              value={<span className="block truncate">{teacherName}</span>}
              valueClass="text-lg text-tl-ink"
              hint="assigned"
              icon={<User />}
            />
          </StatGrid>
        </div>
      </div>
    </section>
  );
}
