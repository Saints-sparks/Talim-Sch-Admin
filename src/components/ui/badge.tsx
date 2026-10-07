import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-[5px] text-xs font-extrabold transition-colors focus:outline-none focus:ring-2 focus:ring-tl-link focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-tl-select text-tl-brand",
        secondary: "border-transparent bg-tl-track text-tl-muted",
        destructive: "border-transparent bg-tl-danger-bg text-tl-danger",
        outline: "border-tl-line text-tl-ink",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

/**
 * A small status pill in the tl palette (default, secondary, destructive, outline).
 *
 * @param props - The variant, classes and any `<div>` attribute.
 * @param props.className - Extra classes.
 * @param props.variant - The colour variant.
 * @returns The badge.
 */
function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
