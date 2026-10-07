"use client";

import React from "react";
import Link from "next/link";
import { logger } from "@/lib/logger";
import { useRouter, usePathname } from "next/navigation";

/** Props for {@link SmoothLink}: the destination plus any anchor attribute (`aria-*`, `title`, `id`). */
interface SmoothLinkProps extends Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "onClick"
> {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  replace?: boolean;
}

/**
 * A Next link that navigates through the router on click (and does nothing
 * when the page is already open), so the page transition runs once.
 *
 * @param props - See {@link SmoothLinkProps}; other anchor attributes are passed to the `<a>`.
 * @param props.href - The destination.
 * @param props.children - The link's content.
 * @param props.className - Classes for the `<a>`.
 * @param props.onClick - Runs before navigating.
 * @param props.replace - Replace the history entry instead of pushing one.
 * @param ref - Forwarded to the `<a>` (tooltips anchor on it).
 * @returns The link.
 */
const SmoothLink = React.forwardRef<HTMLAnchorElement, SmoothLinkProps>(function SmoothLink(
  { href, children, className, onClick, replace = false, ...anchorProps },
  ref
) {
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (onClick) {
      onClick(e);
    }

    if (pathname === href) {
      return;
    }

    try {
      if (replace) {
        router.replace(href);
      } else {
        router.push(href);
      }
    } catch (error) {
      logger.error("navigation", `Could not navigate to ${href}`, error);
    }
  };

  return (
    <Link {...anchorProps} ref={ref} href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
});

export default SmoothLink;
