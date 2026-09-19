/** @jest-environment jsdom */
import { render } from "@testing-library/react";
import * as Icons from "@/components/Icons";
import { iconClass, resolveIconTone } from "@/components/icons/iconTone";

const EXPECTED_NAMES = [
  "Book", "BookOpen", "Calendar", "Calendar2", "Chart2", "ChevronDown", "ChevronLeft", "ChevronRight",
  "ClipboardClose", "Copy", "Dashboard", "Download", "Edit2", "Eye", "Flash", "Message", "Note", "Power",
  "Profile", "Profile2User", "Search", "Settings", "Trash", "UserGroup", "VolumeHigh",
];

describe("icon tone", () => {
  it("uses an explicit stroke as given and adds no tint class", () => {
    expect(resolveIconTone({ stroke: "#ff0000", isActive: true })).toEqual({
      strokeColor: "#ff0000",
      svgClassName: undefined,
    });
  });

  it("follows currentColor with the idle tint by default", () => {
    const tone = resolveIconTone({});
    expect(tone.strokeColor).toBe("currentColor");
    expect(tone.svgClassName).toBe("text-[#929292]");
  });

  it("switches to the active tint with a dark-mode variant", () => {
    expect(resolveIconTone({ isActive: true }).svgClassName).toBe("text-[#003366] dark:text-blue-300");
  });

  it("lets a caller's text colour beat the default tint", () => {
    expect(resolveIconTone({ className: "text-red-500" }).svgClassName).toBe("text-red-500");
    const merged = iconClass("text-white", "text-[#1A1A1A] dark:text-slate-200").split(" ");
    expect(merged).toContain("text-white");
    expect(merged).not.toContain("text-[#1A1A1A]");
    expect(iconClass(undefined, "text-[#1A1A1A]")).toBe("text-[#1A1A1A]");
  });
});

describe("icon barrel", () => {
  it("exports every icon that existed before the split", () => {
    const runtime = Object.keys(Icons).sort();
    expect(runtime).toEqual([...EXPECTED_NAMES].sort());
  });

  it.each(EXPECTED_NAMES)("%s renders an svg that follows currentColor by default", (name) => {
    const Icon = (Icons as unknown as Record<string, (p: object) => JSX.Element>)[name];
    const { container } = render(<Icon />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("class")).toMatch(/text-\[#/);
    const strokes = Array.from(container.querySelectorAll("[stroke]")).map((el) => el.getAttribute("stroke"));
    expect(strokes.length).toBeGreaterThan(0);
    expect(strokes.every((s) => s === "currentColor")).toBe(true);
  });

  it("honours an explicit stroke on the state-tinted icons", () => {
    const { container } = render(<Icons.Dashboard stroke="#123456" />);
    const strokes = Array.from(container.querySelectorAll("[stroke]")).map((el) => el.getAttribute("stroke"));
    expect(strokes.every((s) => s === "#123456")).toBe(true);
  });
});
