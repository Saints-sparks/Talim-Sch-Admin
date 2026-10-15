/** @jest-environment jsdom */
/**
 * Promotion actions (history §4): Promote / Repeat / Graduate / Withdraw per
 * student, Graduate offered for the top level, the `action` sent in each
 * decision, and the review step's counts per action.
 */
import React from "react";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within } from "@/test-utils/render";
import type { StudentEnrollment } from "@/app/services/transit.service";
import type { AcademicYearResponse, TermResponse } from "@/app/services/academic.service";
import type { DecisionDraft } from "@/components/transit/promotions/DecisionEditor";
import {
  actionCounts,
  actionsFor,
  canGraduateFrom,
  decisionAction,
  levelOrderOf,
  topLevelOf,
} from "@/components/transit/promotions/promotionActions";
import {
  bulkDecisionDrafts,
  readyDecisions,
  toRequestDecisions,
} from "@/components/transit/promotions/wizard/promotionWizard";
import { CreatePromotionRunModal } from "@/components/transit/promotions/CreatePromotionRunModal";

const mutateAsync = jest.fn();
let rosterData: StudentEnrollment[] = [];

jest.mock("@/components/CustomToast", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/hooks/transit/useEnrollments", () => ({
  useEnrollments: () => ({ data: rosterData, isLoading: false, isError: false, error: null }),
}));
jest.mock("@/hooks/transit/usePromotionRuns", () => ({
  useCreatePromotionRun: () => ({ mutateAsync, isPending: false }),
}));

const CLASSES = [
  { _id: "j1", name: "JSS 1A", gradeLevel: "JSS 1" },
  { _id: "s2", name: "SS 2 Science", gradeLevel: "SS 2" },
  { _id: "s3", name: "SS 3 Science", gradeLevel: "SS 3" },
];
const YEARS = [
  { _id: "y1", year: "2025/2026" },
  { _id: "y2", year: "2026/2027" },
] as AcademicYearResponse[];
const TERMS = [{ _id: "t1", name: "First Term", academicYearId: "y2" }] as TermResponse[];

/**
 * An active enrollment.
 *
 * @param id - Student id.
 * @param first - First name.
 * @param classId - The class.
 * @returns The enrollment.
 */
function enrollment(id: string, first: string, classId: string): StudentEnrollment {
  return {
    _id: `e-${id}`,
    studentId: { _id: id, firstName: first, lastName: "Bello" },
    classId: { _id: classId, name: classId },
  } as unknown as StudentEnrollment;
}

/**
 * A draft decision.
 *
 * @param patch - Fields to set.
 * @returns The draft.
 */
function draft(patch: Partial<DecisionDraft>): DecisionDraft {
  return {
    studentId: "x",
    studentName: "X",
    fromClassId: "s3",
    toClassId: "",
    action: "promote",
    repeatClass: false,
    ...patch,
  };
}

describe("levels and the Graduate action", () => {
  it("orders levels like the backend", () => {
    expect(levelOrderOf("JSS 1")).toBe(201);
    expect(levelOrderOf("SS 3")).toBe(303);
    expect(levelOrderOf("SSS 2")).toBe(302);
    expect(levelOrderOf("Primary 6")).toBe(106);
    expect(levelOrderOf("Nursery")).toBe(0);
    expect(levelOrderOf("Form Four")).toBeNull();
    expect(topLevelOf(CLASSES)).toBe(303);
    expect(topLevelOf([...CLASSES, { gradeLevel: "Form Four" }])).toBeNull();
    expect(topLevelOf([])).toBeNull();
  });

  it("offers Graduate only from the top level, or everywhere when levels can't be told", () => {
    expect(canGraduateFrom("s3", CLASSES)).toBe(true);
    expect(canGraduateFrom("j1", CLASSES)).toBe(false);
    expect(actionsFor("j1", CLASSES).map((a) => a.value)).toEqual([
      "promote",
      "repeat",
      "withdraw",
    ]);
    expect(actionsFor("s3", CLASSES).map((a) => a.value)).toEqual([
      "promote",
      "repeat",
      "graduate",
      "withdraw",
    ]);
    const unknown = [...CLASSES, { _id: "f4", name: "Form 4", gradeLevel: "Form Four" }];
    expect(canGraduateFrom("j1", unknown)).toBe(true);
  });
});

