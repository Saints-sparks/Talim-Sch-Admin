'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from '@/context/TransitionContext';

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
  const { startTransition, endTransition } = useTransition();

  // End transition when pathname changes
  useEffect(() => {
    endTransition();
  }, [pathname, endTransition]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Execute custom onClick if provided
    if (onClick) {
      onClick(e);
    }

    // Don't navigate if we're already on the target page
    if (pathname === href) {
      return;
    }

    // Start transition immediately
    startTransition();

    try {
      if (replace) {
        router.replace(href);
      } else {
        router.push(href);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      endTransition();
    }
  };

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
};

export default SmoothLink;
