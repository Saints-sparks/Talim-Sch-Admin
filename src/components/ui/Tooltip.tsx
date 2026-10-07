"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";

/**
 * A hover and focus tooltip (Radix) in the tl look: ink on light, light on
 * dark, so it reads in both themes.
 *
 * @param props - The trigger, the words and where it shows.
 * @param props.children - The trigger (receives the ref and handlers).
 * @param props.content - The words.
 * @param props.side - Which side it opens on.
 * @param props.delayDuration - Milliseconds before it opens.
 * @returns The tooltip around its trigger.
 */
export function Tooltip({
  children,
  content,
  side = "top",
  delayDuration = 400,
}: {
  children: React.ReactNode;
  content: string;
  side?: "top" | "right" | "bottom" | "left";
  delayDuration?: number;
}) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            className="z-50 max-w-xs rounded-[10px] bg-tl-ink px-3 py-1.5 text-xs font-semibold text-tl-surface shadow-md"
            sideOffset={6}
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-tl-ink" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
