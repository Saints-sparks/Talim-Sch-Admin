import {
  FALLBACK_AVATAR,
  countByStatus,
  filterLeaveRequests,
  formatDate,
  statusKey,
  statusValue,
  studentAvatar,
  studentName,
} from "@/components/leave/leave.presentation";
import type { LeaveRequest } from "@/app/services/leave.service";

function request(overrides: Partial<LeaveRequest> = {}): LeaveRequest {
  return {
    _id: "l1",
    child: "c1",
    startDate: "2026-09-01T00:00:00.000Z",
    endDate: "2026-09-03T00:00:00.000Z",
    leaveType: "Health Issue",
    reason: "Fever",
    status: "Pending",
    createdAt: "2026-08-30T00:00:00.000Z",
    updatedAt: "2026-08-30T00:00:00.000Z",
    studentUser: {
      _id: "u1",
      userId: "USR-1",
      email: "ada.lovelace@talim.test",
      firstName: "Ada",
      lastName: "Lovelace",
    },
    studentProfile: null,
    ...overrides,
  };
}

describe("statusKey", () => {
  it("normalises the title-cased statuses the API stores", () => {
    expect(statusKey("Pending")).toBe("pending");
    expect(statusKey("Approved")).toBe("approved");
    expect(statusKey("REJECTED")).toBe("rejected");
  });

  it("treats an unknown or missing status as still needing a decision", () => {
    expect(statusKey(undefined)).toBe("pending");
    expect(statusKey("weird")).toBe("pending");
  });
});

describe("statusValue", () => {
  it("sends the enum spelling the backend validates against", () => {
    expect(statusValue("approved")).toBe("Approved");
    expect(statusValue("rejected")).toBe("Rejected");
  });
});

describe("studentName", () => {
  it("joins the student's names", () => {
    expect(studentName(request())).toBe("Ada Lovelace");
  });

  it("falls back to the email local part when there is no name", () => {
    expect(
      studentName(request({ studentUser: { _id: "u1", userId: "USR-1", email: "grace@talim.test" } }))
    ).toBe("grace");
  });

  it("does not render 'undefined undefined' when the student record is gone", () => {
    expect(studentName(request({ studentUser: null }))).toBe("Unknown student");
  });
});

describe("studentAvatar", () => {
  it("uses the student's own avatar", () => {
    const withAvatar = request({
      studentUser: { _id: "u1", userId: "USR-1", email: "a@b.c", userAvatar: "https://cdn/a.png" },
    });
    expect(studentAvatar(withAvatar)).toBe("https://cdn/a.png");
  });

  it("falls back to the bundled placeholder", () => {
    expect(studentAvatar(request({ studentUser: null }))).toBe(FALLBACK_AVATAR);
  });
});

describe("formatDate", () => {
  it("returns a dash for a missing or unparseable date", () => {
    expect(formatDate(undefined)).toBe("-");
    expect(formatDate("nope")).toBe("-");
  });

  it("formats an ISO date", () => {
    expect(formatDate("2026-09-04T12:00:00.000Z")).toMatch(/^04 Sept? 2026$/);
  });
});

describe("countByStatus", () => {
  it("counts every tab from the whole queue", () => {
    const queue = [
      request({ _id: "a", status: "Pending" }),
      request({ _id: "b", status: "Approved" }),
      request({ _id: "c", status: "Rejected" }),
      request({ _id: "d", status: "Approved" }),
    ];
    expect(countByStatus(queue)).toEqual({ all: 4, pending: 1, approved: 2, rejected: 1 });
  });
});

describe("filterLeaveRequests", () => {
  const queue = [
    request({ _id: "a", status: "Pending", reason: "Fever" }),
    request({
      _id: "b",
      status: "Approved",
      leaveType: "Travel",
      reason: "Family trip",
      studentUser: { _id: "u2", userId: "USR-2", email: "bo@talim.test", firstName: "Bolu" },
    }),
  ];

  it("keeps everything on the all tab", () => {
    expect(filterLeaveRequests(queue, "all", "")).toHaveLength(2);
  });

  it("filters by status", () => {
    expect(filterLeaveRequests(queue, "approved", "").map((r) => r._id)).toEqual(["b"]);
  });

  it("searches the student name, leave type and reason", () => {
    expect(filterLeaveRequests(queue, "all", "bolu").map((r) => r._id)).toEqual(["b"]);
    expect(filterLeaveRequests(queue, "all", "travel").map((r) => r._id)).toEqual(["b"]);
    expect(filterLeaveRequests(queue, "all", "fever").map((r) => r._id)).toEqual(["a"]);
  });

  it("applies the tab and the search together", () => {
    expect(filterLeaveRequests(queue, "pending", "travel")).toHaveLength(0);
  });

  it("ignores surrounding whitespace in the search", () => {
    expect(filterLeaveRequests(queue, "all", "   ")).toHaveLength(2);
  });
});
