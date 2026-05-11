# Tooltip Implementation Guide — Talim School Admin

This document outlines where tooltips should appear in the School Admin app, what they should say, and how to implement them consistently. The goal is to reduce confusion for first-time school administrators without cluttering the UI for experienced users.

---

## Principles

- **Contextual, not instructional.** Tooltips explain *why* something exists or what a term means — not how to click a button.
- **Short.** One sentence max. If it needs two sentences, it belongs in an empty state or a help modal, not a tooltip.
- **Triggered on hover/focus.** Never auto-show tooltips. Users must opt in by hovering or focusing an element.
- **Consistent placement.** Prefer `top` placement for icon buttons, `right` for sidebar items, `bottom` for form field labels.
- **Don't tooltip the obvious.** "Submit" and "Cancel" buttons do not need tooltips. Actions that match their label exactly do not need tooltips.

---

## Design System

Use a single shared `<Tooltip>` component so all tooltips look identical. Recommended implementation:

```tsx
// src/components/ui/Tooltip.tsx
"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export function Tooltip({
  children,
  content,
  side = "top",
  delayDuration = 400,
}: {
  children: React.ReactNode;
  content: string;
  side?: "top" | "right" | "bottom" | "left";
  delayDuration?: number;
}) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            className="z-50 max-w-xs rounded-lg bg-[#030E18] px-3 py-1.5 text-xs text-white shadow-md"
            sideOffset={6}
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-[#030E18]" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
```

**Package:** `@radix-ui/react-tooltip` (install if not already present).

**Usage:**
```tsx
import { Tooltip } from "@/components/ui/Tooltip";

<Tooltip content="Total students across all active classes">
  <span>{dashboardData.totalStudents}</span>
</Tooltip>
```

---

## Page-by-Page Tooltip Map

### 1. Sign In (`/`)

| Element | Tooltip text | Placement |
|---------|-------------|-----------|
| "Keep me signed in" checkbox | Stays signed in for 30 days. Uncheck on shared devices. | `right` |
| "Forgot password?" link | — (self-explanatory, no tooltip needed) | — |

---

### 2. Onboarding Phase 1 (`/onboarding`)

**Step 1 — School Profile**

| Element | Tooltip text | Placement |
|---------|-------------|-----------|
| School logo upload area | Recommended: square image, at least 200×200px. Appears on reports and student-facing pages. | `top` |
| Read-only school name field | This was set during registration. Contact support to change it. | `top` |

**Step 2 — Personal Profile**

| Element | Tooltip text | Placement |
|---------|-------------|-----------|
| Profile photo upload | Your photo appears in messages and announcements you send. | `top` |
| Display name fields | This name is shown to teachers, students, and parents across the platform. | `top` |

---

### 3. Onboarding Phase 2 (`/onboarding/setup`)

| Element | Tooltip text | Placement |
|---------|-------------|-----------|
| Lock icon on a step | Complete the required step(s) above before unlocking this one. | `right` |
| "Skip for now" on optional steps | You can complete this step later from the main app. It won't block your access. | `top` |
| Progress bar | Shows how many setup steps you've completed. Required steps must be done before full access is available. | `top` |
| Academic Year field | Example: "2025/2026". This groups all your terms, assessments, and timetables for the school year. | `right` |
| Term name field | Example: "First Term" or "Spring Term". Set it as the current term once created. | `right` |
| Class capacity field | Maximum number of students that can be enrolled in this class. | `right` |

---

### 4. Dashboard (`/dashboard`)

| Element | Tooltip text | Placement |
|---------|-------------|-----------|
| "Total Classes" metric card | Click to view and manage all classes. | `top` |
| "Total Students" metric card | Click to view the full student directory. | `top` |
| "Total Teachers" metric card | Click to view the full teacher directory. | `top` |
| "Total Subjects" metric card | Click to view your curriculum (subjects and courses). | `top` |
| Setup Progress Widget — Zap icon | Your school setup checklist. Complete all required steps to unlock the full experience. | `right` |
| Setup Progress Widget — "Continue setup" arrow | Resume where you left off in the setup checklist. | `top` |
| "Add Class" button on recent classes table | Create a new class for students and teachers to be assigned to. | `top` |

---

### 5. Classes (`/classes`)

