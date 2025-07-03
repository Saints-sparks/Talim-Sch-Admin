"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import {
  BookOpen,
  Calendar,
  ChevronDown,
  Home,
  LogOut,
  MessageSquare,
  AlertCircle,
  Settings,
  Speaker,
  Ticket,
  Users,
  Bell,
  CircleUser,
} from "lucide-react"

import { cn } from "@/lib/utils"

type SidebarProps = React.ComponentProps<"nav"> & {
  className?: string
}

export default function Sidebar({className, ...rest}: SidebarProps) {
  const pathname = usePathname()
  const [expandedUsers, setExpandedUsers] = useState(false)

  // Define menu items
  const menuItems = [
    { path: "/dashboard", icon: <Home className="w-5 h-5" />, label: "Dashboard" },
    { path: "/classes", icon: <BookOpen className="w-5 h-5" />, label: "Classes" },
    {
      path: "/users",
      icon: <Users className="w-5 h-5" />,
      label: "Users",
      hasDropdown: true,
      expanded: expandedUsers,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault()
        setExpandedUsers(!expandedUsers)
      },
      subItems: [
        { path: "/users/students", label: "Students" },
        { path: "/users/teachers", label: "Teachers" },
      ],
    },
    { path: "/timetable", icon: <Calendar className="w-5 h-5" />, label: "Timetable" },
    { path: "/announcements", icon: <Speaker className="w-5 h-5" />, label: "Announcements" },
    { path: "/notifications", icon: <Bell className="w-5 h-5" />, label: "Notifications" },
    {
      path: "/messages",
      icon: <MessageSquare className="w-5 h-5" />,
      label: "Messages",
      badge: 2,
    },
    { path: "/leave-requests", icon: <Ticket className="w-5 h-5" />, label: "Request leave" },
    { path: "/complaints", icon: <AlertCircle className="w-5 h-5" />, label: "Complaints" },
    { path: "/settings", icon: <Settings className="w-5 h-5" />, label: "Settings" },
    {path: "/curriculum", icon: <BookOpen className="w-5 h-5" />, label: "Curriculum" },
  ]

  return (
    <div className="h-screen w-64 bg-white border-r border-r-blue-100 flex flex-col">
      {/* Logo */}
      <div className="p-4">
        <div className="flex items-center gap-2">
          <Image
            src="/img/treelogo.svg"
            alt="Talim Logo"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <span className="text-lg font-medium text-gray-900">Talim</span>
        </div>
      </div>

      {/* School */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 p-2 rounded">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
            <CircleUser className="w-5 h-5 text-blue-900" />
          </div>
          <span className="text-sm text-gray-800 font-medium">Unity Secondary School</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2 space-y-4">
        {menuItems.map((item) => (
          <div key={item.path}>
            {item.hasDropdown ? (                <div
                  className={cn(
                    "flex items-center gap-3 mx-2 px-3 py-2 rounded-md cursor-pointer",
                    pathname === item.path || (item.hasDropdown && item.expanded)
                      ? "bg-blue-50 text-blue-900 font-medium"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                  )}
                  onClick={item.onClick}
                >
                  {item.icon}
                  <span className="text-[16px]">{item.label}</span>
                  <ChevronDown className={cn("ml-auto w-4 h-4", item.expanded ? "transform rotate-180" : "")} />
                </div>
            ) : (
              <Link href={item.path}>
                <div
                  className={cn(
                    "flex items-center gap-3 mx-2 px-3 py-2 rounded-md cursor-pointer",
                    pathname === item.path ? "bg-blue-50 text-blue-900 font-medium" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                  )}
                >
                  {item.icon}
                  <span className="text-[16px]">{item.label}</span>
                  {item.badge && (
                    <div className="ml-auto w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-sm text-white">{item.badge}</span>
                    </div>
                  )}
                </div>
              </Link>
            )}

            {/* Sub-items */}
            {item.hasDropdown && item.expanded && item.subItems && (
              <div className="ml-10 mt-1 ">
                {item.subItems.map((subItem) => (
                  <Link href={subItem.path} key={subItem.path}>
                    <div
                      className={cn(
                        "text-[16px] font-[500] py-1 px-2 rounded-md mb-3",
                        pathname === subItem.path ? "text-blue-900 font-medium" : "text-gray-600 hover:text-blue-900",
                      )}
                    >
                      {subItem.label}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Logout */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-md cursor-pointer">
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Logout Account</span>
        </div>
      </div>
    </div>
  )
}
