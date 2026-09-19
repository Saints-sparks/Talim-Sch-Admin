"use client";

import { useState } from "react";
import type React from "react";
import { toast } from "@/components/CustomToast";
import type { AcademicSetupActions } from "@/hooks/settings/useAcademicSetup";
import {
  EMPTY_TERM,
  EMPTY_YEAR,
  toTermPayload,
  toYearPayload,
  validateTermForm,
  validateYearForm,
  type TermForm,
  type YearForm,
} from "./academicForms";

/** What the form hook renders and drives. */
export interface AcademicSetupForms {
  showYearForm: boolean;
  showTermForm: boolean;
  yearForm: YearForm;
  termForm: TermForm;
  /** The term awaiting "Change current term?" confirmation, or "". */
  pendingTermId: string;
  setYearForm: (form: YearForm) => void;
  setTermForm: (form: TermForm) => void;
  toggleYearForm: () => void;
  toggleTermForm: () => void;
  closeYearForm: () => void;
  closeTermForm: () => void;
  askToChangeTerm: (termId: string) => void;
  cancelTermChange: () => void;
  submitYear: (e: React.FormEvent) => Promise<void>;
  submitTerm: (e: React.FormEvent) => Promise<void>;
  confirmTermChange: () => Promise<void>;
}

/**
 * The inline create-year and create-term forms and the change-term
 * confirmation of Settings → Academic Setup.
 *
 * Validation failures toast and keep the form open; a failed request is
 * reported by the mutation and the form keeps what was typed.
 *
 * @param years - The school's existing years, for the duplicate check.
 * @param actions - The create and set-current mutations.
 * @returns The form state and its handlers.
 */
export function useAcademicSetupForms(
  years: ReadonlyArray<{ year: string }>,
  actions: Pick<AcademicSetupActions, "addYear" | "addTerm" | "makeTermCurrent">,
): AcademicSetupForms {
  const [showYearForm, setShowYearForm] = useState(false);
  const [showTermForm, setShowTermForm] = useState(false);
  const [yearForm, setYearForm] = useState<YearForm>(EMPTY_YEAR);
  const [termForm, setTermForm] = useState<TermForm>(EMPTY_TERM);
  const [pendingTermId, setPendingTermId] = useState("");

  const submitYear = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validateYearForm(yearForm, years);
    if (problem) {
      toast.error(problem);
      return;
    }
    try {
      await actions.addYear(toYearPayload(yearForm));
      setYearForm(EMPTY_YEAR);
      setShowYearForm(false);
    } catch {
      // Reported by the mutation; the form keeps what was typed.
    }
  };

  const submitTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validateTermForm(termForm);
    if (problem) {
      toast.error(problem);
      return;
    }
    try {
      await actions.addTerm(toTermPayload(termForm));
      setTermForm(EMPTY_TERM);
      setShowTermForm(false);
    } catch {
      // Reported by the mutation.
    }
  };

  const confirmTermChange = async () => {
    try {
      await actions.makeTermCurrent(pendingTermId);
    } catch {
      // Reported by the mutation; the dialog closes either way.
    } finally {
      setPendingTermId("");
    }
  };

  return {
    showYearForm,
    showTermForm,
    yearForm,
    termForm,
    pendingTermId,
    setYearForm,
    setTermForm,
    toggleYearForm: () => setShowYearForm((v) => !v),
    toggleTermForm: () => setShowTermForm((v) => !v),
    closeYearForm: () => setShowYearForm(false),
    closeTermForm: () => setShowTermForm(false),
    askToChangeTerm: setPendingTermId,
    cancelTermChange: () => setPendingTermId(""),
    submitYear,
    submitTerm,
    confirmTermChange,
  };
}
