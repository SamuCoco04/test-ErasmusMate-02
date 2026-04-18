import {
  AuditActionType,
  DocumentSubmission,
  DocumentSubmissionState,
  PlatformRole,
  Prisma
} from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { TransitionAction } from './types';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function toAuditAction(action: TransitionAction): AuditActionType {
  const map: Record<TransitionAction, AuditActionType> = {
    submit: 'SUBMISSION_SUBMITTED',
    start_review: 'SUBMISSION_IN_REVIEW',
    approve: 'SUBMISSION_APPROVED',
    reject: 'SUBMISSION_REJECTED',
    reopen: 'SUBMISSION_REOPENED',
    resubmit: 'SUBMISSION_RESUBMITTED'
  };
  return map[action];
}

export async function createDraftSubmission(input: {
  userId: string;
  mobilityRecordId: string;
  procedureDefinitionId: string;
}) {
  const user = await prisma.userAccount.findUnique({ where: { id: input.userId } });
  assert(user?.role === PlatformRole.STUDENT, 'Only students can create drafts');

  const mobilityRecord = await prisma.mobilityRecord.findUnique({ where: { id: input.mobilityRecordId } });
  assert(mobilityRecord?.studentId === input.userId, 'Mobility record does not belong to student');

  return prisma.$transaction(async (tx) => {
    const submission = await tx.documentSubmission.create({
      data: {
        id: crypto.randomUUID(),
        mobilityRecordId: input.mobilityRecordId,
        procedureDefinitionId: input.procedureDefinitionId,
        studentId: input.userId,
        state: DocumentSubmissionState.DRAFT
      }
    });

    await tx.submissionEvent.create({
      data: {
        id: crypto.randomUUID(),
        submissionId: submission.id,
        actorId: input.userId,
        fromState: null,
        toState: DocumentSubmissionState.DRAFT,
        rationale: 'Draft created'
      }
    });

    await tx.auditRecord.create({
      data: {
        id: crypto.randomUUID(),
        actorId: input.userId,
        actionType: 'SUBMISSION_DRAFT_CREATED',
        targetType: 'DocumentSubmission',
        targetId: submission.id,
        priorState: null,
        newState: DocumentSubmissionState.DRAFT,
        outcome: 'SUCCESS'
      }
    });

    return submission;
  });
}

const transitions: Record<TransitionAction, { from: DocumentSubmissionState[]; to: DocumentSubmissionState }> = {
  submit: { from: [DocumentSubmissionState.DRAFT], to: DocumentSubmissionState.SUBMITTED },
  start_review: {
    from: [DocumentSubmissionState.SUBMITTED, DocumentSubmissionState.RESUBMITTED],
    to: DocumentSubmissionState.IN_REVIEW
  },
  approve: { from: [DocumentSubmissionState.IN_REVIEW], to: DocumentSubmissionState.APPROVED },
  reject: { from: [DocumentSubmissionState.IN_REVIEW], to: DocumentSubmissionState.REJECTED },
  reopen: {
    from: [DocumentSubmissionState.APPROVED, DocumentSubmissionState.REJECTED],
    to: DocumentSubmissionState.REOPENED
  },
  resubmit: {
    from: [DocumentSubmissionState.REJECTED, DocumentSubmissionState.REOPENED],
    to: DocumentSubmissionState.RESUBMITTED
  }
};

function assertRoleForAction(role: PlatformRole, action: TransitionAction) {
  if (['submit', 'resubmit'].includes(action)) {
    assert(role === PlatformRole.STUDENT, 'Only students can submit/resubmit');
  }

  if (['start_review', 'approve', 'reject', 'reopen'].includes(action)) {
    assert(role === PlatformRole.COORDINATOR, 'Only coordinators can review actions');
  }
}

export async function transitionSubmission(input: {
  submissionId: string;
  userId: string;
  action: TransitionAction;
  rationale?: string;
}) {
  const user = await prisma.userAccount.findUnique({ where: { id: input.userId } });
  assert(user, 'User not found');
  assertRoleForAction(user.role, input.action);

  const submission = await prisma.documentSubmission.findUnique({
    where: { id: input.submissionId },
    include: { mobilityRecord: true }
  });

  assert(submission, 'Submission not found');

  if (user.role === PlatformRole.STUDENT) {
    assert(submission.studentId === user.id, 'Student can only transition own submissions');
  }

  if (user.role === PlatformRole.COORDINATOR) {
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
      state: { in: [DocumentSubmissionState.SUBMITTED, DocumentSubmissionState.RESUBMITTED, DocumentSubmissionState.IN_REVIEW] }
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
      state: 'PUBLISHED'
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
