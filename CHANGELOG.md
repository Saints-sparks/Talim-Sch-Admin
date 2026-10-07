# Changelog

All notable changes to Talim School Admin. Contracts and "as built" notes live in `talimBE-V2/docs/`.

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
