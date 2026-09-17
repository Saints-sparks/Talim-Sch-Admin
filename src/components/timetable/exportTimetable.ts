/**
 * Excel export of the week grid.
 *
 * The sheet mirrors what is on screen — one row per hour, one column per day —
 * so a printed copy matches the page a teacher was just looking at.
 */
import * as XLSX from "xlsx";
import {
  TIME_SLOTS,
  WEEK_DAYS,
  entryForSlot,
  type TimetableGridData,
} from "./timetable.model";

/**
 * Writes the class's timetable to an .xlsx file and hands it to the browser.
 *
 * @param grid - The timetable as the page is showing it.
 * @param className - Class name, used in the file name.
 * @throws Error When the workbook cannot be written.
 */
export function downloadTimetableWorkbook(grid: TimetableGridData, className: string): void {
  const rows: string[][] = [["Time", ...WEEK_DAYS]];

  TIME_SLOTS.forEach((slot) => {
    const row = [slot.label];
    WEEK_DAYS.forEach((day) => {
      const entry = entryForSlot(grid, day, slot);
      row.push(
        entry
          ? `${entry.course}\n(${entry.subject})\n${entry.teacherName || "Unassigned teacher"}`
          : ""
      );
    });
    rows.push(row);
  });

  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(rows);

  sheet["!cols"] = [{ wch: 15 }, ...WEEK_DAYS.map(() => ({ wch: 20 }))];
  sheet["!rows"] = rows.map((_, index) => ({ hpt: index === 0 ? 20 : 60 }));

  XLSX.utils.book_append_sheet(workbook, sheet, "Timetable");

  const date = new Date().toISOString().split("T")[0];
  XLSX.writeFile(workbook, `${className}_Timetable_${date}.xlsx`);
}
