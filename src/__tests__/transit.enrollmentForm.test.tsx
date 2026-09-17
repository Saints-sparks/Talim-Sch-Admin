/** @jest-environment jsdom */
import React, { useState } from "react";
import { render, screen } from "@/test-utils/render";
import userEvent from "@testing-library/user-event";
import {
  EnrollmentFields,
  isEnrollmentDraftComplete,
  type EnrollmentDraft,
} from "@/components/transit/EnrollmentFields";
import { filterStudents, type StudentOption } from "@/hooks/transit/useTransitReference";
import type { AcademicYearResponse, TermResponse } from "@/app/services/academic.service";

const CLASSES = [
  { _id: "c1", name: "JSS 1A", gradeLevel: "JSS1" },
  { _id: "c2", name: "JSS 2A" },
];

const YEARS = [
  { _id: "y1", year: "2024/2025" },
  { _id: "y2", year: "2025/2026" },
] as AcademicYearResponse[];

const TERMS = [
  { _id: "t1", name: "First Term", academicYearId: "y1" },
  { _id: "t2", name: "Second Term", academicYearId: "y1" },
  { _id: "t3", name: "First Term", academicYearId: "y2" },
] as TermResponse[];

/** Renders the fields with real state, the way a modal drives them. */
function Harness({ loading = false }: { loading?: boolean }) {
  const [draft, setDraft] = useState<EnrollmentDraft>({
    classId: "",
    academicYearId: "",
    termId: "",
  });
  return (
    <>
      <EnrollmentFields
        draft={draft}
        onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
        classes={CLASSES}
        academicYears={YEARS}
        terms={TERMS}
        loading={loading}
      />
      <output data-testid="draft">{JSON.stringify(draft)}</output>
    </>
  );
}

describe("EnrollmentFields", () => {
  it("marks class and academic year as required, and the term as optional", () => {
    render(<Harness />);
    expect(screen.getByRole("combobox", { name: /class/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /academic year/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /^term$/i })).toBeDisabled();
  });

  it("offers no undefined option while the lists are still loading", () => {
    render(<Harness loading />);
    const classSelect = screen.getByRole("combobox", { name: /class/i });
    expect(classSelect).toBeDisabled();
    expect(screen.getByRole("option", { name: /loading classes/i })).toBeInTheDocument();
  });

  it("names a class with its grade level only when it has one", () => {
    render(<Harness />);
    expect(screen.getByRole("option", { name: "JSS 1A (JSS1)" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "JSS 2A" })).toBeInTheDocument();
  });

  it("offers only the terms of the chosen academic year", async () => {
    render(<Harness />);
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: /academic year/i }),
      "y1"
    );

    const termSelect = screen.getByRole("combobox", { name: /^term$/i });
    expect(termSelect).toBeEnabled();
    const terms = screen.getAllByRole("option").filter((option) =>
      ["t1", "t2", "t3"].includes((option as HTMLOptionElement).value)
    );
    expect(terms.map((option) => (option as HTMLOptionElement).value)).toEqual(["t1", "t2"]);
  });

  it("clears a chosen term when the academic year changes under it", async () => {
    render(<Harness />);
    await userEvent.selectOptions(screen.getByRole("combobox", { name: /academic year/i }), "y1");
    await userEvent.selectOptions(screen.getByRole("combobox", { name: /^term$/i }), "t2");
    expect(screen.getByTestId("draft")).toHaveTextContent('"termId":"t2"');

    await userEvent.selectOptions(screen.getByRole("combobox", { name: /academic year/i }), "y2");
    expect(screen.getByTestId("draft")).toHaveTextContent('"termId":""');
  });
});

describe("isEnrollmentDraftComplete", () => {
  it("needs a class and an academic year, but not a term", () => {
    expect(isEnrollmentDraftComplete({ classId: "c1", academicYearId: "y1", termId: "" })).toBe(
      true
    );
    expect(isEnrollmentDraftComplete({ classId: "", academicYearId: "y1", termId: "t1" })).toBe(
      false
    );
    expect(isEnrollmentDraftComplete({ classId: "c1", academicYearId: "", termId: "t1" })).toBe(
      false
    );
  });
});

describe("filterStudents", () => {
  const students: StudentOption[] = [
    { _id: "s1", firstName: "Ada", lastName: "Obi", admissionNumber: "ADM-1", gradeLevel: "JSS1" },
    { _id: "s2", firstName: "Bola", lastName: "Eze", admissionNumber: "ADM-2", gradeLevel: "JSS2" },
  ];

  it("returns everyone for an empty search", () => {
    expect(filterStudents(students, "   ")).toHaveLength(2);
  });

  it("matches on name, admission number and grade level, ignoring case", () => {
    expect(filterStudents(students, "ada")).toEqual([students[0]]);
    expect(filterStudents(students, "ADM-2")).toEqual([students[1]]);
    expect(filterStudents(students, "jss2")).toEqual([students[1]]);
    expect(filterStudents(students, "obi")).toEqual([students[0]]);
  });

  it("returns nothing when nothing matches", () => {
    expect(filterStudents(students, "zzz")).toEqual([]);
  });
});
