/** @jest-environment jsdom */
import {
  downloadAsCsv,
  fetchExportData,
  getFinanceSettings,
  getReceiptSettings,
  getSchoolProfile,
  updateFinanceSettings,
  updateReceiptSettings,
  updateSchoolProfile,
} from "@/app/services/school-settings.service";
import { api } from "@/lib/apiClient";

jest.mock("@/lib/apiClient", () => ({
  api: { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const mockGet = api.get as jest.Mock;
const mockPatch = api.patch as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe("school profile", () => {
  it("reads the profile from /settings/school-profile", async () => {
    const school = { _id: "s1", name: "Talim High" };
    mockGet.mockResolvedValueOnce({ success: true, school });
    await expect(getSchoolProfile()).resolves.toEqual({ success: true, school });
    expect(mockGet).toHaveBeenCalledWith("/settings/school-profile");
  });

  it("patches only the fields it is given", async () => {
    mockPatch.mockResolvedValueOnce({ success: true, school: {} });
    await updateSchoolProfile({ physicalAddress: "12 Lagos Road" });
    expect(mockPatch).toHaveBeenCalledWith("/settings/school-profile", {
      physicalAddress: "12 Lagos Road",
    });
  });

  it("lets an ApiError from the client through untouched", async () => {
    const error = new Error("boom");
    mockGet.mockRejectedValueOnce(error);
    await expect(getSchoolProfile()).rejects.toBe(error);
  });
});

describe("receipt and finance settings", () => {
  it("reads and writes receipt settings", async () => {
    mockGet.mockResolvedValueOnce({ success: true, settings: { footerNote: "" } });
    await getReceiptSettings();
    expect(mockGet).toHaveBeenCalledWith("/settings/receipt");

    mockPatch.mockResolvedValueOnce({ success: true, settings: {} });
    await updateReceiptSettings({ showSchoolLogo: false });
    expect(mockPatch).toHaveBeenCalledWith("/settings/receipt", { showSchoolLogo: false });
  });

  it("reads and writes finance settings", async () => {
    mockGet.mockResolvedValueOnce({ success: true, settings: { minimumWithdrawalAmount: 10000 } });
    await getFinanceSettings();
    expect(mockGet).toHaveBeenCalledWith("/settings/finance");

    mockPatch.mockResolvedValueOnce({ success: true, settings: {} });
    await updateFinanceSettings({ minimumWithdrawalAmount: 5000 });
    expect(mockPatch).toHaveBeenCalledWith("/settings/finance", { minimumWithdrawalAmount: 5000 });
  });
});

describe("data export", () => {
  it("requests the dataset by type", async () => {
    mockGet.mockResolvedValueOnce({ success: true, type: "students", data: [], count: 0 });
    await fetchExportData("students");
    expect(mockGet).toHaveBeenCalledWith("/settings/data/export/students");
  });
});

/** jsdom's Blob has no `.text()`, so read it the long way. */
function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

describe("downloadAsCsv", () => {
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  let captured: { href?: string; download?: string; clicked: boolean };

  beforeEach(() => {
    captured = { clicked: false };
    URL.createObjectURL = jest.fn(() => "blob:csv");
    URL.revokeObjectURL = jest.fn();
    jest.spyOn(document, "createElement").mockImplementation(((tag: string) => {
      if (tag !== "a") return originalCreateElement.call(document, tag);
      return {
        set href(v: string) {
          captured.href = v;
        },
        set download(v: string) {
          captured.download = v;
        },
        click: () => {
          captured.clicked = true;
        },
      } as unknown as HTMLElement;
    }) as typeof document.createElement);
  });

  const originalCreateElement = document.createElement;

  afterEach(() => {
    (document.createElement as jest.Mock).mockRestore?.();
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  });

  it("does nothing when there are no rows", () => {
    downloadAsCsv([], "empty.csv");
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("writes a header row and escapes embedded quotes", async () => {
    const blobs: Blob[] = [];
    (URL.createObjectURL as jest.Mock).mockImplementation((blob: Blob) => {
      blobs.push(blob);
      return "blob:csv";
    });

    downloadAsCsv([{ name: 'Ade "Baba" Ojo', email: "ade@talim.test" }], "students.csv");

    expect(captured.download).toBe("students.csv");
    expect(captured.clicked).toBe(true);
    expect(blobs).toHaveLength(1);
    await expect(readBlob(blobs[0])).resolves.toBe(
      'name,email\n"Ade ""Baba"" Ojo","ade@talim.test"'
    );
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:csv");
  });
});
