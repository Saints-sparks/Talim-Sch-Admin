import { FileText, Image, Info, Link2, Video as VideoIcon } from "lucide-react";
import { focusRing, selectControl } from "@/components/tl";
import type { Section } from "./groupInfo";

const MEDIA_ITEMS = [
  { name: "Images", icon: Image },
  { name: "Videos", icon: VideoIcon },
  { name: "Links", icon: Link2 },
  { name: "Documents", icon: FileText },
] as const;

/** Props for the dialog's pane pickers. */
interface NavProps {
  selected: Section;
  onSelect: (section: Section) => void;
}

/**
 * The pane classes of the dialog's side list.
 *
 * @param on - Whether the pane is open.
 * @returns The class string.
 */
function paneClass(on: boolean): string {
  return `flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-left text-sm font-bold transition-colors ${focusRing} ${
    on ? "bg-tl-select text-tl-brand" : "text-tl-muted hover:bg-tl-surface hover:text-tl-ink"
  }`;
}

/**
 * The side list from 640px: Info plus the four shared-media panes.
 *
 * @param props - See {@link NavProps}.
 * @param props.selected - The open pane.
 * @param props.onSelect - Opens a pane.
 * @returns The list.
 */
export function GroupInfoSidebar({ selected, onSelect }: NavProps) {
  return (
    <div className="hidden w-44 shrink-0 flex-col gap-1 border-r border-tl-line-soft bg-tl-subtle p-3 pt-6 sm:flex">
      <button
        type="button"
        className={paneClass(selected === "")}
        aria-current={selected === "" ? "true" : undefined}
        onClick={() => onSelect("")}
      >
        <Info size={18} aria-hidden />
        <span>Info</span>
      </button>
      {MEDIA_ITEMS.map((item) => (
        <button
          type="button"
          key={item.name}
          className={paneClass(selected === item.name)}
          aria-current={selected === item.name ? "true" : undefined}
          onClick={() => onSelect(item.name)}
        >
          <item.icon size={18} aria-hidden />
          <span>{item.name}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * The phone-width replacement for the side list: a select.
 *
 * @param props - See {@link NavProps}.
 * @param props.selected - The open pane.
 * @param props.onSelect - Opens a pane.
 * @returns The select.
 */
export function GroupInfoMobilePicker({ selected, onSelect }: NavProps) {
  return (
    <select
      className={`${selectControl} mb-5 w-full sm:hidden`}
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