describe("action mapping", () => {
  it("reads old runs: repeatClass means repeat, else promote", () => {
    expect(decisionAction({ repeatClass: true })).toBe("repeat");
    expect(decisionAction({})).toBe("promote");
    expect(decisionAction({ action: "graduate", repeatClass: false })).toBe("graduate");
  });

  it("needs a target class only to promote", () => {
    const drafts = [
      draft({ studentId: "a", action: "promote" }),
      draft({ studentId: "b", action: "promote", toClassId: "s2" }),
      draft({ studentId: "c", action: "repeat" }),
      draft({ studentId: "d", action: "graduate" }),
      draft({ studentId: "e", action: "withdraw" }),
    ];
    expect(readyDecisions(drafts).map((d) => d.studentId)).toEqual(["b", "c", "d", "e"]);
  });

  it("sends action, the class only when the student moves into one, and repeatClass in step", () => {
    expect(
      toRequestDecisions([
        draft({ studentId: "a", action: "promote", toClassId: "s3", targetGradeLevel: "SS 3" }),
        draft({ studentId: "b", action: "repeat" }),
        draft({ studentId: "c", action: "repeat", toClassId: "s2" }),
        draft({ studentId: "d", action: "graduate", toClassId: "s2", targetGradeLevel: "x" }),
        draft({ studentId: "e", action: "withdraw", toClassId: "s2" }),
      ])
    ).toEqual([
      {
        studentId: "a",
        fromClassId: "s3",
        toClassId: "s3",
        action: "promote",
        targetGradeLevel: "SS 3",
        repeatClass: false,
      },
      { studentId: "b", fromClassId: "s3", action: "repeat", repeatClass: true },
      { studentId: "c", fromClassId: "s3", toClassId: "s2", action: "repeat", repeatClass: true },
      { studentId: "d", fromClassId: "s3", action: "graduate", repeatClass: false },
      { studentId: "e", fromClassId: "s3", action: "withdraw", repeatClass: false },
    ]);
  });

  it("graduates a whole class in bulk", () => {
    const drafts = bulkDecisionDrafts([enrollment("a", "Ada", "s3")], "s3", "", "graduate");
    expect(drafts).toEqual([
      {
        studentId: "a",
        studentName: "Ada Bello",
        fromClassId: "s3",
        toClassId: "",
        action: "graduate",
        repeatClass: false,
      },
    ]);
  });

  it("counts decisions per action in the wizard's order", () => {
    expect(
      actionCounts([
        { action: "graduate" },
        { action: "promote" },
        { repeatClass: true },
        { action: "graduate" },
      ])
    ).toEqual([
      { action: "promote", label: "Promote", count: 1 },
      { action: "repeat", label: "Repeat", count: 1 },
      { action: "graduate", label: "Graduate", count: 2 },
    ]);
  });
});

describe("promotion wizard with actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mutateAsync.mockResolvedValue({});
  });

  /**
   * Opens the wizard and passes the setup step.
   *
   * @param user - The user-event instance.
   */
  async function setup(user: ReturnType<typeof userEvent.setup>) {
    render(
      <CreatePromotionRunModal
        academicYears={YEARS}
        terms={TERMS}
        classes={CLASSES}
        onClose={jest.fn()}
        onCreated={jest.fn()}
      />
    );
    const [fromSelect, toSelect] = screen.getAllByRole("combobox");
    await user.selectOptions(fromSelect, "y1");
    await user.selectOptions(toSelect, "y2");
  }

  it("graduates, withdraws and promotes per student and shows the counts before submitting", async () => {
    const user = userEvent.setup();
    rosterData = [
      enrollment("a", "Ada", "s3"),
      enrollment("b", "Bayo", "s3"),
      enrollment("c", "Chi", "j1"),
    ];
    await setup(user);
    await user.click(screen.getByRole("button", { name: "Next" }));

    await user.click(screen.getByLabelText(/Ada Bello/));
    await user.click(screen.getByLabelText(/Bayo Bello/));
    await user.click(screen.getByLabelText(/Chi Bello/));

    // Graduate is offered for the top level (SS 3), not for JSS 1.
    const chiAction = screen.getByLabelText("Action for Chi Bello");
    expect(within(chiAction).queryByRole("option", { name: "Graduate" })).toBeNull();
    await user.selectOptions(screen.getByLabelText("Action for Ada Bello"), "graduate");
    expect(screen.queryByLabelText("Target class for Ada Bello")).toBeNull();
    expect(screen.getByText("Leaves as a graduate")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Action for Bayo Bello"), "withdraw");
    await user.selectOptions(screen.getByLabelText("Target class for Chi Bello"), "s2");

    await user.click(screen.getByRole("button", { name: "Next" }));
    const counts = screen.getByRole("list", { name: "Decisions per action" });
    expect(
      within(counts)
        .getAllByRole("listitem")
        .map((li) => li.textContent)
    ).toEqual(["1 Promote", "1 Graduate", "1 Withdraw"]);

    await user.click(screen.getByRole("button", { name: "Continue to Submit" }));
    expect(screen.getByRole("list", { name: "Decisions per action" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Submit Run" }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(mutateAsync.mock.calls[0][0].decisions).toEqual([
      { studentId: "a", fromClassId: "s3", action: "graduate", repeatClass: false },
      { studentId: "b", fromClassId: "s3", action: "withdraw", repeatClass: false },
      { studentId: "c", fromClassId: "j1", toClassId: "s2", action: "promote", repeatClass: false },
    ]);
  });

  it("graduates a whole top-level class in bulk mode", async () => {
    const user = userEvent.setup();
    rosterData = [enrollment("a", "Ada", "s3"), enrollment("b", "Bayo", "s3")];
    await setup(user);
    await user.click(screen.getByRole("button", { name: "Bulk Class Promotion" }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    const [source] = screen.getAllByRole("combobox");
    await user.selectOptions(source, "s3");
    await user.click(screen.getByRole("radio", { name: "Graduate the class" }));
    expect(await screen.findByText("2 students loaded")).toBeInTheDocument();
    expect(screen.getByLabelText("Action for Ada Bello")).toHaveValue("graduate");

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("list", { name: "Decisions per action" })).toHaveTextContent(
      "2 Graduate"
    );
  });

  it("does not offer to graduate a class below the top level", async () => {
    const user = userEvent.setup();
    rosterData = [enrollment("c", "Chi", "j1")];
    await setup(user);
    await user.click(screen.getByRole("button", { name: "Bulk Class Promotion" }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.selectOptions(screen.getAllByRole("combobox")[0], "j1");
    expect(screen.queryByRole("radio", { name: "Graduate the class" })).toBeNull();
  });
});
