import type React from "react";
import { BookOpen, GraduationCap, Layers, Users } from "lucide-react";
import { Pill, focusRing, pillTone } from "@/components/tl";
import { COLOR_TONE, GROUP_TYPES, type GroupKind } from "./createGroup";

/** The icon of each group kind. */
const ICONS: Record<GroupKind, React.ReactNode> = {
  parent: <Users className="h-5 w-5" aria-hidden />,
  class: <GraduationCap className="h-5 w-5" aria-hidden />,
  course: <BookOpen className="h-5 w-5" aria-hidden />,
  custom: <Layers className="h-5 w-5" aria-hidden />,
};

/**
 * Step 1: the four group kinds as cards, each with its icon on its tone, the
 * description and whether members are added automatically.
 *
 * @param props - The pick handler.
 * @param props.onSelect - Called with the kind picked.
 * @returns The cards.
 */
export function GroupTypePicker({ onSelect }: { onSelect: (kind: GroupKind) => void }) {
  return (
    <div className="grid grid-cols-1 gap-3 p-5 min-[420px]:grid-cols-2">
      {GROUP_TYPES.map((opt) => {
        const tone = COLOR_TONE[opt.color];
        return (
          <button
            key={opt.kind}
            type="button"
            onClick={() => onSelect(opt.kind)}
            className={`flex flex-col items-start gap-2 rounded-2xl border border-tl-line bg-tl-surface p-4 text-left transition-colors hover:border-tl-control hover:bg-tl-subtle ${focusRing}`}
          >
            <span className={`rounded-xl p-2 ${pillTone[tone]}`}>{ICONS[opt.kind]}</span>
            <span>
              <span className="block text-sm font-extrabold text-tl-ink">{opt.label}</span>
              <span className="mt-0.5 block text-xs leading-snug text-tl-muted">{opt.description}</span>
            </span>
            <Pill tone={tone}>{opt.badge}</Pill>
          </button>
        );
      })}
    </div>
  );
}
