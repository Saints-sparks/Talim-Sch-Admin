'use client';

import React from 'react';
import Link from 'next/link';
import { logger } from "@/lib/logger";
import { useRouter, usePathname } from 'next/navigation';

interface SmoothLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  replace?: boolean;
}

const SmoothLink: React.FC<SmoothLinkProps> = ({
  href,
  children,
  className,
  onClick,
  replace = false
}) => {
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
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
};

export default SmoothLink;
