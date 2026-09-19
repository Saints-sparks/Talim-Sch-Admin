"use client";

import React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const LOGO_SRC = "/img/treelogo.svg";

/**
 * Logo and expand button at the top of the collapsed rail.
 *
 * @param props.onExpand - Expands the sidebar.
 * @returns The rail header.
 */
export function CollapsedBrand({ onExpand }: { onExpand: () => void }) {
  return (
    <div className="flex flex-col items-center gap-1 p-3 border-b-2 border-[#F3F3F3] dark:border-slate-700">
      <div className="bg-[#003366] p-2 rounded-lg">
        <Image src={LOGO_SRC} alt="Talim Logo" width={20} height={20} className="w-5 h-5 filter brightness-0 invert" />
      </div>
      <button
        onClick={onExpand}
        className="mt-1 flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
        aria-label="Expand sidebar"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

interface ExpandedBrandProps {
  isMobile: boolean;
  /** Closes the mobile drawer. */
  onCloseMobile: () => void;
  /** Collapses the desktop sidebar to the icon rail. */
  onCollapse: () => void;
}

/**
 * Close button (mobile), logo and collapse button (desktop) at the top of the
 * full sidebar.
 *
 * @param props - Layout flag and the two handlers.
 * @returns The header.
 */
export function ExpandedBrand({ isMobile, onCloseMobile, onCollapse }: ExpandedBrandProps) {
  return (
    <>
      {isMobile && (
        <div className="flex justify-end p-4 md:hidden border-b border-gray-100 dark:border-slate-700">
          <button
            onClick={onCloseMobile}
            aria-label="Close menu"
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="p-[21px] border-b-2 border-[#F3F3F3] dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-600 rounded-lg opacity-20"></div>
              <div className="relative bg-[#003366] p-2 rounded-lg">
                <Image
                  src={LOGO_SRC}
                  alt="Talim Logo"
                  width={24}
                  height={24}
                  className="w-6 h-6 filter brightness-0 invert"
                />
              </div>
            </div>
            <h1 className="text-[18px] font-semibold text-[#030E18] dark:text-white">Talim</h1>
          </div>
          {!isMobile && (
            <button
              onClick={onCollapse}
              className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
