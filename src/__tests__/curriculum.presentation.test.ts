import {
  contentTeacherDisplay,
  courseDisplay,
  personName,
  resolveTeacherName,
  termDisplay,
} from "@/components/curriculum/curriculum.presentation";
import type { CurriculumContent, Teacher } from "@/app/services/subjects.service";

const teachers = [
  {
    _id: "user-1",
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@talim.test",
    isActive: true,
  },
  {
    _id: "row-2",
    userId: { _id: "user-2", firstName: "Alan", lastName: "Turing", email: "alan@talim.test" },
    isActive: true,
  },
] as unknown as Teacher[];

describe("personName", () => {
  it("joins first and last name", () => {
    expect(personName({ firstName: "Ada", lastName: "Lovelace" })).toBe("Ada Lovelace");
  });

  it("falls back to the email when there is no name", () => {
    expect(personName({ email: "ada@talim.test" })).toBe("ada@talim.test");
  });

  it("returns an empty string for nothing at all", () => {
    expect(personName(undefined)).toBe("");
    expect(personName({})).toBe("");
  });
});

describe("courseDisplay", () => {
  it("prefixes the code when the API sends one", () => {
    expect(courseDisplay({ _id: "c1", courseCode: "MTH101", title: "Algebra" })).toBe(
      "MTH101 - Algebra",
    );
  });

  it("accepts the legacy code/name aliases", () => {
    expect(courseDisplay({ _id: "c1", code: "ENG101", name: "Essays" })).toBe("ENG101 - Essays");
  });

  it("drops the separator when there is no code", () => {
    expect(courseDisplay({ _id: "c1", title: "Algebra" })).toBe("Algebra");
  });

  it("handles the null course the API can return", () => {
    expect(courseDisplay(null)).toBe("No course");
  });
});

describe("termDisplay", () => {
  it("uses the year when it is given", () => {
    expect(termDisplay({ _id: "t1", name: "First Term", year: "2025/2026" })).toBe(
      "First Term (2025/2026)",
    );
  });

  it("derives the year from the start date", () => {
    expect(termDisplay({ _id: "t1", name: "First Term", startDate: "2025-09-01" })).toBe(
      "First Term (2025)",
    );
  });

  it("falls back to the bare name", () => {
    expect(termDisplay({ _id: "t1", name: "First Term" })).toBe("First Term");
  });

  it("handles the null term the API can return", () => {
    expect(termDisplay(null)).toBe("No term");
  });
});

describe("contentTeacherDisplay", () => {
  const base = { _id: "cc1", course: null, term: null, content: "", attachments: [], createdAt: "" };

  it("prefers the flattened teacherName", () => {
    const entry = { ...base, teacherName: "Ada Lovelace" } as CurriculumContent;
    expect(contentTeacherDisplay(entry)).toBe("Ada Lovelace");
  });

  it("falls back to the populated teacher", () => {
    const entry = {
      ...base,
      teacherId: { _id: "user-2", firstName: "Alan", lastName: "Turing" },
    } as CurriculumContent;
    expect(contentTeacherDisplay(entry)).toBe("Alan Turing");
  });

  it("says so when there is no teacher", () => {
    expect(contentTeacherDisplay(base as CurriculumContent)).toBe("No teacher assigned");
  });
});

describe("resolveTeacherName", () => {
  it("uses a populated teacher without touching the roster", () => {
    expect(resolveTeacherName({ firstName: "Grace", lastName: "Hopper" }, [])).toBe("Grace Hopper");
  });

  it("reads a name nested under userId", () => {
    expect(
      resolveTeacherName({ _id: "t9", userId: { firstName: "Grace", lastName: "Hopper" } }, []),
    ).toBe("Grace Hopper");
  });

  it("looks a bare id up in the roster", () => {
    expect(resolveTeacherName("user-1", teachers)).toBe("Ada Lovelace");
  });

  it("matches a roster row by its populated userId", () => {
    expect(resolveTeacherName("user-2", teachers)).toBe("Alan Turing");
  });

  it("returns a placeholder for an unknown or missing teacher", () => {
    expect(resolveTeacherName("nobody", teachers)).toBe("No teacher");
    expect(resolveTeacherName(undefined, teachers)).toBe("No teacher");
    expect(resolveTeacherName(null, teachers)).toBe("No teacher");
  });
});
