/**
 * Frontend Permission constants — values MUST match the backend Permission enum
 * in talimBE-V2/src/modules/auth/enums/permission.enum.ts exactly.
 *
 * Convention: action:resource (lowercase, colon-separated)
 */
export const Permission = {
  // Academics
  MANAGE_CLASSES:       'manage:classes',
  MANAGE_CURRICULUM:    'manage:curriculum',
  MANAGE_ASSESSMENTS:   'manage:assessments',
  MANAGE_TIMETABLE:     'manage:timetable',

  // Finance
  MANAGE_FEES:          'manage:fees',
  MANAGE_PAYMENTS:      'manage:payments',
  MANAGE_FINANCE:       'manage:finance',

  // People
  MANAGE_STUDENTS:      'manage:students',
  MANAGE_TEACHERS:      'manage:teachers',
  MANAGE_PARENTS:       'manage:parents',

  // Administration
  MANAGE_ANNOUNCEMENTS: 'manage:announcements',
  MANAGE_LEAVE_REQUESTS:'manage:leave_requests',
  MANAGE_TRANSIT:       'manage:transit',
  MANAGE_MESSAGES:      'manage:messages',
  MANAGE_SETTINGS:      'manage:settings',

  // Sub-admin management (primary school_admin only)
  MANAGE_SUB_ADMINS:    'manage:sub_admins',
} as const;

export type PermissionValue = typeof Permission[keyof typeof Permission];
