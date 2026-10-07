"use client";

import React from "react";
import { bandSplitByPassMark, parsePercent, previewGrading, type BandDraft } from "./gradeScale";

/**
 * The scale drawn on a 0–100% line with the pass mark on it, and the same
 * facts as a list (which is what a screen reader reads; the bar is hidden
 * from it). Drawn only while the scale passes its checks.
 */
export function GradePreview({ rows, passMark }: { rows: BandDraft[]; passMark: string }) {
  const bands = previewGrading(rows, passMark);
  const pass = parsePercent(passMark);

  if (!bands.length) {
    return (
      <p className="text-xs text-tl-muted">
        The preview appears once every grade has a letter and a valid minimum.
      </p>
    );
  }

  const split = bandSplitByPassMark(bands, passMark);
  const passing = bands.filter((b) => b.passes).map((b) => b.letter);

  return (
    <div>
      <div className="relative" aria-hidden>
        <div className="flex h-9 w-full overflow-hidden rounded-lg border border-tl-line">
          {bands.map((b) => (
            <div
              key={b.id}
              style={{ width: `${b.to - b.from}%` }}
              title={`${b.letter}: ${b.range}`}
              className={`flex items-center justify-center truncate text-[11px] font-semibold border-r border-white/70 last:border-r-0 ${
                b.passes ? "bg-tl-success-bg text-tl-success" : "bg-tl-danger-bg text-tl-danger"
              }`}
            >
              {b.to - b.from >= 4 ? b.letter : ""}
            </div>
          ))}
        </div>
        {pass !== null && (
          <div
            className="absolute -top-1 -bottom-1 w-0.5 bg-tl-brand-fill"
            style={{ left: `calc(${pass}% - 1px)` }}
          />
        )}
        <div className="mt-1 flex justify-between text-[10px] text-tl-muted tabular-nums">
          <span>0%</span>
          {pass !== null && <span>Pass mark {pass}%</span>}
          <span>100%</span>
        </div>
      </div>

      <p className="mt-3 text-xs text-tl-body">
        {pass === null
          ? "Set a pass mark to see which grades pass."
          : passing.length
            ? `Scores of ${pass}% and above pass: ${passing.slice().reverse().join(", ")}${split ? `, and part of ${split.letter}` : ""}.`
            : `No grade starts at or above the pass mark of ${pass}%.`}
      </p>
      {split && (
        <p className="mt-1 text-xs text-tl-warning">
          The pass mark falls inside {split.letter} ({split.range}), so some {split.letter} scores
          pass and some fail.
        </p>
      )}

      <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-tl-muted">
        {bands
          .slice()
          .reverse()
          .map((b) => (
            <li key={`${b.id}-row`} className="flex justify-between gap-2">
              <span>
                <span className="font-semibold text-tl-ink">{b.letter}</span>
                {b.remark ? ` · ${b.remark}` : ""}
              </span>
              <span className="tabular-nums text-tl-muted">{b.range}</span>
            </li>
          ))}
      </ul>
    </div>
  );
}
