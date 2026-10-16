"use client";

import React from "react";
import type {
  StudentTranscript,
  TranscriptIssue,
  TranscriptSession,
  TranscriptTerm,
} from "@/app/services/student.service";
import { QrCode } from "@/components/ui/QrCode";
import {
  Pill,
  cardFrame,
  eyebrow,
  table,
  tableScroll,
  td,
  th,
  theadRow,
  tile,
  tr,
} from "@/components/tl";
import {
  STATUS_LABEL,
  attendanceText,
  day,
  issuedDay,
  num,
  outcomeLabel,
  positionText,
} from "./transcriptFormat";

/**
 * One term: its subjects with scores, percentages, grades and remarks, then
 * the term's average, grade, position and attendance.
 *
 * @param props - The term.
 * @param props.term - The term.
 * @returns The term block.
 */
function TermBlock({ term }: { term: TranscriptTerm }) {
  return (
    <section aria-label={term.term} className="flex flex-col gap-2 break-inside-avoid">
      <h4 className="text-[15px] font-extrabold text-tl-ink">{term.term}</h4>
      <div className={cardFrame}>
        <div className={tableScroll} data-print-overflow>
          <table className={`${table} min-w-[560px]`}>
            <thead>
              <tr className={theadRow}>
                <th scope="col" className={th}>
                  Subject
                </th>
                <th scope="col" className={`${th} text-right`}>
                  Score
                </th>
                <th scope="col" className={`${th} text-right`}>
                  %
                </th>
                <th scope="col" className={th}>
                  Grade
                </th>
                <th scope="col" className={th}>
                  Remark
                </th>
              </tr>
            </thead>
            <tbody>
              {term.subjects.map((subject) => (
                <tr key={subject.code} className={tr}>
                  <td className={`${td} font-bold text-tl-ink`}>{subject.name}</td>
                  <td className={`${td} text-right tabular-nums`}>
                    {num(subject.score)} / {num(subject.max)}
                  </td>
                  <td className={`${td} text-right tabular-nums`}>{num(subject.percent)}</td>
                  <td className={`${td} font-bold`}>{subject.grade ?? "—"}</td>
                  <td className={td}>{subject.remark ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        {[
          ["Average", num(term.average, "%")],
          ["Grade", term.grade ?? "—"],
          ["Position", positionText(term)],
          ["Attendance", attendanceText(term)],
        ].map(([label, value]) => (
          <div key={label} className={`${tile} !p-3`}>
            <dt className="text-xs font-bold text-tl-muted">{label}</dt>
            <dd className="mt-0.5 font-extrabold tabular-nums text-tl-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * One session: the class, how it ended, the session average and its terms.
 *
 * @param props - The session.
 * @param props.session - The session.
 * @returns The session block.
 */
function SessionBlock({ session }: { session: TranscriptSession }) {
  const outcome = outcomeLabel(session.outcome);
  return (
    <section
      aria-label={`${session.session ?? "Session"} ${session.className}`}
      className="flex flex-col gap-4 border-t border-tl-line-soft pt-5 first:border-t-0 first:pt-0"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[17px] font-extrabold text-tl-ink">
          {session.session ?? "Session"} · {session.className}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {outcome ? (
            <Pill tone={outcome.tone} dot>
              {outcome.label}
            </Pill>
          ) : null}
          <span className="text-sm font-bold text-tl-muted">
            Session average {num(session.average, "%")}
          </span>
        </div>
      </div>
      {session.terms.map((term) => (
        <TermBlock key={term.termId} term={term} />
      ))}
    </section>
  );
}

/** Props for {@link TranscriptView}. */
export interface TranscriptViewProps {
  transcript: StudentTranscript;
  /** The issued code, shown with its link and a QR once issued. */
  issue?: TranscriptIssue | null;
}

/**
 * A transcript laid out as a report: the school and the student, every
 * session in order with its terms (subject scores, averages, positions,
 * attendance), the cumulative average and the grade key, and, once issued,
 * the verification code with its link and QR. The same markup prints.
 *
 * @param props - See {@link TranscriptViewProps}.
 * @param props.transcript - The transcript.
 * @param props.issue - The issued code, if any.
 * @returns The transcript.
 */
export function TranscriptView({ transcript, issue }: TranscriptViewProps) {
  const { student, schools, sessions, gradeScale } = transcript;
  return (
    <article aria-label={`Transcript of ${student.name}`} className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        {schools.map((school) => {
          const outcome = outcomeLabel(school.outcome);
          return (
            <div key={school.id} className="flex flex-wrap items-center gap-3">
              {school.logo ? (
                <img src={school.logo} alt="" className="h-12 w-12 rounded-lg object-contain" />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className={eyebrow}>Transcript</p>
                <p className="text-[19px] font-extrabold text-tl-ink">{school.name}</p>
                <p className="text-[13px] text-tl-muted">
                  Admission no. {school.admissionNumber ?? "—"} · {day(school.from)} to{" "}
                  {school.to ? day(school.to) : "date"}
                  {outcome ? ` · ${outcome.label}` : ""}
                </p>
              </div>
            </div>
          );
        })}
        <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          {[
            ["Student", student.name],
            ["Status", STATUS_LABEL[student.status] ?? student.status],
            ["Date of birth", day(student.dateOfBirth)],
            [
              student.leftAt ? "Left on" : "Gender",
              student.leftAt ? day(student.leftAt) : (student.gender ?? "—"),
            ],
          ].map(([label, value]) => (
            <div key={label} className={`${tile} !p-3`}>
              <dt className="text-xs font-bold text-tl-muted">{label}</dt>
              <dd className="mt-0.5 font-extrabold capitalize text-tl-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="flex flex-col gap-6">
        {sessions.map((session) => (
          <SessionBlock
            key={`${session.schoolId}-${session.session}-${session.className}`}
            session={session}
          />
        ))}
      </div>

      <footer className="flex flex-col gap-4 border-t border-tl-line-soft pt-5">
        <p className="text-[15px] font-extrabold text-tl-ink">
          Cumulative average:{" "}
          <span className="tabular-nums">{num(transcript.cumulativeAverage, "%")}</span>
        </p>
        {gradeScale.length ? (
          <div>
            <p className="text-xs font-bold text-tl-muted">Grade key</p>
            <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-tl-body">
              {gradeScale.map((band) => (
                <li key={band.letter}>
                  <span className="font-extrabold text-tl-ink">{band.letter}</span> {band.min}%+
                  {band.remark ? ` ${band.remark}` : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {issue ? (
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-tl-line-soft p-4">
            <QrCode value={issue.verifyUrl} size={112} label={`QR code for ${issue.verifyUrl}`} />
            <div className="min-w-0 text-sm">
              <p className="text-xs font-bold text-tl-muted">Verification code</p>
              <p className="font-mono text-[20px] font-extrabold tracking-[0.12em] text-tl-ink">
                {issue.code}
              </p>
              <p className="mt-1 break-all text-tl-body">
                Check it at <span className="font-bold">{issue.verifyUrl}</span>
              </p>
              <p className="text-[13px] text-tl-muted">Issued {issuedDay(issue.issuedAt)}</p>
            </div>
          </div>
        ) : null}
        <p className="text-xs text-tl-muted">
          Published results only. Generated {issuedDay(transcript.generatedAt)}.
        </p>
      </footer>
    </article>
  );
}

export default TranscriptView;
