import {
  TIME_SLOTS,
  buildTeacherNameMap,
  colorForCourse,
  courseSubjectId,
  courseSubjectName,
  courseTeacherName,
  entryForSlot,
  isGridEmpty,
  normalizeTime,
  toApiTime,
  toGridData,
  type TimetableGridData,
} from "@/components/timetable/timetable.model";
import type { TimetableCourse } from "@/app/services/timetable.service";

// ─── Time formats ─────────────────────────────────────────────────────────────

describe("normalizeTime", () => {
  it("strips the leading zero from a 24-hour time", () => {
    expect(normalizeTime("08:00")).toBe("8:00");
    expect(normalizeTime("13:30")).toBe("13:30");
  });

  it("converts the 12-hour times older entries were stored with", () => {
    expect(normalizeTime("08:00 AM")).toBe("8:00");
    expect(normalizeTime("01:00 PM")).toBe("13:00");
    expect(normalizeTime("12:00 PM")).toBe("12:00");
    expect(normalizeTime("12:30 AM")).toBe("0:30");
  });

  it("returns an empty string when there is no time", () => {
    expect(normalizeTime(undefined)).toBe("");
    expect(normalizeTime("")).toBe("");
  });
});

describe("toApiTime", () => {
  it("pads a slot time to the HH:mm the API stores", () => {
    expect(toApiTime("8:00")).toBe("08:00");
    expect(toApiTime("14:00")).toBe("14:00");
  });
});

// ─── Slot matching ────────────────────────────────────────────────────────────

describe("entryForSlot", () => {
  const grid: TimetableGridData = {
    Monday: [
      {
        _id: "e1",
        time: "08:00 - 09:00",
        startTime: "08:00",
        endTime: "09:00",
        course: "Maths",
        subject: "Mathematics",
        class: "c1",
        courseId: "co1",
        subjectId: "s1",
        day: "Monday",
        teacherName: "Ada L",
      },
      {
        _id: "e2",
        time: "01:00 PM - 02:00 PM",
        startTime: "01:00 PM",
        endTime: "02:00 PM",
        course: "Physics",
        subject: "Physics",
        class: "c1",
        courseId: "co2",
        subjectId: "s2",
        day: "Monday",
        teacherName: "Bola O",
      },
    ],
  };

  it("matches a zero-padded 24-hour entry against the slot", () => {
    expect(entryForSlot(grid, "Monday", TIME_SLOTS[0])?._id).toBe("e1");
  });

  it("matches a legacy 12-hour entry against the same slot grid", () => {
    const afternoon = TIME_SLOTS.find((s) => s.label === "13:00 - 14:00");
    expect(entryForSlot(grid, "Monday", afternoon!)?._id).toBe("e2");
  });

  it("returns nothing for a free cell or an unscheduled day", () => {
    expect(entryForSlot(grid, "Monday", TIME_SLOTS[2])).toBeUndefined();
    expect(entryForSlot(grid, "Friday", TIME_SLOTS[0])).toBeUndefined();
  });
});

describe("isGridEmpty", () => {
  it("treats a grid with no days and a grid with only empty days as empty", () => {
    expect(isGridEmpty({})).toBe(true);
    expect(isGridEmpty({ Monday: [] })).toBe(true);
  });
});

// ─── Card colour ──────────────────────────────────────────────────────────────

describe("colorForCourse", () => {
  it("gives the same course the same colour every time", () => {
    expect(colorForCourse("course-abc")).toBe(colorForCourse("course-abc"));
  });

  it("falls back to the first colour when a card has no course id", () => {
    expect(colorForCourse(undefined).border).toBe(colorForCourse("").border);
  });
});

// ─── Course helpers ───────────────────────────────────────────────────────────

