import React from "react";
import { ChevronRight } from "./Icons";

interface DashboardCardProps {
  /** Identifies the card to `onNavigate`. */
  id: number;
  /** Either a rendered icon element or a component to render. */
  icon: React.ComponentType<Record<string, never>> | React.ReactElement;
  count: number;
  label: string;
  /** Called with `id` when the card is activated. */
  onNavigate: (id: number) => void;
}

/**
 * A single counter tile: icon, number, label and a "See more" affordance.
 *
 * Kept as the reference tile used by the Storybook gallery; the dashboard page
 * itself renders `@/components/dashboard/KpiCards`.
 */
const DashboardCard: React.FC<DashboardCardProps> = ({ id, icon, count, label, onNavigate }) => {
  return (
    <button
      type="button"
      onClick={() => onNavigate(id)}
      className="w-full text-left h-[168px] px-6 rounded-xl border border-[#F2F2F2] dark:border-slate-700 flex flex-col justify-between bg-white dark:bg-slate-800 transition-shadow duration-300"
    >
      <div className="flex items-start gap-5 mt-6">
        <div className="border border-[#F1F1F1] dark:border-slate-700 rounded-[10px] p-3">
          {React.isValidElement(icon)
            ? icon
            : React.createElement(icon as React.ComponentType<Record<string, never>>)}
        </div>
        <div className="flex flex-col">
          <p className="text-[23px] leading-[120%] font-semibold text-gray-900 dark:text-slate-100">
            {count.toLocaleString()}
          </p>
          <p className="text-gray-500 dark:text-slate-400 text-[13px] font-medium">{label}</p>
        </div>
      </div>

      <div className="pt-4 border-b border-[#EBEBEB] dark:border-slate-700 -mx-6"></div>
      <div className="mt-3 mb-5 text-gray-500 dark:text-slate-400 font-medium leading-[120%] text-[15px] flex justify-between items-center">
        <span>See more</span> <ChevronRight />
      </div>
    </button>
  );
};

export default DashboardCard;