| Element | Tooltip text | Placement |
|---------|-------------|-----------|
| "Add Class" button | Create a new class. You can assign students, teachers, and courses to it afterwards. | `top` |
| Grade Level dropdown | Optional grouping (e.g. Grade 1–12). Used for filtering and reporting. | `right` |
| Class Capacity field | Maximum students that can be enrolled. Students beyond this limit will be flagged during enrolment. | `right` |
| Pagination controls | — (self-explanatory) | — |

---

### 6. Class Detail (`/classes/[id]`)

| Element | Tooltip text | Placement |
|---------|-------------|-----------|
| "Class Teacher" field | The form teacher responsible for this class. Assign a teacher from Users → Teachers. | `right` |
| Courses tab | Courses currently assigned to this class. Manage courses in Curriculum. | `top` |
| Timetable tab | Scheduled sessions for this class. Add entries in Timetable. | `top` |

---

### 7. Curriculum (`/curriculum`)

| Element | Tooltip text | Placement |
|---------|-------------|-----------|
| "Subject" label | A broad area of study (e.g. Mathematics, English Language). | `right` |
| "Course" label | A specific unit or module within a subject (e.g. Algebra, Essay Writing). Assigned to a class. | `right` |
| "Add Subject" button | Create a new subject area. You can add courses to it afterwards. | `top` |
| "Add Course" button | Create a course within the selected subject. Choose which class it belongs to. | `top` |
| Subject code field | A short unique identifier for the subject (e.g. MTH, ENG). Used on reports and timetables. | `right` |
| Course code field | A short unique identifier for this course (e.g. MTH101). Used on timetables and assessments. | `right` |
| Delete subject button | Deleting a subject removes all its courses. This cannot be undone. | `top` |

---

### 8. Assessments (`/assessments`)

| Element | Tooltip text | Placement |
|---------|-------------|-----------|
| Term selector | Filter assessments by academic term. Set the current term in Settings. | `right` |
| "Create Assessment" button | Set up an exam, test, or project for the selected term. | `top` |
| Assessment type field | Examples: Exam, Test, Assignment, Project. Used for categorisation only. | `right` |
| Max score field | The total marks available. Used when recording student scores. | `right` |
| Status — Draft | Not yet visible to teachers. Still being prepared. | `top` |
| Status — Published | Visible to teachers. Scores can now be entered. | `top` |
| Status — Closed | Scoring period has ended. Results are finalised. | `top` |

---

### 9. Timetable (`/timetable`)

| Element | Tooltip text | Placement |
|---------|-------------|-----------|
| "Add Entry" button | Schedule a course session for a specific class, day, and time. | `top` |
| Start/End time fields | Use 24-hour format (e.g. 09:00 – 10:00). Overlapping entries for the same class will be flagged. | `right` |
| "Copy" button on an entry | Duplicate this session to another day without re-entering all details. | `top` |
| "Export" button | Download the timetable as an Excel file for printing or sharing. | `top` |
| Day filter | View the timetable for a single day of the week. | `right` |
| Class filter | Narrow the timetable to one class. | `right` |

---

### 10. Students (`/users/students`)

| Element | Tooltip text | Placement |
|---------|-------------|-----------|
| "Add Student" button | Enrol a new student and assign them to a class. An account will be created for them. | `top` |
| Class filter dropdown | Show only students in this class. | `right` |
| Status filter | Active students are currently enrolled. Inactive students have been deactivated. | `right` |
| Student ID badge | Auto-generated identifier. Used on reports and leave requests. | `top` |

---

### 11. Student Profile (`/users/students/[id]`)

| Element | Tooltip text | Placement |
|---------|-------------|-----------|
| "Edit" button | Update student personal details, guardian info, or class assignment. | `top` |
| Attendance field | Percentage of sessions attended this term. Updated by class teachers. | `right` |
| Parent/Guardian tab | Contact details for the student's primary guardian. Visible to class teachers. | `top` |

---

### 12. Teachers (`/users/teachers`)

| Element | Tooltip text | Placement |
|---------|-------------|-----------|
| "Add Teacher" button | Register a teacher account. They will receive login credentials via email. | `top` |
| Assigned classes badge | Classes this teacher is currently assigned to. Manage assignments in the teacher's profile. | `top` |
| Deactivate option (kebab menu) | Prevents the teacher from logging in. Their records and history are retained. | `top` |

---

### 13. Teacher Profile (`/users/teachers/[id]`)

| Element | Tooltip text | Placement |
|---------|-------------|-----------|
| "Assigned Classes" tab | Classes this teacher teaches or is a form teacher for. | `top` |
| "Deactivate Account" button | Suspends the teacher's access. Can be reactivated at any time. | `top` |
| Highest qualification field | Academic credential. For record-keeping only. | `right` |

