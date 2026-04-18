import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { TransitionAction } from './types';
import {
  AuditActionType,
  AuditActionTypes,
  DocumentSubmissionState,
  DocumentSubmissionStates,
  PlatformRole,
  PlatformRoles,
  ProcedureDefinitionStates
} from './states';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function isPlatformRole(value: string): value is PlatformRole {
  return Object.values(PlatformRoles).includes(value as PlatformRole);
}

function isDocumentSubmissionState(value: string): value is DocumentSubmissionState {
  return Object.values(DocumentSubmissionStates).includes(value as DocumentSubmissionState);
}

function toAuditAction(action: TransitionAction): AuditActionType {
  const map: Record<TransitionAction, AuditActionType> = {
    submit: AuditActionTypes.SUBMISSION_SUBMITTED,
    start_review: AuditActionTypes.SUBMISSION_IN_REVIEW,
    approve: AuditActionTypes.SUBMISSION_APPROVED,
    reject: AuditActionTypes.SUBMISSION_REJECTED,
    reopen: AuditActionTypes.SUBMISSION_REOPENED,
    resubmit: AuditActionTypes.SUBMISSION_RESUBMITTED
  };
  return map[action];
}

export async function createDraftSubmission(input: {
  userId: string;
  mobilityRecordId: string;
  procedureDefinitionId: string;
}) {
  const user = await prisma.userAccount.findUnique({ where: { id: input.userId } });
  assert(!!user && isPlatformRole(user.role), 'Invalid user role');
  assert(user.role === PlatformRoles.STUDENT, 'Only students can create drafts');

  const mobilityRecord = await prisma.mobilityRecord.findUnique({ where: { id: input.mobilityRecordId } });
  assert(mobilityRecord?.studentId === input.userId, 'Mobility record does not belong to student');

  return prisma.$transaction(async (tx) => {
    const submission = await tx.documentSubmission.create({
      data: {
        id: crypto.randomUUID(),
        mobilityRecordId: input.mobilityRecordId,
        procedureDefinitionId: input.procedureDefinitionId,
        studentId: input.userId,
        state: DocumentSubmissionStates.DRAFT
      }
    });

    await tx.submissionEvent.create({
      data: {
        id: crypto.randomUUID(),
        submissionId: submission.id,
        actorId: input.userId,
        fromState: null,
        toState: DocumentSubmissionStates.DRAFT,
        rationale: 'Draft created'
      }
    });

    await tx.auditRecord.create({
      data: {
        id: crypto.randomUUID(),
        actorId: input.userId,
        actionType: AuditActionTypes.SUBMISSION_DRAFT_CREATED,
        targetType: 'DocumentSubmission',
        targetId: submission.id,
        priorState: null,
        newState: DocumentSubmissionStates.DRAFT,
        outcome: 'SUCCESS'
      }
    });

    return submission;
  });
}

const transitions: Record<TransitionAction, { from: DocumentSubmissionState[]; to: DocumentSubmissionState }> = {
  submit: { from: [DocumentSubmissionStates.DRAFT], to: DocumentSubmissionStates.SUBMITTED },
  start_review: {
    from: [DocumentSubmissionStates.SUBMITTED, DocumentSubmissionStates.RESUBMITTED],
    to: DocumentSubmissionStates.IN_REVIEW
  },
  approve: { from: [DocumentSubmissionStates.IN_REVIEW], to: DocumentSubmissionStates.APPROVED },
  reject: { from: [DocumentSubmissionStates.IN_REVIEW], to: DocumentSubmissionStates.REJECTED },
  reopen: {
    from: [DocumentSubmissionStates.APPROVED, DocumentSubmissionStates.REJECTED],
    to: DocumentSubmissionStates.REOPENED
  },
  resubmit: {
    from: [DocumentSubmissionStates.REJECTED, DocumentSubmissionStates.REOPENED],
    to: DocumentSubmissionStates.RESUBMITTED
  }
};

function assertRoleForAction(role: PlatformRole, action: TransitionAction) {
  if (['submit', 'resubmit'].includes(action)) {
    assert(role === PlatformRoles.STUDENT, 'Only students can submit/resubmit');
  }

  if (['start_review', 'approve', 'reject', 'reopen'].includes(action)) {
    assert(role === PlatformRoles.COORDINATOR, 'Only coordinators can review actions');
  }
}

