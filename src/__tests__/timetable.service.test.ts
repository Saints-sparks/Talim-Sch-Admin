import {
  createTimetableEntry,
  deleteTimetableEntry,
  getCoursesForClass,
  getTeacherDirectory,
  getTimetableByClass,
  isEmptyTimetable,
} from "@/app/services/timetable.service";
import { api } from "@/lib/apiClient";
import { ApiError } from "@/lib/apiError";

jest.mock("@/lib/apiClient", () => ({
  api: { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;
const mockDelete = api.delete as jest.Mock;

beforeEach(() => jest.clearAllMocks());

// ─── getTimetableByClass ──────────────────────────────────────────────────────

describe("getTimetableByClass", () => {
  it("returns the day-keyed grid", async () => {
    const body = {
      Monday: [{ _id: "e1", time: "08:00 - 09:00", startTime: "08:00", endTime: "09:00" }],
    };
    mockGet.mockResolvedValueOnce(body);
    await expect(getTimetableByClass("c1")).resolves.toEqual(body);
    expect(mockGet.mock.calls[0][0]).toContain("/timetable/class/c1");
  });

  it("treats the API's 404 as an empty timetable, not a failure", async () => {
    mockGet.mockRejectedValueOnce(
      new ApiError("NOT_FOUND", "No timetable found for this class", 404)
    );
    await expect(getTimetableByClass("c1")).resolves.toEqual({});
  });

  it("still surfaces a real failure", async () => {
    mockGet.mockRejectedValueOnce(new ApiError("FORBIDDEN", "No access", 403));
    await expect(getTimetableByClass("c1")).rejects.toThrow("No access");
  });
});

describe("isEmptyTimetable", () => {
  it("recognises only the not-found code", () => {
    expect(isEmptyTimetable(new ApiError("NOT_FOUND", "x", 404))).toBe(true);
    expect(isEmptyTimetable(new ApiError("INTERNAL_ERROR", "x", 500))).toBe(false);
    expect(isEmptyTimetable(new Error("boom"))).toBe(false);
    expect(isEmptyTimetable(null)).toBe(false);
  });
});

// ─── Courses and teachers ─────────────────────────────────────────────────────

describe("getCoursesForClass", () => {
  it("accepts a bare array body", async () => {
    mockGet.mockResolvedValueOnce([{ _id: "co1", title: "Algebra", subjectId: "s1" }]);
    await expect(getCoursesForClass("c1")).resolves.toHaveLength(1);
  });

  it("unwraps a { data } envelope and defaults to an empty list", async () => {
    mockGet.mockResolvedValueOnce({ data: [{ _id: "co1", title: "A", subjectId: "s" }] });
    await expect(getCoursesForClass("c1")).resolves.toHaveLength(1);
    mockGet.mockResolvedValueOnce(null);
    await expect(getCoursesForClass("c1")).resolves.toEqual([]);
  });
});

describe("getTeacherDirectory", () => {
  it("unwraps either shape the teachers endpoint returns", async () => {
    mockGet.mockResolvedValueOnce([{ _id: "t1" }]);
    await expect(getTeacherDirectory()).resolves.toEqual([{ _id: "t1" }]);
    mockGet.mockResolvedValueOnce({ data: [{ _id: "t2" }] });
    await expect(getTeacherDirectory()).resolves.toEqual([{ _id: "t2" }]);
  });
});

// ─── Writes ───────────────────────────────────────────────────────────────────

describe("createTimetableEntry", () => {
  it("posts exactly the CreateTimetableDto fields", async () => {
    mockPost.mockResolvedValueOnce({ _id: "e1" });
    await createTimetableEntry({
      classId: "c1",
      courseId: "co1",
      day: "Monday",
      startTime: "08:00",
      endTime: "09:00",
    });
    expect(mockPost.mock.calls[0][0]).toContain("/timetable");
    expect(mockPost.mock.calls[0][1]).toEqual({
      classId: "c1",
      courseId: "co1",
      day: "Monday",
      startTime: "08:00",
      endTime: "09:00",
    });
  });

  it("surfaces the server's schedule-conflict message", async () => {
    mockPost.mockRejectedValueOnce(
      new ApiError(
        "BAD_REQUEST",
        "Schedule conflict: The teacher is already assigned to another class at this time.",
        400
      )
    );
    await expect(
      createTimetableEntry({
        classId: "c1",
        courseId: "co1",
        day: "Monday",
        startTime: "08:00",
        endTime: "09:00",
      })
    ).rejects.toThrow(/Schedule conflict/);
  });
});

describe("deleteTimetableEntry", () => {
  it("deletes by entry id", async () => {
    mockDelete.mockResolvedValueOnce(null);
    await deleteTimetableEntry("e1");
    expect(mockDelete.mock.calls[0][0]).toContain("/timetable/e1");
  });

  it("throws when the entry is gone", async () => {
    mockDelete.mockRejectedValueOnce(new ApiError("NOT_FOUND", "Timetable entry not found", 404));
    await expect(deleteTimetableEntry("e9")).rejects.toThrow("Timetable entry not found");
  });
});
