"use client";

import React, { useId, useState } from "react";
import { Sheet } from "@/components/tl/Sheet";
import { Field } from "@/components/tl/bits";
import { ghostButton, primaryButton, textareaControl } from "@/components/tl/styles";
import { TICKET_LIMITS } from "@/types/tickets";
import { validateEscalationNote } from "./ticket.presentation";

/** Props for {@link EscalateSheet}. */
export interface EscalateSheetProps {
  /** Whether it is shown. */
  open: boolean;
  /** Closes without escalating. */
  onClose: () => void;
  /** Escalates with the note; resolves true when it worked. */
  onEscalate: (note: string) => Promise<boolean>;
  /** True while the escalation runs. */
  busy: boolean;
  /** The ticket's reference, for the subtitle. */
  reference: string;
}

/**
 * "Escalate to Talim": a sheet asking why (1 to 2000 characters). The note is
 * kept on the ticket as an internal note; the ticket moves to the Talim desk
 * with its history, and the school desk keeps read-only access.
 *
 * @param props - See {@link EscalateSheetProps}.
 * @param props.open - Whether it is shown.
 * @param props.onClose - Closes it.
 * @param props.onEscalate - Escalates.
 * @param props.busy - Whether it runs.
 * @param props.reference - The ticket's reference.
 * @returns The sheet.
 */
export function EscalateSheet({ open, onClose, onEscalate, busy, reference }: EscalateSheetProps) {
  const id = useId();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  /**
   * Checks the note and escalates.
   *
   * @param event - The form's submit event.
   */
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const problem = validateEscalationNote(note);
    setError(problem);
    if (problem) return;
    if (await onEscalate(note.trim())) {
      setNote("");
      onClose();
    }
  };

  const noteId = `${id}-note`;
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => !next && onClose()}
      dismissible={!busy}
      eyebrowText={reference}
      title="Escalate to Talim"
      subtitle="Talim support takes the ticket over with its whole history. Your desk can still read it but can't change it."
    >
      <form
        onSubmit={(event) => void submit(event)}
        className="flex flex-col gap-[18px]"
        noValidate
      >
        <Field
          id={noteId}
          label="Why does this need Talim?"
          hint="Kept on the ticket as an internal note; the requester doesn't see it."
          error={error}
          required
        >
          <textarea
            id={noteId}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
            maxLength={TICKET_LIMITS.noteMax}
            aria-invalid={error ? true : undefined}
            aria-describedby={[error ? `${noteId}-error` : "", `${noteId}-hint`]
              .filter(Boolean)
              .join(" ")}
            className={textareaControl}
            data-autofocus
          />
        </Field>
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            className={`${ghostButton} min-h-[48px] flex-1`}
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button type="submit" className={`${primaryButton} min-h-[48px] flex-1`} disabled={busy}>
            {busy ? "Escalating…" : "Escalate to Talim"}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
