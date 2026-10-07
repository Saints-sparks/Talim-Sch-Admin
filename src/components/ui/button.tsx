import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // The portals' buttons (src/components/tl/styles.ts): 44px targets, radius 14, bold, tl colours.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[14px] text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tl-link focus-visible:ring-offset-2 focus-visible:ring-offset-tl-surface disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-tl-brand-fill text-tl-on-brand hover:bg-tl-brand-fill-hover",
        destructive: "bg-tl-danger text-tl-surface hover:opacity-90",
        outline: "border border-tl-control bg-tl-surface text-tl-brand hover:bg-tl-bg",
        secondary: "bg-tl-track text-tl-ink hover:bg-tl-line",
        ghost: "text-tl-muted hover:bg-tl-bg hover:text-tl-ink",
        link: "text-tl-link underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-[44px] px-[18px] py-2.5",
        sm: "min-h-[44px] rounded-[11px] px-3 text-[13px]",
        lg: "min-h-[48px] px-8",
        icon: "h-11 w-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

/**
 * The app's button in the portals' style: 44px targets, radius 14, tl colours per variant.
 *
 * @param props - Classes and the primitive's own props; `ref` is forwarded.
 * @returns The element.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
