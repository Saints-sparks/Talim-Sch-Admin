"use client";

/**
 * Class Timetable.
 *
 * Reading a timetable and editing one are different privileges: the page is
 * behind `manage:timetable` like the rest of the academic area, and every
 * write — drag-and-drop, Add Entry, Copy from Template, removing a lesson — is
 * additionally gated on it here, so a role that loses the permission mid-session
 * sees a read-only grid rather than buttons the API will refuse.
 *
 * The data lives in `useTimetableBoard`; this file only wires the grid, the
 * course palette and the entry dialog together.
 */

import React, { useCallback, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "@/components/CustomToast";
import { Download } from "@/components/Icons";
import { Tooltip } from "@/components/ui/Tooltip";
import { RequirePermission } from "@/components/auth/PermissionGate";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/permissions";
import { getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import type { TimetableCourse, TimetableDay } from "@/app/services/timetable.service";
import { CoursePalette } from "@/components/timetable/CoursePalette";
import { TimetableControls } from "@/components/timetable/TimetableControls";
import { TimetableEntryModal } from "@/components/timetable/TimetableEntryModal";
import { TimetableGrid } from "@/components/timetable/TimetableGrid";
import {
  NoClassSelected,
  NoTimetableNotice,
  TimetableErrorPanel,
  TimetableSkeleton,
} from "@/components/timetable/TimetableStates";
import { downloadTimetableWorkbook } from "@/components/timetable/exportTimetable";
import {
  TIME_SLOTS,
  WEEK_DAYS,
  isGridEmpty,
  toApiTime,
  type TimeSlot,
  type TimetableEntry,
} from "@/components/timetable/timetable.model";
import { useTimetableBoard } from "@/components/timetable/useTimetableBoard";

function TimetablePage() {
  const { hasPermission, isFullAdmin } = usePermissions();
  const canManage = isFullAdmin || hasPermission(Permission.MANAGE_TIMETABLE);

  const board = useTimetableBoard();
  const [draggedCourse, setDraggedCourse] = useState<TimetableCourse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);

  const { createEntry, deleteEntry, applyTemplate, grid, selectedClassId } = board;

  const handleDrop = useCallback(
    (day: string, slot: TimeSlot) => {
      if (!canManage || !draggedCourse || !selectedClassId) return;
      const course = draggedCourse;
      setDraggedCourse(null);

      createEntry.mutate(
        {
          classId: selectedClassId,
          courseId: course._id,
          day: day as TimetableDay,
          startTime: toApiTime(slot.start),
          endTime: toApiTime(slot.end),
        },
        {
          onSuccess: () => toast.success(`${course.title} added to ${day} at ${slot.label}`),
          onError: (err) => {
            logger.error("timetable", "Failed to add a timetable entry", err);
            toast.error(getErrorMessage(err, "Failed to add timetable entry"));
          },
        }
      );
    },
    [canManage, draggedCourse, selectedClassId, createEntry]
  );

  const handleCreateFromModal = useCallback(
    (values: { courseId: string; day: TimetableDay; startTime: string; endTime: string }) => {
      if (!selectedClassId) {
        toast.error("Please select a class first");
        return;
      }
      createEntry.mutate(
        { classId: selectedClassId, ...values },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            toast.success("Timetable entry added");
          },
          onError: (err) => {
            logger.error("timetable", "Failed to add a timetable entry", err);
            toast.error(getErrorMessage(err, "Failed to create timetable entry"));
          },
        }
      );
    },
    [selectedClassId, createEntry]
  );

  const handleRemoveEntry = useCallback(
    (entry: TimetableEntry) => {
      if (!canManage) return;
      if (!entry._id) {
        toast.error("This timetable entry cannot be deleted because its ID is missing");
        return;
      }
      setDeletingEntryId(entry._id);
      deleteEntry.mutate(entry._id, {
        onSuccess: () => toast.success("Entry removed from timetable"),
        onError: (err) => {
          logger.error("timetable", "Failed to remove a timetable entry", err);
          toast.error(getErrorMessage(err, "Failed to remove timetable entry"));
        },
        onSettled: () => setDeletingEntryId(null),
      });
    },
    [canManage, deleteEntry]
  );

  const handleApplyTemplate = useCallback(() => {
    if (!selectedClassId) {
      toast.error("Please select a class first");
      return;
    }
    if (board.courses.length === 0) {
      toast.error("No courses available for this class");
      return;
    }
    if (!isGridEmpty(grid)) {
      const proceed = window.confirm(
        "This will add template entries to the current timetable. Existing entries will be kept. Continue?"
      );
      if (!proceed) return;
    }

    // One course per slot, rotated by day so no day repeats the same order.
    const entries = WEEK_DAYS.flatMap((day, dayIndex) =>
      TIME_SLOTS.slice(0, Math.min(TIME_SLOTS.length, board.courses.length)).map(
        (slot, slotIndex) => ({
          classId: selectedClassId,
          courseId: board.courses[(slotIndex + dayIndex) % board.courses.length]._id,
          day,
          startTime: toApiTime(slot.start),
          endTime: toApiTime(slot.end),
        })
      )
    );

    applyTemplate.mutate(entries, {
      onSuccess: (created) => {
        if (created > 0) {
          toast.success(`Template applied with ${created} timetable entries`);
        } else {
          toast.info(
            "No template entries were added. The timetable may already be full or have conflicts."
          );
        }
      },
      onError: (err) => {
        logger.error("timetable", "Failed to apply the timetable template", err);
        toast.error(getErrorMessage(err, "Failed to apply timetable template"));
      },
    });
  }, [selectedClassId, board.courses, grid, applyTemplate]);

  const handleDownload = useCallback(() => {
    if (!selectedClassId || isGridEmpty(grid)) {
      toast.error("No timetable data to download");
      return;
    }
    try {
      downloadTimetableWorkbook(grid, board.selectedClassName);
      toast.success("Timetable downloaded successfully!");
    } catch (err) {
      logger.error("timetable", "Failed to write the timetable workbook", err);
      toast.error("Failed to download timetable");
    }
  }, [selectedClassId, grid, board.selectedClassName]);

  const handleRefresh = useCallback(() => {
    void board.refresh().then(() => toast.success("Timetable refreshed"));
  }, [board]);

  return (
    <div className="min-h-screen leading-[120%] p-8">
      <div className="flex items-center justify-between" data-guide="timetable-header">
        <h1 className="text-[19px] font-semibold text-[#1A1A1A] dark:text-slate-100">
          Class Timetable
        </h1>
        <div className="flex items-center gap-2" data-guide="timetable-actions">
          <Tooltip
            content="Reload classes, courses, and the selected class timetable after curriculum changes."
            side="top"
          >
            <button
              onClick={handleRefresh}
              disabled={board.isRefreshing}
              className="bg-white dark:bg-slate-800 border border-[#E0E0E0] dark:border-slate-600 font-semibold rounded-xl h-full flex items-center gap-2 px-4 py-2 text-[#1A1A1A] dark:text-slate-100 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-60"
              title="Refresh timetable"
              aria-label="Refresh timetable"
            >
              <RefreshCw className={`w-4 h-4 ${board.isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </Tooltip>
          <Tooltip
            content="Download the timetable as an Excel file for printing or sharing."
            side="top"
          >
            <button
              onClick={handleDownload}
              className="bg-white dark:bg-slate-800 border border-[#E0E0E0] dark:border-slate-600 font-semibold rounded-xl h-full flex items-center gap-2 px-2 py-2 text-[#1A1A1A] dark:text-slate-100 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Download
              <Download />
            </button>
          </Tooltip>
        </div>
      </div>

      <TimetableControls
        classes={board.classes}
        isLoadingClasses={board.isLoadingClasses}
        selectedClassId={selectedClassId}
        onSelectClass={board.setSelectedClassId}
        termOptions={board.termOptions}
        selectedTermId={board.selectedTermId}
        onSelectTerm={board.setSelectedTermId}
        canManage={canManage}
        hasCourses={board.courses.length > 0}
        isApplyingTemplate={applyTemplate.isPending}
        onApplyTemplate={handleApplyTemplate}
        onAddEntry={() => setIsModalOpen(true)}
      />

      <div className="flex gap-4 h-[calc(100vh-200px)]">
        <CoursePalette
          courses={board.courses}
          isLoading={board.isLoadingCourses}
          teacherNames={board.teacherNames}
          canManage={canManage}
          onDragStart={setDraggedCourse}
        />

        {/* The grid scrolls here, never the page. */}
        <div className="flex-1 overflow-auto" data-guide="timetable-grid">
          {!selectedClassId ? (
            <NoClassSelected />
          ) : board.isLoadingGrid ? (
            <TimetableSkeleton />
          ) : board.gridError ? (
            <TimetableErrorPanel
              error={board.gridError}
              onRetry={handleRefresh}
              isRetrying={board.isRefreshing}
            />
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F0F0F0] dark:border-slate-700">
              {board.isEmpty && <NoTimetableNotice canManage={canManage} />}
              <TimetableGrid
                grid={grid}
                canManage={canManage}
                deletingEntryId={deletingEntryId}
                onDropCourse={handleDrop}
                onRemoveEntry={handleRemoveEntry}
              />
            </div>
          )}
        </div>
      </div>

      {canManage && (
        <TimetableEntryModal
          open={isModalOpen}
          courses={board.courses}
          teacherNames={board.teacherNames}
          isSaving={createEntry.isPending}
          error={createEntry.error}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateFromModal}
        />
      )}
    </div>
  );
}

/** The route: timetable management is governed by `manage:timetable`. */
export default function Timetable() {
  return (
    <RequirePermission permission={Permission.MANAGE_TIMETABLE}>
      <TimetablePage />
    </RequirePermission>
  );
}
