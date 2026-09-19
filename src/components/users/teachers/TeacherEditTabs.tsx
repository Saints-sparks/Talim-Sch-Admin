/**
 * The tabs of the teacher editor. Each tab lives in `./edit`; this barrel keeps
 * the original import path working.
 */
export { TeacherEditPersonalTab } from "./edit/PersonalTab";
export { TeacherEditQualificationsTab } from "./edit/QualificationsTab";
export { TeacherEditEmploymentTab } from "./edit/EmploymentTab";
export { TeacherEditAssignmentsTab } from "./edit/AssignmentsTab";
export { TeacherEditAvailabilityTab } from "./edit/AvailabilityTab";
export type { AssignableCourse } from "./edit/assignmentItems";
