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
import { StatGrid, StatTile } from "@/components/tl/StatTile";

interface AssessmentStatCardsProps {
  assessments: Assessment[];
  isLoading: boolean;
}

/**
 * Renders the counter row as tl stat tiles.
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
      icon: <FiClipboard />,
      valueClass: "text-2xl text-tl-ink",
    },
    {
      label: "Active",
      value: count("active"),
      icon: <FiTrendingUp />,
      valueClass: "text-2xl text-tl-success",
    },
    {
      label: "Pending",
      value: count("pending"),
      icon: <FiCalendar />,
      valueClass: "text-2xl text-tl-warning",
    },
    {
      label: "Completed",
      value: count("completed"),
      icon: <FiUsers />,
      valueClass: "text-2xl text-tl-brand",
    },
  ];

  return (
    <div data-guide="assessments-stats">
      <StatGrid label="Assessment counts">
        {cards.map((card) => (
          <StatTile
            key={card.label}
            label={card.label}
            icon={card.icon}
            valueClass={card.valueClass}
            value={
              isLoading ? (
                <span
                  aria-label="Loading"
                  className="block h-8 w-16 animate-pulse rounded bg-tl-line/70"
                />
              ) : (
                card.value
              )
            }
          />
        ))}
      </StatGrid>
    </div>
  );
}
