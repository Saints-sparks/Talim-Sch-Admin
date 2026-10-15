# Changelog

All notable changes to Talim School Admin. Contracts and "as built" notes live in `talimBE-V2/docs/`.

## Unreleased

Past records, former students and transcripts (contract: `talimBE-V2/docs/history-records-and-transcripts.md`, §3 to §6).

### Import past records (§3)

- **Settings → Data & System → Import Past Records** (`/settings/import`, the school admin only, as the API is): download the template, read the guide, then drop or choose an .xlsx workbook, a ZIP of CSV files or one CSV (50 MB; the kind and size are checked before anything is sent).
- The import is followed as the server works on it: checking, then **Needs fixing** (rows per sheet, a paged table of errors by sheet, row, column and message, **Download all errors (CSV)**, warnings; upload a corrected file from the same page) or **Ready to import** (warnings to read, then **Import** with a confirmation). Importing shows the phase and done/total until **Imported** (what was created and updated per kind of record) or **Stopped** (the reason and **Try again**, which resumes safely). Past imports are listed newest first with their status and dates.
- **The guide** (`/settings/import/guide`) is the backend's `docs/history-import-guide.md`, copied in by `npm run guide:import` (re-run it whenever the guide changes) and rendered without any HTML from the text.

### Students and former students (§4, §6)

- **Status filter** on the students roster: All, Active, Graduated, Withdrawn, Left Talim and Deactivated, and a status badge on every card. `GET /users/students` does not send a student's status yet, so until it does former students show under Deactivated and the page says so.
- **Records tab** on the student profile: the school's part of the transcript, laid out as a report (sessions in order with the class and outcome, each term's subject scores, percentages, grades and remarks, average, position and attendance, the cumulative average and the grade key). **Issue transcript** gives a verification code and link; **Print / Save as PDF** prints the transcript alone, portrait, with the code and a QR of the link. A student who moved to another Talim school opens on a records-only page.
- **Mark as left** (graduated, withdrawn or left Talim, with the session and a note) and **Reinstate** (withdrawn or left Talim, into a class) on the profile, for admins with Transit access; the "already left" and "can't be reinstated" refusals are explained in plain words. The profile shows the student's status.

### Promotions (§4)

- Each decision in the promotion wizard is **Promote**, **Repeat**, **Graduate** (offered for the school's top level) or **Withdraw**, and a whole top-level class can be graduated in bulk. The review and submit steps count the students per action, and a run's details show each decision's action.

### Under the hood

- `qrcode-generator` 2.0.4 draws the transcript QR (the library the Students portal uses).
- The importer's routes are typed by hand in `imports.service.ts` until the generated contract carries them; the rest comes from `npm run types:api`.

## 1.5.0 (2026-10-07)

v1.5, the clean release before V2 (contract: `talimBE-V2/docs/v1.5-platform-sync.md`, §1, §3 and §4).

### The shared design system (§4)

- **Tokens.** School Admin uses the portals' `tl` tokens (Teachers and Students): colours with a dark theme, radii, the type scale and Manrope. The shadcn variables follow them, so the `ui/*` primitives match.
- **A shared layer** in `src/components/tl`: buttons, cards, stat tiles, tables, tabs, segmented filters, chips, pills, sheets and confirmation sheets, page headers, loading skeletons, empty and error states, banners and whole-page status screens. Every interactive control is at least 44px; text pairs are AA in light and dark.
- **The shell.** A sidebar in titled groups (Overview, Academics, People, Money, Communication) with Settings, Log out, Help & support and the version at its foot; it collapses to an icon rail, and below 980px it is a drawer (Escape and the overlay close it). The top bar shows the school, the date, the live connection, the theme menu, notifications and the avatar. Access Denied, not-found, error and loading screens use the same card.
- **Every page restyled** in groups: dashboard; users (students, teachers, parents, sub-admins); classes and curriculum; timetable, assessments and term results; fees, finance and payments; transit; messages, announcements and notifications; leave requests; settings, profile and onboarding; the auth pages. Routes, data, permission gating and behaviour are unchanged; every payment guard and the bank-transfer and part-payment flows are kept.
- **Auth pages** use the shared Talim sign-in look (`src/components/auth/signin-ui`, an identical copy of Talim-Teachers', see its `docs/signin-ui.md`) with an "Admin" pill. Sign-in, set-password and the password reset keep their behaviour, ids and words.
- `scripts/tl-codemod.mjs` moves legacy colour classes onto the tokens (pairs, then `--singles`).

### Support desk (§1)

- **The Support desk replaces Complaints** at `/support`, for the school admin and sub-admins with the new `manage:support` permission ("Manage Support Desk" in the sub-admin picker): status tabs with counts, Unassigned and Mine shortcuts, area, priority and assignee filters, and search. A ticket shows the requester, the child, the area and its history; internal notes are marked; staff reply with attachments or add internal notes, set the status (only the transitions the backend allows), priority and assignee, and escalate to Talim (then read only). Every 409 says why and reloads the ticket, keeping the draft.
- **Help & support** at `/help` for every admin: Contact Talim support (raise a ticket to Talim, follow your tickets, reply, reopen within 7 days, close), the support email and the version. Linked from the sidebar and from Settings → Data & System.
- A support notification opens its ticket ("Open ticket"). Old `/complaints` links redirect; the complaints service and card are removed.

### Version (§3)

- `package.json` is 1.5.0. "Version 1.5.0" (read from `package.json`) shows at the foot of the sidebar, in Help & support, in Settings and in Settings → Data & System, and every support ticket reports it.
