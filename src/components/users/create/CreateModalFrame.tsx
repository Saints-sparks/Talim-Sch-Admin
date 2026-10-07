"use client";

import React from "react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { cn } from "@/lib/utils";
import { overlayClass, panelClass } from "./ui";

/** Props for {@link CreateModalFrame}. */
interface CreateModalFrameProps {
  /** Closes the dialog. Ignored while `busy`, so a create in flight is never orphaned. */
  onClose: () => void;
  /** True while a create request is in flight. */
  busy: boolean;
  /** Id of the element that names the dialog. */
  labelledBy: string;
  /** Extra classes for the panel (its width and height); the sheet surface is built in. */
  panelClassName: string;
  /** Extra classes on the overlay, e.g. padding. */
  overlayClassName?: string;
  /** The `data-guide` hook the product tour anchors to. */
  dataGuide: string;
  /** The header, body and footer. */
  children: React.ReactNode;
}

/**
 * The overlay and panel shared by the add-teacher and add-student dialogs, in
 * the portals' sheet look: a bottom sheet on phones and a centred card from
 * `sm` up. Locks page scroll while mounted and closes on a backdrop click
 * unless a create is in flight.
 *
 * @param props - Close handler, busy flag, accessibility label and panel styling.
 * @param props.onClose - Closes the dialog.
 * @param props.busy - Whether a create is in flight.
 * @param props.labelledBy - The title's id.
 * @param props.panelClassName - The panel's size classes.
 * @param props.overlayClassName - Extra overlay classes.
 * @param props.dataGuide - Tour target.
 * @param props.children - The dialog's content.
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
        className={cn(panelClass, panelClassName)}
        data-guide={dataGuide}
      >
        {children}
      </div>
    </div>
  );
}
