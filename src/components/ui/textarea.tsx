import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

/**
 * A multi-line input in the tl form style.
 *
 * @param props - Classes and the primitive's own props; `ref` is forwarded.
 * @returns The element.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[88px] w-full rounded-[13px] border border-tl-control bg-tl-surface px-3.5 py-3 text-sm font-medium leading-relaxed text-tl-ink placeholder:text-tl-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tl-link focus-visible:ring-offset-2 focus-visible:ring-offset-tl-surface disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-tl-danger",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
