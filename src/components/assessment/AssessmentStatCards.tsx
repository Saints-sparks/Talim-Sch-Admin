"use client";

/**
 * The four counters at the top of the assessments screen.
 *
 * They count the assessments on the current page — the list is paged
 * server-side, so the caller passes what it has.
 */
import React from "react";
import { FiCalendar, FiClipboard, FiTrendingUp, FiUsers } from "react-icons/fi";
import type { Assessment } from "@/components/assessment/AssessmentForm.types";

interface AssessmentStatCardsProps {
  assessments: Assessment[];
  isLoading: boolean;
}

/**
 * Renders the counter row.
 *
 * @param props - The assessments to count and whether they are still loading.
 * @returns The grid of cards.
 */
export function AssessmentStatCards({ assessments, isLoading }: AssessmentStatCardsProps) {
  const count = (status: Assessment["status"]) =>
    assessments.filter((assessment) => assessment.status === status).length;

  const cards = [
    {
      label: "Total Assessments",
      value: assessments.length,
      icon: <FiClipboard className="h-6 w-6 text-white" />,
      tileClass: "bg-[#003366]",
      valueClass: "text-[#003366] dark:text-blue-300",
    },
    {
      label: "Active",
      value: count("active"),
      icon: <FiTrendingUp className="h-6 w-6 text-white" />,
      tileClass: "bg-[#154473]",
      valueClass: "text-[#154473] dark:text-blue-300",
    },
    {
      label: "Pending",
      value: count("pending"),
      icon: <FiCalendar className="h-6 w-6 text-white" />,
      tileClass: "bg-gradient-to-r from-amber-500 to-amber-600",
      valueClass: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Completed",
      value: count("completed"),
      icon: <FiUsers className="h-6 w-6 text-white" />,
      tileClass: "bg-[#003366]",
      valueClass: "text-[#003366] dark:text-blue-300",
    },
  ];

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      data-guide="assessments-stats"
    >
      {cards.map((card) => (
        <div
          key={card.label}
          className="group bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">
                {card.label}
              </p>
              <p className={`text-3xl font-bold ${card.valueClass}`}>
                {isLoading ? (
                  <span className="block h-8 w-16 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                ) : (
                  card.value
                )}
              </p>
            </div>
            <div className={`p-3 rounded-xl shadow-lg ${card.tileClass}`}>{card.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
