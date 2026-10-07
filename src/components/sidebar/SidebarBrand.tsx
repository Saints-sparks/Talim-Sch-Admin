"use client";

import React from "react";
import Image from "next/image";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { focusRing, iconButton } from "@/components/tl/styles";

const LOGO_SRC = "/img/treelogo.svg";

/**
 * The tree mark on its navy tile (decorative; "Talim" is written beside it,
 * or the rail's button names itself).
 *
 * @param props - The tile's size.
 * @param props.size - Edge length in px.
 * @returns The mark.
 */
function BrandMark({ size }: { size: number }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-[10px] bg-tl-brand-fill"
    >
      <Image
        src={LOGO_SRC}
        alt=""
        width={size - 12}
        height={size - 12}
        className="brightness-0 invert"
      />
    </span>
  );
}

/**
 * Logo and expand button at the top of the collapsed rail.
 *
 * @param props - The expand handler.
 * @param props.onExpand - Expands the sidebar.
 * @returns The rail header.
 */
export function CollapsedBrand({ onExpand }: { onExpand: () => void }) {
  return (
    <div className="flex flex-col items-center gap-1.5 border-b border-tl-line-soft px-2 pb-3 pt-[22px]">
      <BrandMark size={32} />
      <button
        type="button"
        onClick={onExpand}
        className={iconButton}
        aria-label="Expand sidebar"
        title="Expand sidebar"
      >
        <PanelLeftOpen className="h-[18px] w-[18px]" aria-hidden />
      </button>
    </div>
  );
}

interface ExpandedBrandProps {
  isMobile: boolean;
  /** The school's name, under "Talim". */
  schoolName: string;
  /** Closes the mobile drawer. */
  onCloseMobile: () => void;
  /** Collapses the desktop sidebar to the icon rail. */
  onCollapse: () => void;
}

/**
 * The top of the full sidebar: the mark, "Talim" and the school (the portals'
 * brand block), with Close (drawer) or Collapse (desktop).
 *
 * @param props - See {@link ExpandedBrandProps}.
 * @param props.isMobile - Whether the sidebar is the drawer.
 * @param props.schoolName - The school's name.
 * @param props.onCloseMobile - Closes the drawer.
 * @param props.onCollapse - Collapses to the rail.
 * @returns The header.
 */
export function ExpandedBrand({
  isMobile,
  schoolName,
  onCloseMobile,
  onCollapse,
}: ExpandedBrandProps) {
  return (
    <div className="flex items-center gap-2.5 px-3 pb-2 pt-1">
      <BrandMark size={32} />
      <div className="min-w-0 flex-1">
        <div className="text-[19px] font-extrabold leading-tight tracking-[-0.2px] text-tl-ink">
          Talim
        </div>
        <div className="truncate text-xs font-semibold text-tl-muted" title={schoolName}>
          {schoolName}
        </div>
      </div>
      {isMobile ? (
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close menu"
          className={`${iconButton} ${focusRing}`}
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      ) : (
        <button
          type="button"
          onClick={onCollapse}
          className={iconButton}
          aria-label="Collapse sidebar"
          title="Collapse sidebar"
        >
          <PanelLeftClose className="h-[18px] w-[18px]" aria-hidden />
        </button>
      )}
    </div>
  );
}
