/** @jest-environment jsdom */
/**
 * Settings → Data → Import past records: the state machine (validating →
 * invalid | valid → committing → done | failed), the file checks, the report
 * helpers, the guide's Markdown reader and the guide sync script.
 */
import React from "react";
import userEvent from "@testing-library/user-event";
import { mockSubAdmin, render, screen, waitFor, within } from "@/test-utils/render";
import { isFullAdminOnly } from "@/lib/routePermissions";
import { DataSystemSection } from "@/components/settings/DataSystemSection";
import { toast } from "@/components/CustomToast";
import { ApiError } from "@/lib/apiError";
import type { ImportJob, ImportJobStatus } from "@/app/services/imports.service";
import {
  commitImport,
  downloadImportErrors,
  getImport,
  listImports,
  uploadImport,
} from "@/app/services/imports.service";
import {
  canCommitImport,
  collectionLabel,
  importFileProblem,
  importStage,
  isImportRunning,
  issueRowLabel,
  phaseLabel,
  progressPercent,
  sheetCounts,
} from "@/components/settings/imports/importState";
import {
  HistoryImportPage,
  commitErrorMessage,
} from "@/components/settings/imports/HistoryImportPage";
import { parseMarkdown } from "@/components/settings/imports/GuideMarkdown";
import { fileNameFromDisposition } from "@/lib/download";
import { guideModule } from "../../scripts/sync-import-guide.mjs";

jest.mock("next/navigation", () => ({
  usePathname: () => "/settings",
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));
jest.mock("@/components/CustomToast", () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn(), warning: jest.fn() },
}));
jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("@/components/settings/imports/importState", () => ({
  ...jest.requireActual("@/components/settings/imports/importState"),
  // Poll fast so a test walks through several states in milliseconds.
  IMPORT_POLL_MS: 15,
}));
jest.mock("@/lib/download", () => ({
  ...jest.requireActual("@/lib/download"),
  saveBlob: jest.fn(),
}));
jest.mock("@/app/services/imports.service", () => ({
  ...jest.requireActual("@/app/services/imports.service"),
  uploadImport: jest.fn(),
  getImport: jest.fn(),
  listImports: jest.fn(),
  commitImport: jest.fn(),
  downloadImportErrors: jest.fn(),
  downloadImportTemplate: jest.fn(),
}));

const mocked = {
  upload: uploadImport as jest.MockedFunction<typeof uploadImport>,
  get: getImport as jest.MockedFunction<typeof getImport>,
  list: listImports as jest.MockedFunction<typeof listImports>,
  commit: commitImport as jest.MockedFunction<typeof commitImport>,
  errors: downloadImportErrors as jest.MockedFunction<typeof downloadImportErrors>,
};

const EMPTY = { items: [], page: 1, pageSize: 100, total: 0 };

/**
 * An import in a given state.
 *
 * @param status - Its status.
 * @param extra - Fields to override.
 * @returns The import.
 */
function job(status: ImportJobStatus, extra: Partial<ImportJob> = {}): ImportJob {
  return {
    id: "job-1",
    status,
    fileName: "crestview.xlsx",
    fileSize: 4_900_000,
    counts: status === "validating" ? {} : { sessions: 5, students: 612, scores: 142848 },
    errorCount: 0,
    warningCount: 0,
    progress: { phase: status === "validating" ? "validating" : "validated", done: 0, total: 0 },
    failure: null,
    createdBy: "u1",
    createdAt: "2026-10-15T09:00:00Z",
    startedAt: null,
    finishedAt: null,
    errors: EMPTY,
    warnings: EMPTY,
    result: null,
    ...extra,
  };
}

/**
 * Answers `getImport` with each state in turn, then the last one forever.
 *
 * @param states - The imports to return.
 */
function serve(...states: ImportJob[]) {
  let call = 0;
  mocked.get.mockImplementation(async () => states[Math.min(call++, states.length - 1)]);
}

