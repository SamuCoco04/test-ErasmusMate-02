export const PlatformRoles = {
  STUDENT: 'STUDENT',
  COORDINATOR: 'COORDINATOR',
  ADMINISTRATOR: 'ADMINISTRATOR'
} as const;

export type PlatformRole = (typeof PlatformRoles)[keyof typeof PlatformRoles];

export const DocumentSubmissionStates = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  IN_REVIEW: 'IN_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REOPENED: 'REOPENED',
  RESUBMITTED: 'RESUBMITTED',
  ARCHIVED: 'ARCHIVED'
} as const;

export type DocumentSubmissionState = (typeof DocumentSubmissionStates)[keyof typeof DocumentSubmissionStates];

export const ProcedureDefinitionStates = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  LOCKED: 'LOCKED',
  SUPERSEDED: 'SUPERSEDED'
} as const;

export const AuditActionTypes = {
  SUBMISSION_DRAFT_CREATED: 'SUBMISSION_DRAFT_CREATED',
  SUBMISSION_SUBMITTED: 'SUBMISSION_SUBMITTED',
  SUBMISSION_IN_REVIEW: 'SUBMISSION_IN_REVIEW',
  SUBMISSION_APPROVED: 'SUBMISSION_APPROVED',
  SUBMISSION_REJECTED: 'SUBMISSION_REJECTED',
  SUBMISSION_REOPENED: 'SUBMISSION_REOPENED',
  SUBMISSION_RESUBMITTED: 'SUBMISSION_RESUBMITTED'
} as const;

export type AuditActionType = (typeof AuditActionTypes)[keyof typeof AuditActionTypes];
