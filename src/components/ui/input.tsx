import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A text input in the tl form style (44px, radius 13, red border when `aria-invalid`).
 *
 * @param props - Classes and the primitive's own props; `ref` is forwarded.
 * @returns The element.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex min-h-[44px] w-full rounded-[13px] border border-tl-control bg-tl-surface px-3.5 py-2 text-[15px] font-medium text-tl-ink transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-tl-ink placeholder:text-tl-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tl-link focus-visible:ring-offset-2 focus-visible:ring-offset-tl-surface disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-tl-danger md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
