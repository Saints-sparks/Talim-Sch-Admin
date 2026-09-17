/** @jest-environment jsdom */
import { SECTIONS, visibleSections } from "@/components/settings/sections";
import { academicProgress } from "@/hooks/settings/useAcademicSetup";
import { MAX_IMAGE_BYTES, validateSettingsImage } from "@/hooks/settings/useImageUpload";
import { maskEmail } from "@/components/settings/SecuritySection";

describe("visibleSections", () => {
  it("hides Sub-Admins from anyone who cannot manage sub-admins", () => {
    const ids = visibleSections(false).map((s) => s.id);
    expect(ids).not.toContain("sub-admins");
    expect(ids).toHaveLength(SECTIONS.length - 1);
  });

  it("shows every section to a primary admin with manage:sub_admins", () => {
    expect(visibleSections(true).map((s) => s.id)).toEqual(SECTIONS.map((s) => s.id));
  });

  it("marks exactly one section as primary-admin only", () => {
    expect(SECTIONS.filter((s) => s.fullAdminOnly).map((s) => s.id)).toEqual(["sub-admins"]);
  });
});

describe("academicProgress", () => {
  const year = {
    _id: "y1",
    year: "2025/2026",
    startDate: "2025-01-01T00:00:00.000Z",
    endDate: "2025-12-31T00:00:00.000Z",
    schoolId: "s1",
    isCurrent: true,
    createdAt: "",
    updatedAt: "",
  };

  it("is null without a current year", () => {
    expect(academicProgress(undefined)).toBeNull();
  });

  it("is null when the dates cannot make a span", () => {
    expect(academicProgress({ ...year, endDate: year.startDate })).toBeNull();
    expect(academicProgress({ ...year, startDate: "", endDate: "" })).toBeNull();
  });

  it("clamps to 0% before the year starts and 100% after it ends", () => {
    expect(academicProgress(year, new Date("2024-06-01").getTime())?.pct).toBe(0);
    const after = academicProgress(year, new Date("2026-06-01").getTime());
    expect(after?.pct).toBe(100);
    expect(after?.daysRemaining).toBe(0);
  });

  it("reports the share of the year elapsed", () => {
    const half = academicProgress(year, new Date("2025-07-02T12:00:00.000Z").getTime());
    expect(half?.pct).toBe(50);
    expect(half?.daysElapsed).toBeGreaterThan(180);
    expect(half?.daysRemaining).toBeGreaterThan(180);
  });
});

describe("validateSettingsImage", () => {
  const file = (type: string, size: number) => {
    const f = new File(["x"], "logo", { type });
    Object.defineProperty(f, "size", { value: size });
    return f;
  };

  it("accepts PNG and JPEG under the limit", () => {
    expect(validateSettingsImage(file("image/png", 1000))).toBeNull();
    expect(validateSettingsImage(file("image/jpeg", MAX_IMAGE_BYTES))).toBeNull();
  });

  it("rejects another type", () => {
    expect(validateSettingsImage(file("image/gif", 10))).toMatch(/PNG or JPG/);
  });

  it("rejects a file over 2MB", () => {
    expect(validateSettingsImage(file("image/png", MAX_IMAGE_BYTES + 1))).toMatch(/2MB/);
  });
});

describe("maskEmail", () => {
  it("keeps the first three characters and the domain", () => {
    expect(maskEmail("administrator@talim.test")).toBe("adm**********@talim.test");
  });

  it("handles a short local part and a missing address", () => {
    expect(maskEmail("ab@talim.test")).toBe("ab@talim.test");
    expect(maskEmail(undefined)).toBe("—");
    expect(maskEmail("not-an-email")).toBe("—");
  });
});
