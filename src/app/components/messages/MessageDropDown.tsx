"use client";
import React, { useEffect, useRef } from "react";
import { ChevronDown, CirclePlus, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

interface MessageOptionsDropdownProps {
  index: number;
  msg: any;
  openSubMenu: { index: number; type: string } | null;
  toggleSubMenu: (index: number, type: string) => void;
  setReplyingMessage: (msg: any) => void;
}

export default function MessageOptionsDropdown({
  index,
  msg,
  openSubMenu,
  toggleSubMenu,
  setReplyingMessage,
}: MessageOptionsDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDropdownOpen = openSubMenu && openSubMenu.index === index;

  // Close submenu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        // If the submenu is open, close it by toggling to an empty state.
        if (isDropdownOpen) {
          toggleSubMenu(index, ""); // Passing empty string to clear submenu.
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [containerRef, isDropdownOpen, index, toggleSubMenu]);

  return (
    <div className="relative" ref={containerRef}>
      <div className="absolute z-50 -top-1 right-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="px-4 w-6 h-6 bg-white border border-[#F0F0F0] shadow-none rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200"
            >
              <ChevronDown className="text-[#878787]" size={16} />
            </Button>
          </DropdownMenuTrigger>
          {!isDropdownOpen && (
            <DropdownMenuContent
              className="border-[#F0F0F0] font-manrope shadow-none"
              align="end"
            >
              <DropdownMenuItem
                onClick={() => setReplyingMessage(msg)}
                className="text-[#131616]"
              >
                Reply
              </DropdownMenuItem>
              <DropdownMenuItem className="text-[#131616]">
                Reply privately
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toggleSubMenu(index, "emojis")}
                className="text-[#131616]"
              >
                Emojis
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toggleSubMenu(index, "sendTo")}
                className="text-[#131616]"
              >
                Send to
              </DropdownMenuItem>
              <DropdownMenuItem className="text-[#131616]">
                Download
              </DropdownMenuItem>
              <DropdownMenuItem className="text-[#131616]">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          )}
        </DropdownMenu>
      </div>
      {/* Submenu for Emojis */}
      {openSubMenu &&
        openSubMenu.index === index &&
        openSubMenu.type === "emojis" && (
          <div
            className="absolute right-0 bg-white border border-[#F0F0F0] rounded shadow-lg p-2 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col space-y-2">
              <button onClick={() => toggleSubMenu(index, "emojis")}>💯</button>
              <button onClick={() => toggleSubMenu(index, "emojis")}>👍🏻</button>
              <button onClick={() => toggleSubMenu(index, "emojis")}>✋🏻</button>
              <button onClick={() => toggleSubMenu(index, "emojis")}>☺️</button>
              <button onClick={() => toggleSubMenu(index, "emojis")}>
                <CirclePlus className="text-[#878787]" size={20} />
              </button>
            </div>
          </div>
        )}
      {/* Submenu for Send To */}
      {openSubMenu &&
        openSubMenu.index === index &&
        openSubMenu.type === "sendTo" && (
          <div className="absolute -right-[215px] bg-white border border-[#F0F0F0] rounded-md shadow-lg p-3 z-10 w-80">
            <div className="flex flex-col gap-4">
              <div className="flex items-center border border-[#F0F0F0] shadow-none rounded-lg px-3 w-full bg-white">
                <Search className="text-[#898989]" size={18} />
                <Input
                  className="border-0 focus-visible:ring-0 shadow-none focus:outline-none flex-1"
                  placeholder="Search"
                />
              </div>
              <div className="text-sm text-[#030E18] mt-2 mb-2">
                Recent messages
              </div>
              <div className="flex flex-col text-left gap-2">
                <div className="flex flex-col gap-2 text-left">
                  <div className="flex items-center mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <Avatar className="w-10 h-10 rounded-full bg-gray-300">
                        <AvatarImage src="/image/teachers/civic.png" />
                      </Avatar>
                      <span className="text-sm">Mrs. Yetunde Adebayo</span>
                    </div>
                    <input type="checkbox" className="form-checkbox h-4 w-4" />
                  </div>
                  <div className="flex items-center mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <Avatar className="w-10 h-10 rounded-full bg-gray-300">
                        <AvatarImage src="/image/teachers/mathematics.png" />
                      </Avatar>
                      <span className="text-sm">Mr. Chisom Okechukwu</span>
                    </div>
                    <input type="checkbox" className="form-checkbox h-4 w-4" />
                  </div>
                  <div className="flex items-center mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <Avatar className="w-10 h-10 rounded-full bg-gray-300">
                        <AvatarImage src="/image/teachers/english.png" />
                      </Avatar>
                      <span className="text-sm">Fatima Abubakar</span>
                    </div>
                    <input type="checkbox" className="form-checkbox h-4 w-4" />
                  </div>
                </div>
              </div>
              <div className="border-t w-full">
                <div className="flex mt-2 justify-between items-center">
                  <p className="text-sm text-[#5D5D5D]">
                    ...bayo, Fatima Abubakar
                  </p>
                  <button
                    className="px-3 py-1 bg-[#003366] text-white text-sm rounded"
                    onClick={() => toggleSubMenu(index, "sendTo")}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
