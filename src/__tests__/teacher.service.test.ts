/** @jest-environment jsdom */
import { teacherService, teacherUpdates } from "@/app/services/teacher.service";

global.fetch = jest.fn();
const mockFetch = global.fetch as jest.Mock;

const respond = (status: number, body: unknown) =>
  Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    text: () => Promise.resolve(JSON.stringify(body)),
    json: () => Promise.resolve(body),
  });
const last = () => {
  const [url, options] = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
  return { url: String(url), method: options.method, body: options.body ? JSON.parse(options.body) : undefined };
};

beforeEach(() => {
  mockFetch.mockReset();
  localStorage.setItem("accessToken", "tok");
});

describe("teacherUpdates", () => {
  it.each([
    ["personalDetails", "PATCH", "/teachers/u1/personal-details", { firstName: "Ada", email: "ada@school.edu" }],
    ["qualifications", "PATCH", "/teachers/u1/qualification-details", { yearsOfExperience: 4 }],
    ["employment", "PUT", "/teachers/u1/employment", { employmentType: "Fulltime" }],
    ["availability", "PATCH", "/teachers/u1/availability", { availabilityDays: ["Monday"] }],
    ["assignments", "PATCH", "/teachers/u1/class-course-assignments", { assignedClasses: ["c1", "c2"] }],
  ] as const)("%s → %s %s with exactly the payload", async (name, method, path, payload) => {
    mockFetch.mockReturnValueOnce(respond(200, {}));
    await (teacherUpdates as any)[name]("u1", payload);
    expect(last()).toMatchObject({ method, body: payload });
    expect(last().url.endsWith(path)).toBe(true);
  });

  it("surfaces the API error message", async () => {
    mockFetch.mockReturnValueOnce(
      respond(409, { error: { code: "CONFLICT", message: "Another account already uses this email" } }),
    );
    await expect(teacherUpdates.personalDetails("u1", { email: "taken@school.edu" })).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Another account already uses this email",
    });
  });
});

describe("teacherService.updateTeacherByCourse", () => {
  it("sends only the courses, so the teacher keeps their classes and form-teacher status", async () => {
    mockFetch.mockReturnValueOnce(respond(200, { assignedCourses: ["k1"] }));
    await teacherService.updateTeacherByCourse("t1", ["k1"]);
    expect(last().body).toEqual({ assignedCourses: ["k1"] });
  });
});
