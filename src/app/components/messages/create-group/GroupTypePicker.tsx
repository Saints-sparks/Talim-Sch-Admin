import type React from "react";
import { BookOpen, GraduationCap, Layers, Users } from "lucide-react";
import { COLOR_MAP, GROUP_TYPES, type GroupKind } from "./createGroup";

const ICONS: Record<GroupKind, React.ReactNode> = {
  parent: <Users className="w-5 h-5" />,
  class: <GraduationCap className="w-5 h-5" />,
  course: <BookOpen className="w-5 h-5" />,
  custom: <Layers className="w-5 h-5" />,
};

/** Step 1: the four group kinds as cards. */
export function GroupTypePicker({ onSelect }: { onSelect: (kind: GroupKind) => void }) {
  return (
    <div className="p-5 grid grid-cols-2 gap-3">
      {GROUP_TYPES.map((opt) => {
        const c = COLOR_MAP[opt.color];
        return (
          <button
            key={opt.kind}
            onClick={() => onSelect(opt.kind)}
            className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 border-gray-100 hover:border-gray-200 hover:${c.bg} transition-all text-left group`}
          >
            <div className={`p-2 rounded-lg ${c.bg} ${c.text} group-hover:scale-105 transition-transform`}>
              {ICONS[opt.kind]}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">{opt.description}</p>
            </div>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${c.badge}`}>{opt.badge}</span>
          </button>
        );
      })}
    </div>
  );
}
