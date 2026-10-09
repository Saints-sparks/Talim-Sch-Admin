"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Avatar from "@/components/Avatar";
import { Pill, card, rowButton } from "@/components/tl";
import type { Student } from "@/app/services/student.service";

/** Props for {@link StudentRosterCard}. */
interface StudentRosterCardProps {
  /** The student to show. */
  student: Student;
  /** Position in the grid, used only to stagger the entry animation. */
  index: number;
  /** The student's profile page (a link, so it opens before the page has hydrated, and in a new tab). */
  profileHref: string;
}

/**
 * One card in the students grid: avatar, name, admission number, the grade
 * and status pills, and View Profile.
 *
 * @param props - See {@link StudentRosterCardProps}.
 * @param props.student - The student.
 * @param props.index - Grid position, for the stagger.
 * @param props.profileHref - The profile page.
 * @returns The card.
 */
export function StudentRosterCard({ student, index, profileHref }: StudentRosterCardProps) {
  const name = `${student.userId.firstName} ${student.userId.lastName}`;
  return (
    <motion.article
      aria-label={name}
      className={`${card} flex flex-col items-center text-center`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.03, duration: 0.2 }}
    >
      <Avatar
        src={student.userId.userAvatar}
        firstName={student.userId.firstName}
        lastName={student.userId.lastName}
        className="h-[72px] w-[72px] text-xl"
      />
      <div className="mt-3 flex w-full flex-1 flex-col items-center">
        <h2 className="break-words text-base font-extrabold text-tl-ink">{name}</h2>
        <p className="mt-1 text-[13px] font-bold text-tl-muted">
          ID {student.admissionNumber || "Not assigned"}
        </p>
        <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
          {student.gradeLevel ? <Pill tone="info">{student.gradeLevel}</Pill> : null}
          <Pill tone={student.isActive ? "success" : "muted"} dot>
            {student.isActive ? "Active" : "Inactive"}
          </Pill>
        </div>
        <div className="mt-auto w-full pt-4">
          <Link href={profileHref} className={`${rowButton} w-full`}>
            View Profile
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

export default StudentRosterCard;
