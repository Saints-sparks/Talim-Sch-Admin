"use client";

/**
 * The "Quick Actions" card on the curriculum dashboard: one row button per
 * shortcut.
 *
 * The two creating actions are only rendered for an administrator who holds
 * `manage:curriculum`; a sub-admin without it sees the read-only "Manage
 * Structure" shortcut rather than buttons the API would refuse.
 */
import React, { forwardRef } from "react";
import { BookOpen, ChevronRight, GraduationCap, Settings } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { CardHeader, card, focusRing } from "@/components/tl";
import { Permission } from "@/lib/permissions";

/** Props for {@link CurriculumQuickActions}. */
interface CurriculumQuickActionsProps {
  /** Opens the structure screen with the add-subject sheet. */
  onAddSubject: () => void;
  /** Opens the structure screen with the add-course sheet. */
  onAddCourse: () => void;
  /** Opens the structure screen. */
  onManageStructure: () => void;
}

/** Props for {@link ActionButton}. */
interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The bold line. */
  title: string;
  /** The grey line under it. */
  subtitle: string;
  /** The icon in the tone chip. */
  icon: React.ReactNode;
  /** The tone class for the chip (`tl-tone-N`). */
  tone: string;
}

/**
 * One shortcut: a full-width row button with a tone chip, two lines and a
 * chevron. Forwards its ref and props so a tooltip can wrap it.
 *
 * @param props - See {@link ActionButtonProps}.
 * @param props.title - The bold line.
 * @param props.subtitle - The grey line.
 * @param props.icon - The icon.
 * @param props.tone - The chip's tone class.
 * @param ref - The button.
 * @returns The button.
 */
const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(function ActionButton(
  { title, subtitle, icon, tone, className = "", ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      {...rest}
      className={`group flex min-h-[64px] w-full items-center gap-3.5 rounded-2xl border border-tl-line-soft bg-tl-surface px-4 py-3.5 text-left transition-colors hover:border-tl-control hover:bg-tl-subtle ${focusRing} ${className}`}
    >
      <span
        aria-hidden
        className={`${tone} flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-tone-bd bg-tone-bg text-tone-fg [&>svg]:h-5 [&>svg]:w-5`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold text-tl-ink">{title}</span>
        <span className="mt-0.5 block text-[13px] text-tl-muted">{subtitle}</span>
      </span>
      <ChevronRight
        aria-hidden
        className="h-5 w-5 shrink-0 text-tl-faint transition-transform group-hover:translate-x-0.5"
      />
    </button>
  );
});

/**
 * Renders the quick-action card.
 *
 * @param props - Handlers for each shortcut.
 * @param props.onAddSubject - Add a subject.
 * @param props.onAddCourse - Add a course.
 * @param props.onManageStructure - Open the structure.
 * @returns The card.
 */
export function CurriculumQuickActions({
  onAddSubject,
  onAddCourse,
  onManageStructure,
}: CurriculumQuickActionsProps) {
  return (
    <section className={card} data-guide="curriculum-actions">
      <CardHeader title="Quick Actions" subtitle="Shortcuts into the curriculum structure." />

      <div className="mt-[18px] grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))]">
        <PermissionGate permission={Permission.MANAGE_CURRICULUM}>
          <Tooltip
            content="Create a new subject area. You can add courses to it afterwards."
            side="top"
          >
            <ActionButton
              title="Add Subject"
              subtitle="Create new subject"
              icon={<BookOpen />}
              tone="tl-tone-1"
              onClick={onAddSubject}
            />
          </Tooltip>
        </PermissionGate>

        <PermissionGate permission={Permission.MANAGE_CURRICULUM}>
          <Tooltip
            content="Create a course within the selected subject. Choose which class it belongs to."
            side="top"
          >
            <ActionButton
              title="Add Course"
              subtitle="Create new course"
              icon={<GraduationCap />}
              tone="tl-tone-2"
              onClick={onAddCourse}
            />
          </Tooltip>
        </PermissionGate>

        <ActionButton
          title="Manage Structure"
          subtitle="View all settings"
          icon={<Settings />}
          tone="tl-tone-3"
          onClick={onManageStructure}
        />
      </div>
    </section>
  );
}
