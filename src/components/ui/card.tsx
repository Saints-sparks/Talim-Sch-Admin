import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The portals' white card (radius 22, hairline border, soft shadow).
 *
 * @param props - Classes and the primitive's own props; `ref` is forwarded.
 * @returns The element.
 */
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-[22px] border border-tl-line bg-tl-surface text-tl-ink shadow-[0_1px_2px_rgba(15,27,46,0.04),0_14px_30px_-22px_rgba(15,27,46,0.18)] dark:shadow-none",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

/**
 * The padded heading block of a {@link Card}.
 *
 * @param props - Classes and the primitive's own props; `ref` is forwarded.
 * @returns The element.
 */
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

/**
 * A card's title (19px, 800).
 *
 * @param props - Classes and the primitive's own props; `ref` is forwarded.
 * @returns The element.
 */
const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "text-[19px] font-extrabold leading-tight tracking-[-0.3px] text-tl-ink",
        className
      )}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

/**
 * The grey line under a card's title.
 *
 * @param props - Classes and the primitive's own props; `ref` is forwarded.
 * @returns The element.
 */
const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-[13px] text-tl-muted", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

/**
 * A card's padded body.
 *
 * @param props - Classes and the primitive's own props; `ref` is forwarded.
 * @returns The element.
 */
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

/**
 * A card's padded footer row.
 *
 * @param props - Classes and the primitive's own props; `ref` is forwarded.
 * @returns The element.
 */
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
