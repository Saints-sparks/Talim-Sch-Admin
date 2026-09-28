/**
 * The grade scale rules (Settings → Grading, Round 3 §16). The checks mirror
 * the API: unique letters, strictly descending minimums, last minimum 0.
 */
import {
  DEFAULT_GRADE_SCALE,
  addBand,
  bandSplitByPassMark,
  hasGradingErrors,
  isDefaultGrading,
  isDescending,
  isGradingDirty,
  mapServerGradingErrors,
  moveBand,
  parsePercent,
  previewGrading,
  removeBand,
  sortBands,
  toBandDrafts,
  toGradingPayload,
  toPassMarkText,
  updateBand,
  validateGrading,
  type BandDraft,
} from "@/components/settings/grading/gradeScale";

/** Rows from `letter:min` pairs, e.g. `rows("A:70", "F:0")`. */
function rows(...pairs: string[]): BandDraft[] {
  return pairs.map((pair, i) => {
    const [letter, min, remark = ""] = pair.split(":");
    return { id: `r${i}`, letter, min, remark };
  });
}

describe("defaults", () => {
  it("is A 70 Excellent down to F 0 Fail, with a pass mark of 50", () => {
    expect(DEFAULT_GRADE_SCALE.map((b) => `${b.letter} ${b.min} ${b.remark}`)).toEqual([
      "A 70 Excellent",
      "B 60 Very good",
      "C 50 Good",
      "D 45 Fair",
      "E 40 Pass",
      "F 0 Fail",
    ]);
    expect(toPassMarkText(undefined)).toBe("50");
    expect(validateGrading(toBandDrafts(DEFAULT_GRADE_SCALE), "50")).toEqual({ bands: {} });
  });

  it("falls back to the default scale when the API sends none", () => {
    expect(toBandDrafts(undefined).map((r) => r.letter)).toEqual(["A", "B", "C", "D", "E", "F"]);
    expect(toBandDrafts([]).map((r) => r.letter)).toEqual(["A", "B", "C", "D", "E", "F"]);
    expect(toBandDrafts([{ letter: "P", min: 0, remark: null }])).toEqual([
      expect.objectContaining({ letter: "P", min: "0", remark: "" }),
    ]);
  });
});

describe("validateGrading", () => {
  it("requires a letter and a minimum on every row", () => {
    const errors = validateGrading(rows(":70", "F:"), "50");
    expect(errors.bands.r0.letter).toBe("Enter a letter.");
    expect(errors.bands.r1.min).toBe("Enter the minimum percent.");
    expect(hasGradingErrors(errors)).toBe(true);
  });

  it("wants unique letters, ignoring case and spaces", () => {
    const errors = validateGrading(rows("A:70", " a :50", "F:0"), "50");
    expect(errors.bands.r1.letter).toBe("A is already used. Letters must be unique.");
    expect(errors.bands.r0).toBeUndefined();
  });

  it("wants strictly descending minimums", () => {
    const equal = validateGrading(rows("A:70", "B:70", "F:0"), "50");
    expect(equal.bands.r1.min).toBe("Must be lower than A's 70%.");
    const rising = validateGrading(rows("A:60", "B:65", "F:0"), "50");
    expect(rising.bands.r1.min).toBe("Must be lower than A's 60%.");
  });

  it("wants the last minimum to be 0", () => {
    const errors = validateGrading(rows("A:70", "F:10"), "50");
    expect(errors.bands.r1.min).toBe("The last grade must start at 0% so every score gets a grade.");
    expect(validateGrading(rows("P:0"), "50")).toEqual({ bands: {} });
  });

  it("wants percentages", () => {
    for (const bad of ["101", "-1", "abc", "1e2"]) {
      expect(validateGrading(rows(`A:${bad}`, "F:0"), "50").bands.r0.min).toBe("Use a percentage from 0 to 100.");
    }
    expect(validateGrading(rows("A:72.5", "F:0"), "50")).toEqual({ bands: {} });
  });

  it("checks the pass mark", () => {
    const ok = rows("A:70", "F:0");
    expect(validateGrading(ok, "").passMark).toBe("Enter the pass mark.");
    expect(validateGrading(ok, "120").passMark).toBe("Use a percentage from 0 to 100.");
    expect(validateGrading(ok, "45").passMark).toBeUndefined();
  });

  it("needs at least one grade", () => {
    expect(validateGrading([], "50").scale).toBe("Add at least one grade.");
  });
});

