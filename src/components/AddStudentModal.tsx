"use client";

import React from "react";
import { useAddStudentForm } from "@/hooks/users/useAddStudentForm";
import { CreateModalFrame } from "@/components/users/create/CreateModalFrame";
import { InfoNotice } from "@/components/users/create/InfoNotice";
import { WizardFooter } from "@/components/users/create/WizardFooter";
import { bodyTextClass, guideCardClass, navyTextClass } from "@/components/users/create/ui";
import { STUDENT_LAST_STEP } from "@/components/users/students/create/studentForm";
import { StudentAccountStep } from "@/components/users/students/create/StudentAccountStep";
import { StudentModalHeader } from "@/components/users/students/create/StudentModalHeader";
import { StudentProfileStep } from "@/components/users/students/create/StudentProfileStep";

const TITLE_ID = "add-student-title";

interface AddStudentModalProps {
  /** Closes the dialog. */
  onClose: () => void;
  /** Called after a student has been created, so the caller can refresh. */
  onSuccess?: () => unknown;
}

/**
 * Two-step dialog that enrols a student: the login account, then class
 * placement and the parent contact the API links or creates. Only renders for
 * administrators holding `MANAGE_STUDENTS`. The server generates the temporary
 * password; the form never asks for one.
 *
 * @param props - Close and success callbacks.
 * @returns The dialog, or nothing when the admin may not add students.
 */
const AddStudentModal: React.FC<AddStudentModalProps> = ({ onClose, onSuccess }) => {
  const wizard = useAddStudentForm({ onClose, onSuccess });
  const { form, errors, setField, step, pending } = wizard;

  if (!wizard.canCreate) return null;

  return (
    <CreateModalFrame
      onClose={onClose}
      busy={pending}
      labelledBy={TITLE_ID}
      dataGuide="student-create-modal"
      overlayClassName="p-4"
      panelClassName="bg-[#003366] h-[90vh] w-full max-w-3xl rounded-2xl"
    >
      <StudentModalHeader step={step} titleId={TITLE_ID} onClose={onClose} busy={pending} />

      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
        <div className="p-6" data-guide="student-create-fields">
          <div className={guideCardClass}>
            <p className={`text-sm font-semibold ${navyTextClass}`}>Student setup guide</p>
            <p className={`mt-1 text-sm leading-6 ${bodyTextClass}`}>
              Talim creates the learner account first, then links academic details and guardian
              information for communication and records.
            </p>
          </div>

          {wizard.formError && (
            <div className="mb-5">
              <InfoNotice tone="danger" alert rounded="lg">
                {wizard.formError}
              </InfoNotice>
            </div>
          )}

          {step === 0 ? (
            <StudentAccountStep form={form} errors={errors} setField={setField} />
          ) : (
            <StudentProfileStep
              form={form}
              errors={errors}
              setField={setField}
              classes={wizard.classes}
              selectedClass={wizard.selectedClass}
              onSelectClass={wizard.selectClass}
            />
          )}
        </div>
      </div>

      <WizardFooter
        size="md"
        step={step}
        lastStep={STUDENT_LAST_STEP}
        pending={pending}
        onBack={wizard.back}
        onNext={wizard.submit}
        submitLabel="Create Student"
        continueHint="Save the account details and continue to the student profile step."
        submitHint="Create the student profile and connect it to the selected class and parent details."
      />
    </CreateModalFrame>
  );
};

export default AddStudentModal;
