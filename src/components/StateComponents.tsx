"use client";

import React from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { card, ghostButton, primaryButton } from "@/components/tl/styles";

interface LoadingStateProps {
  message?: string;
}

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
}

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

/**
 * A page or panel that is still loading: a spinner and a line, announced as
 * busy. Prefer the shape-holding skeletons in `@/components/tl` for new code.
 *
 * @param props - The line to show.
 * @param props.message - What is loading; default "Loading...".
 * @returns The loading state.
 */
export const LoadingState: React.FC<LoadingStateProps> = ({ message = "Loading..." }) => {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-16"
      role="status"
      aria-busy="true"
    >
      <Loader2 className="h-8 w-8 animate-spin text-tl-brand" aria-hidden />
      <p className="text-[15px] font-semibold text-tl-muted">{message}</p>
    </div>
  );
};

/**
 * A failed load in the portals' card: the title, the message and Retry. It is
 * an alert, so it is read out when it appears.
 *
 * @param props - See `ErrorStateProps`.
 * @param props.title - The bold line.
 * @param props.message - What went wrong.
 * @param props.onRetry - Retries the load.
 * @param props.retryText - The button's words; default "Try Again".
 * @returns The error state.
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  onRetry,
  retryText = "Try Again",
}) => {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div role="alert" className={`${card} w-full max-w-md text-center`}>
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-tl-danger-bg">
          <AlertCircle className="h-6 w-6 text-tl-danger" aria-hidden />
        </span>
        <div className="mt-4 text-lg font-extrabold text-tl-ink">{title}</div>
        <p className="mt-1.5 text-[15px] text-tl-body">{message}</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className={`${ghostButton} mt-6`}>
            {retryText}
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Nothing to show yet, in the portals' card: an icon, the title, the message
 * and an optional action.
 *
 * @param props - See `EmptyStateProps`.
 * @param props.icon - A glyph or emoji shown above the title (decorative).
 * @param props.title - The bold line.
 * @param props.message - The explanation.
 * @param props.actionText - The action's words.
 * @param props.onAction - Runs the action.
 * @returns The empty state.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className={`${card} w-full max-w-md text-center`}>
        <span
          aria-hidden
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-tl-track text-3xl"
        >
          {icon}
        </span>
        <div className="mt-4 text-lg font-extrabold text-tl-ink">{title}</div>
        <p className="mt-1.5 text-[15px] text-tl-muted">{message}</p>
        {actionText && onAction && (
          <button type="button" onClick={onAction} className={`${primaryButton} mt-6`}>
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
};
