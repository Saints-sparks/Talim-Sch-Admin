"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Plus, Trash2 } from "lucide-react";
import { Card, CardHeader, OutlineBtn } from "@/components/settings/ui";
import { FieldError, controlClasses, describedBy } from "@/components/settings/schoolDay/fields";
import {
  BAND_REMARK_MAX_LENGTH,
  LETTER_MAX_LENGTH,
  addBand,
  isDescending,
  moveBand,
  removeBand,
  sortBands,
  updateBand,
  type BandDraft,
  type BandErrors,
  type BandField,
} from "./gradeScale";

interface GradeScaleEditorProps {
  rows: BandDraft[];
  errors: BandErrors;
  /** A message about the scale as a whole. */
  scaleError?: string;
  canManage: boolean;
  onChange: (rows: BandDraft[]) => void;
}

/**
 * The grade scale: one row per grade, highest first, each with a letter, the
 * minimum percent that earns it and an optional remark. The arrow buttons
 * swap a grade with its neighbour (the minimums stay in place, see
 * `moveBand`); a new grade goes just above the 0% floor and its letter field
 * takes focus.
 */
export function GradeScaleEditor({
  rows,
  errors,
  scaleError,
  canManage,
  onChange,
}: GradeScaleEditorProps) {
  const [focusId, setFocusId] = useState<string | null>(null);
  const letterRefs = useRef(new Map<string, HTMLInputElement>());

  useEffect(() => {
    if (!focusId) return;
    letterRefs.current.get(focusId)?.focus();
    setFocusId(null);
  }, [focusId]);

  const handleAdd = () => {
    const added = addBand(rows);
    onChange(added.rows);
    setFocusId(added.id);
  };

  return (
    <Card>
      <CardHeader
        title="Grade scale"
        action={
          canManage ? (
            <OutlineBtn onClick={handleAdd} className="!px-3 !py-1.5 !text-xs">
              <Plus className="w-3.5 h-3.5" aria-hidden />
              Add grade
            </OutlineBtn>
          ) : undefined
        }
      />
      <div className="p-5 space-y-3">
        <p id="grade-scale-help" className="text-xs text-tl-muted">
          Highest grade first. A grade runs from its minimum up to the next grade&apos;s minimum.
          Letters must be unique, each minimum lower than the one above it, and the last grade must
          start at 0%.
          {canManage && " Moving a grade swaps it with its neighbour; the minimums stay in order."}
        </p>

        {scaleError && (
          <p role="alert" className="text-xs text-tl-danger">
            {scaleError}
          </p>
        )}

        {rows.length > 0 && (
          <ol className="space-y-2" aria-label="Grades" aria-describedby="grade-scale-help">
            {rows.map((row, index) => (
              <BandRow
                key={row.id}
                row={row}
                index={index}
                count={rows.length}
                errors={errors[row.id] ?? {}}
                canManage={canManage}
                letterRef={(el) => {
                  if (el) letterRefs.current.set(row.id, el);
                  else letterRefs.current.delete(row.id);
                }}
                onPatch={(patch) => onChange(updateBand(rows, row.id, patch))}
                onMove={(direction) => onChange(moveBand(rows, index, direction))}
                onRemove={() => onChange(removeBand(rows, row.id))}
              />
            ))}
          </ol>
        )}

        {canManage && !isDescending(rows) && (
          <OutlineBtn onClick={() => onChange(sortBands(rows))} className="!text-xs">
            <ArrowUpDown className="w-3.5 h-3.5" aria-hidden />
            Sort by minimum
          </OutlineBtn>
        )}
      </div>
    </Card>
  );
}

interface BandRowProps {
  row: BandDraft;
  index: number;
  count: number;
  errors: Partial<Record<BandField, string>>;
  canManage: boolean;
  letterRef: (el: HTMLInputElement | null) => void;
  onPatch: (patch: Partial<Pick<BandDraft, BandField>>) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}

/** One grade. */
function BandRow({
  row,
  index,
  count,
  errors,
  canManage,
  letterRef,
  onPatch,
  onMove,
  onRemove,
}: BandRowProps) {
  const base = `grade-${row.id}`;
  const name = row.letter.trim() ? `grade ${row.letter.trim()}` : `row ${index + 1}`;
  const iconBtn =
    "p-1.5 rounded-md text-tl-muted hover:bg-tl-bg disabled:opacity-30 disabled:hover:bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-tl-link";

  return (
    <li className="rounded-lg border border-tl-line bg-tl-surface p-3">
      <div className="flex flex-wrap items-start gap-3">
        {canManage && (
          <div className="flex flex-col pt-5">
            <button
              type="button"
              className={iconBtn}
              onClick={() => onMove(-1)}
              disabled={index === 0}
              aria-label={`Move ${name} up`}
            >
              <ArrowUp className="w-3.5 h-3.5" aria-hidden />
            </button>
            <button
              type="button"
              className={iconBtn}
              onClick={() => onMove(1)}
              disabled={index === count - 1}
              aria-label={`Move ${name} down`}
            >
              <ArrowDown className="w-3.5 h-3.5" aria-hidden />
            </button>
          </div>
        )}

        <div className="w-24">
          <label htmlFor={`${base}-letter`} className="block text-xs font-medium text-tl-body mb-1">
            Letter
          </label>
          <input
            ref={letterRef}
            id={`${base}-letter`}
            type="text"
            value={row.letter}
            maxLength={LETTER_MAX_LENGTH}
            disabled={!canManage}
            autoComplete="off"
            onChange={(e) => onPatch({ letter: e.target.value })}
            className={controlClasses(Boolean(errors.letter))}
            {...describedBy(`${base}-letter`, errors.letter)}
          />
          <FieldError controlId={`${base}-letter`} message={errors.letter} />
        </div>

        <div className="w-32">
          <label htmlFor={`${base}-min`} className="block text-xs font-medium text-tl-body mb-1">
            Minimum (%)
          </label>
          <input
            id={`${base}-min`}
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            step="any"
            value={row.min}
            disabled={!canManage}
            onChange={(e) => onPatch({ min: e.target.value })}
            className={controlClasses(Boolean(errors.min))}
            {...describedBy(`${base}-min`, errors.min)}
          />
          <FieldError controlId={`${base}-min`} message={errors.min} />
        </div>

        <div className="flex-1 min-w-[10rem]">
          <label htmlFor={`${base}-remark`} className="block text-xs font-medium text-tl-body mb-1">
            Remark <span className="font-normal text-tl-muted">(optional)</span>
          </label>
          <input
            id={`${base}-remark`}
            type="text"
            value={row.remark}
            maxLength={BAND_REMARK_MAX_LENGTH}
            disabled={!canManage}
            placeholder="e.g. Very good"
            onChange={(e) => onPatch({ remark: e.target.value })}
            className={controlClasses(Boolean(errors.remark))}
            {...describedBy(`${base}-remark`, errors.remark)}
          />
          <FieldError controlId={`${base}-remark`} message={errors.remark} />
        </div>

        {canManage && (
          <div className="pt-6">
            <button
              type="button"
              onClick={onRemove}
              disabled={count === 1}
              aria-label={`Delete ${name}`}
              className="p-2 rounded-md text-tl-faint hover:text-tl-danger hover:bg-tl-danger-bg disabled:opacity-30 disabled:hover:bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-tl-danger"
            >
              <Trash2 className="w-4 h-4" aria-hidden />
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
