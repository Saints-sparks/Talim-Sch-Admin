"use client";

import React from "react";
import { useAddTeacherForm } from "@/hooks/users/useAddTeacherForm";
import { CreateModalFrame } from "@/components/users/create/CreateModalFrame";
import { InfoNotice } from "@/components/users/create/InfoNotice";
import { WizardFooter } from "@/components/users/create/WizardFooter";
import { bodyTextClass, guideCardClass, navyTextClass } from "@/components/users/create/ui";
import { TEACHER_LAST_STEP } from "@/components/users/teachers/create/teacherForm";
import { TeacherAccountStep } from "@/components/users/teachers/create/TeacherAccountStep";
import { TeacherEmploymentStep } from "@/components/users/teachers/create/TeacherEmploymentStep";
import { TeacherModalHeader } from "@/components/users/teachers/create/TeacherModalHeader";
import { TeacherQualificationsStep } from "@/components/users/teachers/create/TeacherQualificationsStep";

const TITLE_ID = "add-teacher-title";

interface AddTeacherModalProps {
  /** Closes the dialog. */
  onClose: () => void;
  /** Called after the teacher has been created, so the caller can refresh. */
  onSuccess?: () => void | Promise<void>;
}

/**
 * Three-step dialog that creates a teacher: account, qualifications, then
 * employment. Only renders for administrators holding `MANAGE_TEACHERS`.
 * The server generates the temporary password; the form never asks for one.
 *
 * @param props - Close and success callbacks.
 * @returns The dialog, or nothing when the admin may not add teachers.
 */
const AddTeacherModal: React.FC<AddTeacherModalProps> = ({ onClose, onSuccess }) => {
  const wizard = useAddTeacherForm({ onClose, onSuccess });
  const { form, errors, setField, step, pending } = wizard;

  if (!wizard.canCreate) return null;

  return (
    <CreateModalFrame
      onClose={onClose}
      busy={pending}
      labelledBy={TITLE_ID}
      dataGuide="teacher-create-modal"
      panelClassName="bg-white dark:bg-gray-900 h-[90vh] w-full max-w-4xl mx-4 rounded-2xl"
    >
      <TeacherModalHeader step={step} titleId={TITLE_ID} onClose={onClose} busy={pending} />

      <div className="flex-1 overflow-y-auto p-6" data-guide="teacher-create-fields">
        <div className={guideCardClass}>
          <p className={`text-sm font-semibold ${navyTextClass}`}>Teacher setup guide</p>
          <p className={`mt-1 text-sm leading-6 ${bodyTextClass}`}>
            Create the account first, then complete profile details so this teacher can be assigned
            to classes, courses, and messages.
          </p>
        </div>

        {wizard.formError && (
          <div className="mb-5">
            <InfoNotice tone="danger" alert>
              {wizard.formError}
            </InfoNotice>
          </div>
        )}

        {step === 0 && <TeacherAccountStep form={form} errors={errors} setField={setField} />}
        {step === 1 && <TeacherQualificationsStep form={form} errors={errors} setField={setField} />}
        {step === 2 && (
          <TeacherEmploymentStep
            form={form}
            errors={errors}
            setField={setField}
            classes={wizard.classes}
            onToggleClass={wizard.toggleClass}
            onToggleDay={wizard.toggleDay}
          />
        )}
      </div>

      <WizardFooter
        size="lg"
        step={step}
        lastStep={TEACHER_LAST_STEP}
        pending={pending}
        onBack={wizard.back}
        onNext={wizard.submit}
        submitLabel="Create Teacher"
        continueHint="Save this stage and continue to the next teacher setup step."
        submitHint="Finish the teacher profile and make the account available across Talim."
      />
    </CreateModalFrame>
  );
};

export default AddTeacherModal;