const file = () =>
  new File(["x".repeat(10)], "crestview.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

beforeEach(() => {
  jest.clearAllMocks();
  mocked.list.mockResolvedValue({ items: [], page: 1, limit: 10, total: 0 });
  mocked.upload.mockResolvedValue({ id: "job-1", status: "validating" });
  mocked.commit.mockResolvedValue({ id: "job-1", status: "committing" });
});

describe("import state machine helpers", () => {
  it("maps the upload and the server status to one stage", () => {
    expect(importStage(false, null)).toBe("idle");
    expect(importStage(true, null)).toBe("uploading");
    expect(importStage(true, "valid")).toBe("uploading");
    for (const s of ["validating", "invalid", "valid", "committing", "done", "failed"] as const) {
      expect(importStage(false, s)).toBe(s);
    }
  });

  it("polls only while the server works, and commits only from valid or failed", () => {
    expect(isImportRunning("validating")).toBe(true);
    expect(isImportRunning("committing")).toBe(true);
    expect(
      ["invalid", "valid", "done", "failed"].some((s) => isImportRunning(s as ImportJobStatus))
    ).toBe(false);
    expect(canCommitImport("valid")).toBe(true);
    expect(canCommitImport("failed")).toBe(true);
    expect(canCommitImport("invalid")).toBe(false);
    expect(canCommitImport("committing")).toBe(false);
    expect(canCommitImport(undefined)).toBe(false);
  });

  it("checks a file's kind and size before sending it", () => {
    expect(importFileProblem({ name: "pack.XLSX", size: 10 })).toBeNull();
    expect(importFileProblem({ name: "pack.zip", size: 10 })).toBeNull();
    expect(importFileProblem({ name: "Scores.csv", size: 10 })).toBeNull();
    expect(importFileProblem({ name: "pack.xls", size: 10 })).toMatch(/Excel workbook/);
    expect(importFileProblem({ name: "pack.xlsx", size: 50 * 1024 * 1024 + 1 })).toMatch(/50 MB/);
    expect(importFileProblem({ name: "pack.xlsx", size: 0 })).toMatch(/empty/);
  });

  it("lists sheet counts in workbook order, unknown sheets last", () => {
    expect(sheetCounts({ scores: 3, sessions: 1, extra: 2, classSubjects: 4 })).toEqual([
      { label: "Sessions", count: 1 },
      { label: "ClassSubjects", count: 4 },
      { label: "Scores", count: 3 },
      { label: "extra", count: 2 },
    ]);
    expect(sheetCounts(undefined)).toEqual([]);
  });

  it("words phases, progress, collections and issue rows", () => {
    expect(phaseLabel("results")).toBe("Scores and results");
    expect(phaseLabel("mystery")).toBe("Mystery");
    expect(phaseLabel(undefined)).toBe("Waiting to start");
    expect(progressPercent({ phase: "results", done: 52000, total: 142848 })).toBe(36);
    expect(progressPercent({ phase: "queued", done: 0, total: 0 })).toBeNull();
    expect(progressPercent({ phase: "results", done: 9, total: 4 })).toBe(100);
    expect(collectionLabel("assessmentGradeRecords")).toBe("Scores");
    expect(collectionLabel("somethingNew")).toBe("somethingNew");
    expect(issueRowLabel({ sheet: "Scores", row: 14 })).toBe("14");
    expect(issueRowLabel({ sheet: "Scores", row: 0 })).toBe("Whole sheet");
    expect(issueRowLabel({ sheet: "", row: 0 })).toBe("File");
  });

  it("explains the commit refusals", () => {
    const busy = new ApiError("CONFLICT", "x", 409, [], undefined, { code: "IMPORT_IN_PROGRESS" });
    const notValid = new ApiError("CONFLICT", "x", 409, [], undefined, {
      code: "IMPORT_NOT_VALID",
      importStatus: "invalid",
    });
    expect(commitErrorMessage(busy)).toMatch(/Another import/);
    expect(commitErrorMessage(notValid)).toMatch(/corrected file/);
    expect(commitErrorMessage(new ApiError("INTERNAL_ERROR", "Boom", 500))).toBe("Boom");
  });

  it("reads the file name a download suggests", () => {
    expect(fileNameFromDisposition('attachment; filename="talim-past-records-template.xlsx"')).toBe(
      "talim-past-records-template.xlsx"
    );
    expect(fileNameFromDisposition("attachment; filename*=UTF-8''a%20b.csv")).toBe("a b.csv");
    expect(fileNameFromDisposition(null)).toBeNull();
  });
});

describe("HistoryImportPage", () => {
  it("uploads a file, polls while checking and shows an invalid report with its errors", async () => {
    const user = userEvent.setup();
    serve(
      job("validating"),
      job("invalid", {
        errorCount: 2,
        errors: {
          items: [
            {
              sheet: "Scores",
              row: 14,
              column: "score",
              message: "21 is more than CA 1's maximum of 20.",
            },
            { sheet: "", row: 0, column: "", message: "The file could not be read." },
          ],
          page: 1,
          pageSize: 100,
          total: 2,
        },
      })
    );
    mocked.errors.mockResolvedValue({ blob: new Blob(["a"]), fileName: "crestview-errors.csv" });
    render(<HistoryImportPage />);

    await user.upload(screen.getByLabelText("Past records file"), file());
    expect(mocked.upload).toHaveBeenCalledTimes(1);

    expect(
      await screen.findByRole("progressbar", { name: "Checking the file" })
    ).toBeInTheDocument();
    expect(await screen.findByText("2 problems to fix")).toBeInTheDocument();
    const errors = screen.getByRole("region", { name: "Errors" });
    expect(within(errors).getByText("21 is more than CA 1's maximum of 20.")).toBeInTheDocument();
    expect(within(errors).getByText("File")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Rows per sheet" })).toHaveTextContent("142,848");
    expect(screen.queryByRole("button", { name: "Import" })).toBeNull();
    // The admin can upload a corrected file straight away.
    expect(screen.getByText("Upload a corrected file")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Download all errors \(CSV\)/ }));
    await waitFor(() => expect(mocked.errors).toHaveBeenCalledWith("job-1"));
  });

  it("refuses a file of the wrong kind without uploading it", async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<HistoryImportPage />);
    await user.upload(screen.getByLabelText("Past records file"), new File(["x"], "notes.pdf"));
    expect(await screen.findByRole("alert")).toHaveTextContent(/Excel workbook/);
    expect(mocked.upload).not.toHaveBeenCalled();
  });

  it("commits a valid import, follows its progress and shows what was written", async () => {
    const user = userEvent.setup();
    serve(
      job("valid", {
        warningCount: 1,
        warnings: {
          items: [{ sheet: "Teachers", row: 3, column: "email", message: "No email." }],
          page: 1,
          pageSize: 100,
          total: 1,
        },
      })
    );
    render(<HistoryImportPage />);
    await user.upload(screen.getByLabelText("Past records file"), file());

    expect(await screen.findByText("Every row checked")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Warnings" })).toHaveTextContent("No email.");

    serve(
      job("committing", { progress: { phase: "results", done: 50, total: 100 } }),
      job("done", {
        finishedAt: "2026-10-15T09:01:00Z",
        result: {
          students: { created: 612, updated: 0 },
          assessmentGradeRecords: { created: 142848, updated: 0 },
        },
      })
    );
    await user.click(screen.getByRole("button", { name: "Import" }));
    const sheet = await screen.findByRole("dialog", { name: "Import these records?" });
    await user.click(within(sheet).getByRole("button", { name: "Import" }));
    expect(mocked.commit).toHaveBeenCalledWith("job-1");

    expect(await screen.findByRole("progressbar", { name: "Importing" })).toBeInTheDocument();
    expect(screen.getByText("Scores and results")).toBeInTheDocument();
    const written = await screen.findByRole("region", { name: "What was imported" });
    expect(within(written).getByText("Scores")).toBeInTheDocument();
    expect(within(written).getByText("142,848")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Imported");
  });

  it("offers Try again after a failed write, which commits again", async () => {
    const user = userEvent.setup();
    serve(job("failed", { failure: "Lost the database connection." }));
    render(<HistoryImportPage />);
    await user.upload(screen.getByLabelText("Past records file"), file());

    expect(await screen.findByText("The import stopped")).toBeInTheDocument();
    expect(screen.getByText(/Lost the database connection\./)).toBeInTheDocument();
    serve(job("committing"), job("done", { result: { students: { created: 1, updated: 0 } } }));
    await user.click(screen.getByRole("button", { name: /Try again/ }));
    expect(mocked.commit).toHaveBeenCalledWith("job-1");
    expect(await screen.findByRole("region", { name: "What was imported" })).toBeInTheDocument();
  });

  it("explains a refused commit", async () => {
    const user = userEvent.setup();
    serve(job("valid"));
    mocked.commit.mockRejectedValue(
      new ApiError("CONFLICT", "busy", 409, [], undefined, { code: "IMPORT_IN_PROGRESS" })
    );
    render(<HistoryImportPage />);
    await user.upload(screen.getByLabelText("Past records file"), file());
    await user.click(await screen.findByRole("button", { name: "Import" }));
    const sheet = await screen.findByRole("dialog", { name: "Import these records?" });
    await user.click(within(sheet).getByRole("button", { name: "Import" }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Another import for your school is being written. Wait for it to finish, then try again."
      )
    );
  });

  it("lists past imports and opens one", async () => {
    const user = userEvent.setup();
    const done = job("done", {
      id: "job-9",
      fileName: "2021.xlsx",
      result: { students: { created: 3, updated: 0 } },
    });
    mocked.list.mockResolvedValue({ items: [done], page: 1, limit: 10, total: 1 });
    serve(done);
    render(<HistoryImportPage />);
    const list = await screen.findByRole("region", { name: "Past imports" });
    expect(await within(list).findByText("Imported")).toBeInTheDocument();
    await user.click(within(list).getByRole("button", { name: "View 2021.xlsx" }));
    await waitFor(() => expect(mocked.get).toHaveBeenCalledWith("job-9", 1, 1));
    expect(await screen.findByRole("region", { name: "What was imported" })).toBeInTheDocument();
  });
});

