export const exceptionActions = ['start_review', 'approve', 'reject', 'apply', 'close'] as const;

export type ExceptionAction = (typeof exceptionActions)[number];
