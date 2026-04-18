export const DEMO_USERS = {
  student: 'student-1',
  coordinator: 'coordinator-1',
  administrator: 'admin-1'
} as const;

export type DemoRole = keyof typeof DEMO_USERS;

export function getDefaultDemoUserId(role: DemoRole): string {
  return DEMO_USERS[role];
}

export function bootstrapDemoUserId(role: DemoRole, fromQuery: string | null): string {
  if (fromQuery && fromQuery.trim().length > 0) {
    return fromQuery;
  }

  return getDefaultDemoUserId(role);
}
