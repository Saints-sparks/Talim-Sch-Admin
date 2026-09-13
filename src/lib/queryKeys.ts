/**
 * Query-key factory. Every cached resource is keyed `[resource, schoolId, …params]`
 * so a school switch (or logout) invalidates everything at once via
 * `queryClient.removeQueries({ queryKey: [resource] })`, and a mutation can
 * invalidate exactly the list it changed.
 *
 * Add a resource here when a page moves onto TanStack Query; never build
 * ad-hoc key arrays inside components.
 */
export const queryKeys = {
  school: {
    all: ["school"] as const,
    detail: (schoolId: string) => ["school", schoolId] as const,
    dashboard: (schoolId: string) => ["school", schoolId, "dashboard"] as const,
  },
  academic: {
    all: ["academic"] as const,
    years: (schoolId: string) => ["academic", schoolId, "years"] as const,
    terms: (schoolId: string) => ["academic", schoolId, "terms"] as const,
  },
  classes: {
    all: ["classes"] as const,
    list: (schoolId: string) => ["classes", schoolId, "list"] as const,
    detail: (schoolId: string, classId: string) => ["classes", schoolId, classId] as const,
  },
  subjects: {
    all: ["subjects"] as const,
    list: (schoolId: string) => ["subjects", schoolId, "list"] as const,
  },
  courses: {
    all: ["courses"] as const,
    bySchool: (schoolId: string) => ["courses", schoolId, "school"] as const,
    byClass: (schoolId: string, classId: string) => ["courses", schoolId, "class", classId] as const,
  },
  students: {
    all: ["students"] as const,
    list: (schoolId: string, params?: Record<string, unknown>) => ["students", schoolId, "list", params ?? {}] as const,
    detail: (schoolId: string, studentId: string) => ["students", schoolId, studentId] as const,
  },
  teachers: {
    all: ["teachers"] as const,
    list: (schoolId: string, params?: Record<string, unknown>) => ["teachers", schoolId, "list", params ?? {}] as const,
    detail: (schoolId: string, teacherId: string) => ["teachers", schoolId, teacherId] as const,
  },
  parents: {
    all: ["parents"] as const,
    list: (schoolId: string, params?: Record<string, unknown>) => ["parents", schoolId, "list", params ?? {}] as const,
  },
  subAdmins: {
    all: ["subAdmins"] as const,
    list: (schoolId: string) => ["subAdmins", schoolId, "list"] as const,
  },
  fees: {
    all: ["fees"] as const,
    categories: (schoolId: string) => ["fees", schoolId, "categories"] as const,
    items: (schoolId: string) => ["fees", schoolId, "items"] as const,
    assignments: (schoolId: string, params?: Record<string, unknown>) => ["fees", schoolId, "assignments", params ?? {}] as const,
    summary: (schoolId: string) => ["fees", schoolId, "summary"] as const,
  },
  payments: {
    all: ["payments"] as const,
    transactions: (schoolId: string, params?: Record<string, unknown>) => ["payments", schoolId, "transactions", params ?? {}] as const,
    summary: (schoolId: string) => ["payments", schoolId, "summary"] as const,
    providers: (schoolId: string) => ["payments", schoolId, "providers"] as const,
  },
  finance: {
    all: ["finance"] as const,
    wallet: (schoolId: string) => ["finance", schoolId, "wallet"] as const,
    ledger: (schoolId: string, params?: Record<string, unknown>) => ["finance", schoolId, "ledger", params ?? {}] as const,
    bankAccounts: (schoolId: string) => ["finance", schoolId, "bankAccounts"] as const,
    withdrawals: (schoolId: string, params?: Record<string, unknown>) => ["finance", schoolId, "withdrawals", params ?? {}] as const,
    security: (schoolId: string) => ["finance", schoolId, "security"] as const,
  },
  timetable: {
    all: ["timetable"] as const,
    byClass: (schoolId: string, classId: string) => ["timetable", schoolId, "class", classId] as const,
  },
  announcements: {
    all: ["announcements"] as const,
    list: (schoolId: string, params?: Record<string, unknown>) => ["announcements", schoolId, "list", params ?? {}] as const,
  },
  leaveRequests: {
    all: ["leaveRequests"] as const,
    list: (schoolId: string, params?: Record<string, unknown>) => ["leaveRequests", schoolId, "list", params ?? {}] as const,
    detail: (schoolId: string, id: string) => ["leaveRequests", schoolId, id] as const,
  },
  complaints: {
    all: ["complaints"] as const,
    list: (schoolId: string) => ["complaints", schoolId, "list"] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: (userId: string, params?: Record<string, unknown>) => ["notifications", userId, "list", params ?? {}] as const,
    unreadCount: (userId: string) => ["notifications", userId, "unread"] as const,
  },
  settings: {
    all: ["settings"] as const,
    school: (schoolId: string) => ["settings", schoolId, "school"] as const,
  },
} as const;

/** Stale times (ms) by how often data actually changes. */
export const staleTimes = {
  /** School profile, terms, classes, subjects: minutes between changes. */
  reference: 10 * 60_000,
  /** Lists people edit during the day. */
  list: 30_000,
  /** Money and counters: always refetch on mount. */
  live: 0,
} as const;