describe("course helpers", () => {
  const populated: TimetableCourse = {
    _id: "co1",
    title: "Algebra",
    subjectId: { _id: "s1", name: "Mathematics", code: "MTH" },
    teacherId: { _id: "t1", userId: { firstName: "Ada", lastName: "Lovelace" } },
  };

  const bare: TimetableCourse = {
    _id: "co2",
    title: "Physics",
    subjectId: "s2",
    teacherId: "t2",
  };

  it("reads the subject id whether or not the API populated it", () => {
    expect(courseSubjectId(populated)).toBe("s1");
    expect(courseSubjectId(bare)).toBe("s2");
  });

  it("names the subject from the populated record, else says Subject", () => {
    expect(courseSubjectName(populated)).toBe("Mathematics");
    expect(courseSubjectName(bare)).toBe("Subject");
  });

  it("names the teacher from a populated record", () => {
    expect(courseTeacherName(populated, new Map())).toBe("Ada Lovelace");
  });

  it("looks a bare teacher id up in the directory map", () => {
    const names = new Map([["t2", "Bola Okoro"]]);
    expect(courseTeacherName(bare, names)).toBe("Bola Okoro");
  });

  it("says Unassigned when there is no teacher or no match", () => {
    expect(courseTeacherName({ _id: "c", title: "x", subjectId: "s" }, new Map())).toBe(
      "Unassigned"
    );
    expect(courseTeacherName(bare, new Map())).toBe("Unassigned");
    expect(courseTeacherName(undefined, new Map())).toBe("Unassigned");
  });
});

describe("buildTeacherNameMap", () => {
  it("indexes a teacher by both their record id and their user id", () => {
    const map = buildTeacherNameMap([
      { _id: "t1", userId: { _id: "u1", firstName: "Ada", lastName: "Lovelace" } },
    ]);
    expect(map.get("t1")).toBe("Ada Lovelace");
    expect(map.get("u1")).toBe("Ada Lovelace");
  });

  it("falls back to the email, then to a generic label", () => {
    const map = buildTeacherNameMap([
      { _id: "t2", email: "teacher@talim.test" },
      { _id: "t3" },
    ]);
    expect(map.get("t2")).toBe("teacher@talim.test");
    expect(map.get("t3")).toBe("Teacher");
  });
});

// ─── Grid assembly ────────────────────────────────────────────────────────────

describe("toGridData", () => {
  const courses: TimetableCourse[] = [
    {
      _id: "co1",
      title: "Algebra",
      subjectId: { _id: "s1", name: "Mathematics" },
      teacherId: "t1",
    },
  ];
  const teacherNames = new Map([["t1", "Ada Lovelace"]]);

  it("fills in the course, subject and teacher the API leaves blank", () => {
    const grid = toGridData(
      {
        Monday: [
          {
            _id: "e1",
            time: "08:00 - 09:00",
            startTime: "08:00",
            endTime: "09:00",
            courseId: "co1",
            teacherName: "Unassigned teacher",
          },
        ],
      },
      courses,
      teacherNames,
      "class-1"
    );

    expect(grid.Monday[0]).toMatchObject({
      course: "Algebra",
      subject: "Mathematics",
      teacherName: "Ada Lovelace",
      class: "class-1",
      courseId: "co1",
      subjectId: "s1",
      day: "Monday",
    });
  });

  it("keeps a real teacher name the API did send", () => {
    const grid = toGridData(
      {
        Monday: [
          {
            _id: "e1",
            time: "08:00 - 09:00",
            startTime: "08:00",
            endTime: "09:00",
            courseId: "co1",
            teacherName: "Bola Okoro",
          },
        ],
      },
      courses,
      teacherNames,
      "class-1"
    );
    expect(grid.Monday[0].teacherName).toBe("Bola Okoro");
  });

  it("reads the misspelled startTIme the API still sends", () => {
    const grid = toGridData(
      {
        Monday: [
          {
            _id: "e1",
            time: "08:00 - 09:00",
            startTime: "",
            startTIme: "08:00",
            endTime: "09:00",
            courseId: "co1",
          },
        ],
      },
      courses,
      teacherNames,
      "class-1"
    );
    expect(grid.Monday[0].startTime).toBe("08:00");
  });

  it("falls back to placeholders for a course it cannot resolve", () => {
    const grid = toGridData(
      {
        Monday: [
          { _id: "e9", time: "", startTime: "08:00", endTime: "09:00", courseId: "gone" },
        ],
      },
      courses,
      teacherNames,
      "class-1"
    );
    expect(grid.Monday[0]).toMatchObject({
      course: "Course",
      subject: "Subject",
      teacherName: "Unassigned",
    });
  });
});
