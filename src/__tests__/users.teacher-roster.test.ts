/** @jest-environment jsdom */
import { teacherService, teacherUserId } from "@/app/services/teacher.service";

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

const urls = () => mockFetch.mock.calls.map(([url]) => String(url));

beforeEach(() => {
  mockFetch.mockReset();
  localStorage.setItem("accessToken", "tok");
});

describe("teacherService.getTeachers", () => {
  it("never asks for more rows than the API's 500-row ceiling", async () => {
    mockFetch.mockReturnValueOnce(respond(200, { data: [], meta: { total: 0, page: 1, lastPage: 1, limit: 500 } }));
    await teacherService.getTeachers(1, 1000);
    expect(urls()[0]).toContain("limit=500");
    expect(urls()[0]).not.toContain("limit=1000");
  });

  it("getAllTeachers asks for one 500-row page", async () => {
    mockFetch.mockReturnValueOnce(respond(200, { data: [], meta: { total: 0, page: 1, lastPage: 1, limit: 500 } }));
    await teacherService.getAllTeachers();
    expect(urls()[0]).toContain("page=1");
    expect(urls()[0]).toContain("limit=500");
  });
});

describe("teacherService.getTeacherRoster", () => {
  const page = {
    data: [
      {
        _id: "a1",
        userId: { _id: "u1", firstName: "Ada" },
        isActive: true,
        teacherProfile: {
          hasTeacherProfile: true,
          staffNumber: "TCH-001",
          isFormTeacher: true,
          classTeacherClasses: [{ _id: "c1", name: "JSS1" }],
          assignedCourses: [{ _id: "k1" }],
          classTeacherOf: [{ id: "c1", name: "JSS1" }],
        },
      },
      { _id: "b1", userId: { _id: "u2", firstName: "Bimpe" }, isActive: true, teacherProfile: null },
    ],
    meta: { total: 2, page: 1, lastPage: 1, limit: 9 },
  };

  it("fills the page from one list request, with each row's teacherProfile", async () => {
    mockFetch.mockReturnValueOnce(respond(200, page));

    const result = await teacherService.getTeacherRoster(1, 9);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(urls()[0]).toContain("/users/teachers?");
    expect(result.data[0]).toMatchObject({
      staffNumber: "TCH-001",
      isFormTeacher: true,
      hasTeacherProfile: true,
      assignedClasses: [{ _id: "c1", name: "JSS1" }],
      assignedCourses: [{ _id: "k1" }],
      classTeacherOf: [{ id: "c1", name: "JSS1" }],
    });
    expect(result.meta.total).toBe(2);
  });

  it("keeps a teacher without a profile, flagged as setup pending", async () => {
    mockFetch.mockReturnValueOnce(respond(200, page));

    const result = await teacherService.getTeacherRoster(1, 9);

    expect(result.data).toHaveLength(2);
    expect(result.data[1]).toMatchObject({ _id: "b1", hasTeacherProfile: false });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe("teacherUserId", () => {
  it("prefers the populated account id", () => {
    expect(teacherUserId({ _id: "a1", userId: { _id: "u1" }, isActive: true } as never)).toBe("u1");
  });

  it("falls back to the row id when the account is not populated", () => {
    expect(teacherUserId({ _id: "a1", userId: "u1", isActive: true } as never)).toBe("a1");
  });
});
