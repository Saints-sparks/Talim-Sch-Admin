import { FileText, Image, Info, Link2, Video as VideoIcon } from "lucide-react";
import type { Section } from "./groupInfo";

const MEDIA_ITEMS = [
  { name: "Images", icon: Image },
  { name: "Videos", icon: VideoIcon },
  { name: "Links", icon: Link2 },
  { name: "Documents", icon: FileText },
] as const;

interface NavProps {
  selected: Section;
  onSelect: (section: Section) => void;
}

/** The desktop sidebar: Info plus the four shared-media panes. */
export function GroupInfoSidebar({ selected, onSelect }: NavProps) {
  return (
    <div className="hidden sm:flex w-44 flex-col gap-1 bg-[#FDFDFD] border-r border-[#EEEEEE] text-[#878787] pt-6 p-3">
      <button
        type="button"
        className={`flex items-center gap-3 p-2 rounded-lg transition text-left ${
          selected === "" ? "bg-gray-200 font-medium" : "hover:bg-gray-200"
        }`}
        onClick={() => onSelect("")}
      >
        <Info strokeWidth="1px" size={18} className="text-gray-600" />
        <span>Info</span>
      </button>
      {MEDIA_ITEMS.map((item) => (
        <button
          type="button"
          key={item.name}
          className={`flex items-center gap-3 p-2 rounded-lg transition text-left ${
            selected === item.name ? "bg-gray-200 font-medium" : "hover:bg-gray-200"
          }`}
          onClick={() => onSelect(item.name)}
        >
          <item.icon strokeWidth="1px" size={18} className="text-gray-600" />
          <span>{item.name}</span>
        </button>
      ))}
    </div>
  );
}

/** The phone-width replacement for the sidebar. */
export function GroupInfoMobilePicker({ selected, onSelect }: NavProps) {
  return (
    <select
      className="sm:hidden mb-4 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm"
      value={selected}
      onChange={(e) => onSelect(e.target.value as Section)}
      aria-label="Section"
    >
      <option value="">Info</option>
      {MEDIA_ITEMS.map((item) => (
        <option key={item.name} value={item.name}>
          {item.name}
        </option>
      ))}
    </select>
  );
}
