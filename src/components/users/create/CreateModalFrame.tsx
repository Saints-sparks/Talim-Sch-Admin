"use client";

import React from "react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { overlayClass } from "./ui";

interface CreateModalFrameProps {
  /** Closes the dialog. Ignored while `busy`, so a create in flight is never orphaned. */
  onClose: () => void;
  /** True while a create request is in flight. */
  busy: boolean;
  /** Id of the element that names the dialog. */
  labelledBy: string;
  /** Classes for the panel: width, radius, surface. */
  panelClassName: string;
  /** Extra classes on the overlay, e.g. padding. */
  overlayClassName?: string;
  /** The `data-guide` hook the product tour anchors to. */
  dataGuide: string;
  children: React.ReactNode;
}

/**
 * The overlay and panel shared by the add-teacher and add-student dialogs.
 * Locks page scroll while mounted and closes on a backdrop click unless a
 * create is in flight.
 *
 * @param props - Close handler, busy flag, accessibility label and panel styling.
 * @returns The dialog frame around `children`.
 */
export function CreateModalFrame({
  onClose,
  busy,
  labelledBy,
  panelClassName,
  overlayClassName = "",
  dataGuide,
  children,
}: CreateModalFrameProps) {
  useBodyScrollLock(true);

  return (
    <div
      className={`${overlayClass} ${overlayClassName}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`${panelClassName} shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-300`}
        data-guide={dataGuide}
      >
        {children}
      </div>
    </div>
  );
}
