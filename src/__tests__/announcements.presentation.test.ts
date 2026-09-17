import {
  AUDIENCE_OPTIONS,
  TAB_STATUS,
  audienceLabels,
  clampPercent,
  formatDateTime,
  statusLabel,
  toDashboardAnnouncement,
} from "@/components/announcements/announcement.presentation";
import type { CreateAnnouncementResponse } from "@/app/services/announcement.service";

describe("statusLabel", () => {
  it.each([
    ["PUBLISHED", "Published"],
    ["SCHEDULED", "Scheduled"],
    ["DRAFT", "Draft"],
    ["ARCHIVED", "Archived"],
    ["scheduled", "Scheduled"],
  ])("maps %s to %s", (stored, label) => {
    expect(statusLabel(stored)).toBe(label);
  });

  it("falls back to Published for an unknown or missing status", () => {
    expect(statusLabel(undefined)).toBe("Published");
    expect(statusLabel("PENDING")).toBe("Published");
  });
});

describe("audienceLabels", () => {
  it("labels the backend enum values", () => {
    expect(audienceLabels(["all_parents", "all_teachers"])).toEqual(["All Parents", "All Teachers"]);
  });

  it("accepts the spaced legacy spelling stored by older clients", () => {
    expect(audienceLabels(["All Students"])).toEqual(["All Students"]);
  });

  it("de-duplicates aliases of the same audience", () => {
    expect(audienceLabels(["parents", "all_parents"])).toEqual(["All Parents"]);
  });

  it("defaults to All Parents, which is what the API defaults to", () => {
    expect(audienceLabels([])).toEqual(["All Parents"]);
    expect(audienceLabels(undefined)).toEqual(["All Parents"]);
  });

  it("drops values the backend does not know", () => {
    expect(audienceLabels(["martians"])).toEqual(["All Parents"]);
  });
});

describe("AUDIENCE_OPTIONS", () => {
  it("offers only broadcast audiences — custom needs recipient ids the UI cannot collect", () => {
    expect(AUDIENCE_OPTIONS.map((option) => option.value)).toEqual([
      "all_parents",
      "all_students",
      "all_teachers",
    ]);
  });
});

describe("TAB_STATUS", () => {
  it("asks the API for the status each tab shows", () => {
    expect(TAB_STATUS).toEqual({
      Published: "PUBLISHED",
      Scheduled: "SCHEDULED",
      Drafts: "DRAFT",
      Archived: "ARCHIVED",
    });
  });
});

describe("clampPercent", () => {
  it("holds a read rate inside its track", () => {
    expect(clampPercent(-10)).toBe(0);
    expect(clampPercent(140)).toBe(100);
    expect(clampPercent(42)).toBe(42);
  });

  it("treats a non-finite rate as zero", () => {
    expect(clampPercent(Number.NaN)).toBe(0);
  });
});

describe("formatDateTime", () => {
  it("returns a dash when there is no date", () => {
    expect(formatDateTime(null)).toBe("-");
  });

  it("returns a dash for an unparseable date instead of 'Invalid Date'", () => {
    expect(formatDateTime("not a date")).toBe("-");
  });

  it("formats an ISO timestamp", () => {
    expect(formatDateTime("2026-09-04T10:30:00.000Z")).toMatch(/^04 Sept? 2026, \d{2}:\d{2}$/);
  });
});

describe("toDashboardAnnouncement", () => {
  const base: CreateAnnouncementResponse = {
    id: "a1",
    title: "Sports day",
    content: "Saturday at nine",
    createdAt: "2026-09-01T08:00:00.000Z",
    reactions: {},
  };

  it("prefers publishedAt, then scheduledFor, then createdAt for the date column", () => {
    expect(toDashboardAnnouncement({ ...base, publishedAt: "2026-09-02T08:00:00.000Z" }).publishDate)
      .toBe("2026-09-02T08:00:00.000Z");
    expect(toDashboardAnnouncement({ ...base, scheduledFor: "2026-09-03T08:00:00.000Z" }).publishDate)
      .toBe("2026-09-03T08:00:00.000Z");
    expect(toDashboardAnnouncement(base).publishDate).toBe("2026-09-01T08:00:00.000Z");
  });

  it("clamps the read rate and defaults the missing flags", () => {
    const row = toDashboardAnnouncement({ ...base, readRate: 250 });
    expect(row.readRate).toBe(100);
    expect(row.pinned).toBe(false);
    expect(row.hasAttachment).toBe(false);
  });

  it("infers an attachment from the attachments array", () => {
    expect(toDashboardAnnouncement({ ...base, attachments: ["https://cdn/file.pdf"] }).hasAttachment)
      .toBe(true);
  });
});