export async function transitionSubmission(input: {
  submissionId: string;
  userId: string;
  action: TransitionAction;
  rationale?: string;
}) {
  const user = await prisma.userAccount.findUnique({ where: { id: input.userId } });
  assert(!!user && isPlatformRole(user.role), 'Invalid user role');
  assertRoleForAction(user.role, input.action);

  const submission = await prisma.documentSubmission.findUnique({
    where: { id: input.submissionId },
    include: { mobilityRecord: true }
  });

  assert(!!submission, 'Submission not found');
  assert(isDocumentSubmissionState(submission.state), 'Invalid submission state');

  if (user.role === PlatformRoles.STUDENT) {
    assert(submission.studentId === user.id, 'Student can only transition own submissions');
  }

  if (user.role === PlatformRoles.COORDINATOR) {
    assert(submission.mobilityRecord.coordinatorId === user.id, 'Coordinator not assigned to this mobility record');
  }

  const transition = transitions[input.action];
  assert(transition.from.includes(submission.state), `Invalid transition from ${submission.state} via ${input.action}`);

  const update: Prisma.DocumentSubmissionUpdateInput = {
    state: transition.to
  };

  if (input.action === 'submit' || input.action === 'resubmit') {
    update.submittedAt = new Date();
  }

  if (input.action === 'approve' || input.action === 'reject') {
    update.reviewedAt = new Date();
  }

  if (input.action === 'reject') {
    assert(!!input.rationale?.trim(), 'Rejection requires rationale');
    update.rejectionRationale = input.rationale?.trim();
  }

  if (input.action === 'reopen') {
    assert(!!input.rationale?.trim(), 'Reopening requires rationale');
    update.reopeningRationale = input.rationale?.trim();
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.documentSubmission.update({
      where: { id: submission.id },
      data: update
    });

    await tx.submissionEvent.create({
      data: {
        id: crypto.randomUUID(),
        submissionId: submission.id,
        actorId: user.id,
        fromState: submission.state,
        toState: transition.to,
        rationale: input.rationale?.trim() || null
      }
    });

    await tx.auditRecord.create({
      data: {
        id: crypto.randomUUID(),
        actorId: user.id,
        actionType: toAuditAction(input.action),
        targetType: 'DocumentSubmission',
        targetId: submission.id,
        priorState: submission.state,
        newState: transition.to,
        outcome: 'SUCCESS',
        metadataJson: input.rationale ? JSON.stringify({ rationale: input.rationale }) : null
      }
    });

    return updated;
  });
}

export async function listSubmissionsForStudent(studentId: string) {
  return prisma.documentSubmission.findMany({
    where: { studentId },
    include: {
      procedureDefinition: true,
      events: { orderBy: { createdAt: 'desc' }, take: 5 }
    },
    orderBy: { updatedAt: 'desc' }
  });
}

export async function listReviewQueueForCoordinator(coordinatorId: string) {
  return prisma.documentSubmission.findMany({
    where: {
      mobilityRecord: { coordinatorId },
      state: {
        in: [DocumentSubmissionStates.SUBMITTED, DocumentSubmissionStates.RESUBMITTED, DocumentSubmissionStates.IN_REVIEW]
      }
    },
    include: {
      student: true,
      procedureDefinition: true,
      mobilityRecord: true,
      events: { orderBy: { createdAt: 'desc' }, take: 5 }
    },
    orderBy: { updatedAt: 'asc' }
  });
}

export async function listProceduresForMobilityRecord(mobilityRecordId: string) {
  const mobilityRecord = await prisma.mobilityRecord.findUnique({ where: { id: mobilityRecordId } });
  if (!mobilityRecord) return [];

  return prisma.procedureDefinition.findMany({
    where: {
      institutionId: mobilityRecord.institutionId,
      state: ProcedureDefinitionStates.PUBLISHED
    },
    orderBy: { title: 'asc' }
  });
}

export async function listAuditRecordsForSubmission(submissionId: string) {
  return prisma.auditRecord.findMany({
    where: {
      targetType: 'DocumentSubmission',
      targetId: submissionId
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
}
