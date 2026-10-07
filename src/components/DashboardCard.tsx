import React from "react";
import { ChevronRight } from "./Icons";
import { focusRing } from "@/components/tl";

/** Props for {@link DashboardCard}. */
interface DashboardCardProps {
  /** Identifies the card to `onNavigate`. */
  id: number;
  /** Either a rendered icon element or a component to render. */
  icon: React.ComponentType<Record<string, never>> | React.ReactElement;
  /** The number on the tile. */
  count: number;
  /** The words under the number. */
  label: string;
  /** Called with `id` when the card is activated. */
  onNavigate: (id: number) => void;
}

/**
 * A single counter tile in the tl look: icon, number, label and a "See more"
 * affordance.
 *
 * Kept as the reference tile used by the Storybook gallery; the dashboard page
 * itself renders `@/components/dashboard/KpiCards`.
 *
 * @param props - See {@link DashboardCardProps}.
 * @param props.id - Passed back to `onNavigate`.
 * @param props.icon - The icon.
 * @param props.count - The number.
 * @param props.label - The label.
 * @param props.onNavigate - Click handler.
 * @returns The tile.
 */
const DashboardCard: React.FC<DashboardCardProps> = ({ id, icon, count, label, onNavigate }) => {
  return (
    <button
      type="button"
      onClick={() => onNavigate(id)}
      className={`flex h-[168px] w-full flex-col justify-between rounded-[18px] border border-tl-line bg-tl-surface px-5 text-left text-tl-ink transition-colors hover:border-tl-control hover:bg-tl-subtle ${focusRing}`}
    >
      <div className="mt-5 flex items-start gap-4">
        <div className="rounded-xl border border-tl-line-soft bg-tl-subtle p-3 text-tl-brand">
          {React.isValidElement(icon)
            ? icon
            : React.createElement(icon as React.ComponentType<Record<string, never>>)}
        </div>
        <div className="flex flex-col">
          <p className="text-[23px] font-extrabold leading-[120%] tracking-[-0.3px] text-tl-ink">
            {count.toLocaleString()}
          </p>
          <p className="text-[13px] font-bold text-tl-muted">{label}</p>
        </div>
      </div>

      <div className="-mx-5 border-b border-tl-line-soft pt-4" />
      <div className="mb-4 mt-3 flex items-center justify-between text-sm font-bold text-tl-link">
        <span>See more</span> <ChevronRight />
      </div>
    </button>
  );
};

export default DashboardCard;
