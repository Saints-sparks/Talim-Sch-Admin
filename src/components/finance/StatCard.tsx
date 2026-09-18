"use client";

interface StatCardProps {
  label: string;
  /** Already-formatted value — money through `formatNaira`, counts as strings. */
  value: string;
  sub?: string;
  icon: React.ElementType;
  /** Tailwind text colour for the value. */
  color?: string;
  onClick?: () => void;
}

/**
 * One headline figure on a finance or payments overview.
 *
 * @param props - Label, formatted value, optional sub-label, icon and colour.
 * @returns The stat card.
 */
export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = "text-[#003366]",
  onClick,
}: StatCardProps) {
  const interactive = Boolean(onClick);
  return (
    <div
      onClick={onClick}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") onClick?.();
            }
          : undefined
      }
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 flex gap-4 items-start shadow-sm ${
        interactive ? "cursor-pointer hover:shadow-md transition-shadow" : ""
      }`}
    >
      <div className="w-11 h-11 rounded-xl bg-[#E8EDF3] flex items-center justify-center shrink-0">
        <Icon size={20} className="text-[#003366]" />
      </div>
      <div className="min-w-0">
        <p className={`text-xl font-bold ${color}`}>{value}</p>
        <p className="text-sm text-gray-600 dark:text-slate-300 font-medium">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