describe("editing", () => {
  it("adds a grade above the 0% floor, halfway down", () => {
    const { rows: next, id } = addBand(rows("A:70", "F:0"));
    expect(next.map((r) => r.letter)).toEqual(["A", "", "F"]);
    expect(next[1]).toMatchObject({ id, min: "35" });
  });

  it("adds a grade at the end when the last does not start at 0", () => {
    const { rows: next } = addBand(rows("A:70", "B:"));
    expect(next.map((r) => r.letter)).toEqual(["A", "B", ""]);
    expect(addBand([]).rows).toHaveLength(1);
  });

  it("deletes and updates a row", () => {
    expect(removeBand(rows("A:70", "B:60", "F:0"), "r1").map((r) => r.letter)).toEqual(["A", "F"]);
    expect(updateBand(rows("A:70"), "r0", { remark: "Top" })[0].remark).toBe("Top");
  });

  it("moves a grade by swapping letters and remarks; the minimums stay in order", () => {
    const moved = moveBand(rows("A:70:Top", "C:60:Mid", "B:50:Low", "F:0"), 2, -1);
    expect(moved.map((r) => `${r.letter}${r.min}${r.remark}`)).toEqual(["A70Top", "B60Low", "C50Mid", "F0"]);
    // The row id travels with the letter, so focus and errors follow it.
    expect(moved[1].id).toBe("r2");
    expect(moveBand(rows("A:70", "F:0"), 0, -1).map((r) => r.letter)).toEqual(["A", "F"]);
  });

  it("sorts rows by minimum when they are out of order", () => {
    const shuffled = rows("F:0", "A:70", "C:50");
    expect(isDescending(shuffled)).toBe(false);
    expect(sortBands(shuffled).map((r) => r.letter)).toEqual(["A", "C", "F"]);
    expect(isDescending(sortBands(shuffled))).toBe(true);
  });
});

describe("payload and dirty state", () => {
  it("sends trimmed letters, numeric minimums, remarks only when given, and the pass mark", () => {
    expect(toGradingPayload(rows(" A :70:Excellent ", "F:0:"), "45")).toEqual({
      gradeScale: [
        { letter: "A", min: 70, remark: "Excellent" },
        { letter: "F", min: 0 },
      ],
      passMark: 45,
    });
  });

  it("is dirty only when something changed", () => {
    const saved = { gradeScale: [{ letter: "A", min: 70, remark: "Top" }, { letter: "F", min: 0 }], passMark: 50 };
    expect(isGradingDirty(rows("A:70:Top", "F:0"), "50", saved)).toBe(false);
    expect(isGradingDirty(rows("A:75:Top", "F:0"), "50", saved)).toBe(true);
    expect(isGradingDirty(rows("A:70:Top", "F:0"), "40", saved)).toBe(true);
    expect(isGradingDirty(rows("A:70:Top", "F:0"), "", saved)).toBe(true);
  });

  it("knows the default scale", () => {
    expect(isDefaultGrading(toBandDrafts(DEFAULT_GRADE_SCALE), "50")).toBe(true);
    expect(isDefaultGrading(toBandDrafts(DEFAULT_GRADE_SCALE), "40")).toBe(false);
  });
});

describe("preview", () => {
  it("lays the bands on 0–100, lowest first, with readable ranges", () => {
    const bands = previewGrading(rows("A:70", "B:60", "F:0"), "60");
    expect(bands.map((b) => [b.letter, b.from, b.to, b.passes])).toEqual([
      ["F", 0, 60, false],
      ["B", 60, 70, true],
      ["A", 70, 100, true],
    ]);
    expect(bands[2].range).toBe("70% and above");
    expect(bands[1].range).toBe("60% to under 70%");
    expect(bandSplitByPassMark(bands, "60")).toBeNull();
  });

  it("says which grade the pass mark splits", () => {
    const bands = previewGrading(rows("A:70", "B:60", "F:0"), "65");
    expect(bandSplitByPassMark(bands, "65")?.letter).toBe("B");
  });

  it("draws nothing for a scale that fails its checks", () => {
    expect(previewGrading(rows("A:70", "B:80", "F:0"), "50")).toEqual([]);
  });
});

describe("server errors", () => {
  it("maps gradeScale.N.field, gradeScale and passMark", () => {
    const r = rows("A:70", "B:60", "F:0");
    expect(
      mapServerGradingErrors(r, {
        "gradeScale.1.letter": "duplicate letter",
        gradeScale: "minimums must descend",
        passMark: "must be at most 100",
        other: "ignored",
      }),
    ).toEqual({
      bands: { r1: { letter: "duplicate letter" } },
      scale: "minimums must descend",
      passMark: "must be at most 100",
    });
  });

  it("parses percentages", () => {
    expect(parsePercent(" 45.5 ")).toBe(45.5);
    expect(parsePercent("100.1")).toBeNull();
  });
});
