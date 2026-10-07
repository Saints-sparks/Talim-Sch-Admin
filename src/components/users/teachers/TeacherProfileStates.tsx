"use client";

import React from "react";
import { ProfileError, ProfileSkeleton } from "../parts";

/**
 * The teacher profile while it loads: the same frame the loaded page uses,
 * so nothing jumps when the data lands.
 *
 * @returns The skeleton.
 */
export function TeacherProfileSkeleton() {
  return <ProfileSkeleton label="Loading the teacher's profile" />;
}

/** Props for {@link TeacherProfileError}. */
interface TeacherProfileErrorProps {
  /** Heading for the panel. */
  title: string;
  /** What went wrong, in the user's words. */
  message: string;
  /** True for "not found", which changes the icon from an alert to a person. */
  notFound?: boolean;
  /** Goes back to the roster. */
  onBack: () => void;
  /** Retries the request, when retrying could help. */
  onRetry?: () => void;
}

/**
 * A full-page failure for the teacher profile and editor.
 *
 * @param props - See {@link TeacherProfileErrorProps}.
 * @param props.title - The heading.
 * @param props.message - What went wrong.
 * @param props.notFound - Whether the teacher was not found.
 * @param props.onBack - Back handler.
 * @param props.onRetry - Retry handler.
 * @returns The error screen.
 */
export function TeacherProfileError({
  title,
  message,
  notFound = false,
  onBack,
  onRetry,
}: TeacherProfileErrorProps) {
  return (
    <ProfileError
      title={title}
      message={message}
      notFound={notFound}
      backLabel="Back to Teachers"
      onBack={onBack}
      onRetry={onRetry}
    />
  );
}
