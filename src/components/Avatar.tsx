"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { toneClass } from "@/components/tl";

/** Props for {@link Avatar}. */
interface AvatarProps {
  /** Photo URL, if any; the initials show when it is missing or fails to load. */
  src?: string | null;
  /** First name, for the first initial and the photo's alt text. */
  firstName: string;
  /** Last name, for the second initial and the photo's alt text. */
  lastName: string;
  /** `sm` 32px, `md` 64px (default), `lg` 128px. */
  size?: "sm" | "md" | "lg";
  /** Extra classes; they win over the size classes. */
  className?: string;
}

/** Diameter and initials size per preset. */
const SIZE_CLASSES = {
  sm: "h-8 w-8 text-xs",
  md: "h-16 w-16 text-lg",
  lg: "h-32 w-32 text-3xl",
} as const;

/**
 * A person's round avatar in the tl look: their photo, or their initials on a
 * stable tone (the same person keeps the same colour everywhere).
 *
 * @param props - See {@link AvatarProps}.
 * @param props.src - Photo URL.
 * @param props.firstName - First name.
 * @param props.lastName - Last name.
 * @param props.size - Size preset.
 * @param props.className - Extra classes.
 * @returns The avatar.
 */
const Avatar: React.FC<AvatarProps> = ({ src, firstName, lastName, size = "md", className = "" }) => {
  const [imageError, setImageError] = useState(false);

  const initials = `${firstName?.charAt(0)?.toUpperCase() || ""}${lastName?.charAt(0)?.toUpperCase() || ""}`;
  const shouldShowImage = src && !imageError;

  if (shouldShowImage) {
    return (
      <img
        src={src}
        alt={`${firstName} ${lastName}`}
        className={cn(SIZE_CLASSES[size], "shrink-0 rounded-full object-cover", className)}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        SIZE_CLASSES[size],
        toneClass(`${firstName ?? ""}${lastName ?? ""}`.toLowerCase()),
        "flex shrink-0 items-center justify-center rounded-full bg-tone-bg font-extrabold text-tone-fg",
        className
      )}
    >
      {initials}
    </div>
  );
};

export default Avatar;