---

### 14. Announcements (`/announcements`)

| Element | Tooltip text | Placement |
|---------|-------------|-----------|
| "New Announcement" button | Post a message to all students and staff at your school. | `top` |
| Attachment field | Attach a PDF, image, or document (max 10 MB). Students and teachers will be able to download it. | `right` |
| Audience note (if present) | Announcements are sent to all users at your school — students, teachers, and parents. | `top` |

---

### 15. Leave Requests (`/leave-requests`)

| Element | Tooltip text | Placement |
|---------|-------------|-----------|
| Status filter | Pending: awaiting your decision. Approved/Rejected: already actioned. | `right` |
| "Approve" button | Marks the leave as approved. The parent and class teacher are notified automatically. | `top` |
| "Reject" button | Marks the leave as rejected. The parent and class teacher are notified automatically. | `top` |
| Attachments | Supporting documents submitted by the parent (e.g. medical certificate). | `right` |

---

### 16. Messages (`/messages`)

| Element | Tooltip text | Placement |
|---------|-------------|-----------|
| Group channels | Broadcast conversations with all members. Any member can send a message. | `right` |
| Private chat | One-to-one conversation with a teacher or parent. | `right` |
| Unread count badge | Number of messages you haven't read yet in this conversation. | `top` |

---

### 17. Settings (`/settings`)

| Element | Tooltip text | Placement |
|---------|-------------|-----------|
| "Create Academic Year" button | Define the school year (e.g. 2025/2026) that all terms, assessments, and timetables will sit under. | `top` |
| "Create Term" button | Add a term within an academic year (e.g. First Term). You can have multiple terms per year. | `top` |
| "Set as Current Term" button | Makes this the active term. Assessments and timetable entries will default to this term. | `top` |
| Start/End date fields | The dates during which this term is active. Used for filtering assessments and reports. | `right` |

---

### 18. Profile (`/profile`)

| Element | Tooltip text | Placement |
|---------|-------------|-----------|
| School logo upload | Appears on reports, the student app, and the parent app. Square format recommended. | `top` |
| School prefix field | A short code prepended to student IDs (e.g. "TLM" → student ID "TLM-0042"). | `right` |
| Profile photo upload | Shown alongside your name in messages, announcements, and leave request responses. | `top` |
| "Change Password" section | Passwords must be at least 8 characters. You'll be logged out of all other devices when changed. | `top` |

---

### 19. Sidebar Navigation

These tooltips appear when the sidebar is collapsed (narrow mode) and icons are shown without labels.

| Sidebar item | Tooltip text | Placement |
|-------------|-------------|-----------|
| Dashboard | Dashboard | `right` |
| Classes | Classes | `right` |
| Curriculum | Curriculum (Subjects & Courses) | `right` |
| Assessments | Assessments | `right` |
| Timetable | Timetable | `right` |
| Students (sub-item) | Student Directory | `right` |
| Teachers (sub-item) | Teacher Directory | `right` |
| Announcements | Announcements | `right` |
| Leave Requests | Leave Requests | `right` |
| Messages | Messages | `right` |
| Settings | Academic Year & Term Settings | `right` |

---

## Implementation Checklist

- [ ] Install `@radix-ui/react-tooltip` if not already in `package.json`
- [ ] Create `src/components/ui/Tooltip.tsx` using the template above
- [ ] Add tooltips to the Dashboard metric cards
- [ ] Add tooltips to the Sidebar (collapsed state)
- [ ] Add tooltips to Curriculum (Subject vs Course distinction)
- [ ] Add tooltips to Assessment status badges (Draft / Published / Closed)
- [ ] Add tooltips to Timetable action buttons (Add, Copy, Export)
- [ ] Add tooltips to Settings (Set as Current Term)
- [ ] Add tooltips to Leave Requests (Approve / Reject)
- [ ] Add tooltips to Onboarding Phase 2 (lock icon, field hints)
- [ ] QA: verify no tooltip breaks keyboard navigation (all triggers must be focusable)
- [ ] QA: verify tooltips do not overlap content on small viewports

---

## Out of Scope

The following do not need tooltips and should be left as-is:

- Submit, Save, Cancel, Close buttons — their labels are sufficient
- Toast notifications — these are already contextual feedback
- Modal headings — context is established by the modal title
- The sign-in button
- Pagination prev/next arrows