describe("import guide", () => {
  it("reads headings, rules, tables and nested lists", () => {
    const blocks = parseMarkdown(
      [
        "# Title",
        "",
        "Intro line one",
        "line two with `code` and **bold**.",
        "",
        "---",
        "",
        "| Column | Notes |",
        "| --- | --- |",
        "| `session`* | Name. |",
        "",
        "1. **Upload** the file.",
        "   It is checked.",
        "2. **Read the report.**",
        "   - **Errors** must be fixed.",
        "     Download them.",
        "   - Warnings do not stop it.",
        "3. Confirm.",
      ].join("\n")
    );
    expect(blocks.map((b) => b.kind)).toEqual(["heading", "paragraph", "rule", "table", "list"]);
    expect(blocks[1]).toEqual({
      kind: "paragraph",
      text: "Intro line one line two with `code` and **bold**.",
    });
    expect(blocks[3]).toEqual({
      kind: "table",
      head: ["Column", "Notes"],
      rows: [["`session`*", "Name."]],
    });
    const list = blocks[4];
    if (list.kind !== "list") throw new Error("expected a list");
    expect(list.ordered).toBe(true);
    expect(list.items).toHaveLength(3);
    expect(list.items[0]).toEqual([
      { kind: "paragraph", text: "**Upload** the file. It is checked." },
    ]);
    const nested = list.items[1][1];
    expect(nested.kind).toBe("list");
    if (nested.kind === "list") {
      expect(nested.items).toEqual([
        [{ kind: "paragraph", text: "**Errors** must be fixed. Download them." }],
        [{ kind: "paragraph", text: "Warnings do not stop it." }],
      ]);
    }
  });

  it("is carried as a string module the sync script writes", () => {
    const source = guideModule('# A\r\nwith "quotes" and `ticks`\n');
    expect(source).toContain(
      'export const HISTORY_IMPORT_GUIDE = "# A\\nwith \\"quotes\\" and `ticks`\\n";'
    );
  });
});

describe("who reaches the import", () => {
  it("reserves /settings/import and its guide for the school admin", () => {
    expect(isFullAdminOnly("/settings/import")).toBe(true);
    expect(isFullAdminOnly("/settings/import/guide")).toBe(true);
    expect(isFullAdminOnly("/settings")).toBe(false);
  });

  it("links Data & System to the import for the school admin only", () => {
    const { unmount } = render(<DataSystemSection />);
    expect(screen.getByText("Import Past Records")).toBeInTheDocument();
    unmount();
    render(<DataSystemSection />, {
      user: { ...mockSubAdmin, permissions: ["manage:settings"] },
    });
    expect(screen.getByText("Export Students")).toBeInTheDocument();
    expect(screen.queryByText("Import Past Records")).toBeNull();
  });
});
