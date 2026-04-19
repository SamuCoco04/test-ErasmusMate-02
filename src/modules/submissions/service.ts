import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import { TransitionAction } from './types';

const PlatformRole = { STUDENT: 'STUDENT', COORDINATOR: 'COORDINATOR', ADMINISTRATOR: 'ADMINISTRATOR' } as const;
type PlatformRoleValue = typeof PlatformRole[keyof typeof PlatformRole];

const DocumentSubmissionState = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  IN_REVIEW: 'IN_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REOPENED: 'REOPENED',
  RESUBMITTED: 'RESUBMITTED',
  ARCHIVED: 'ARCHIVED'
} as const;
type DocumentSubmissionStateValue = typeof DocumentSubmissionState[keyof typeof DocumentSubmissionState];

function assert(condition: boolean, message: string, statusCode = 400): asserts condition {
  if (!condition) throw new AppError(message, statusCode);
}

function toAuditAction(action: TransitionAction): string {
  const map: Record<TransitionAction, string> = {
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
  assert(!!user, 'User not found', 404);
  assert(user.role === PlatformRole.STUDENT, 'Only students can create drafts', 403);

  const mobilityRecord = await prisma.mobilityRecord.findUnique({ where: { id: input.mobilityRecordId } });
  assert(!!mobilityRecord, 'Mobility record not found', 404);
  assert(mobilityRecord.studentId === input.userId, 'Mobility record does not belong to student', 403);

  const procedure = await prisma.procedureDefinition.findUnique({
    where: { id: input.procedureDefinitionId },
    include: { applicabilityRules: true }
  });
  assert(!!procedure, 'Procedure definition not found', 404);
  assert(procedure.state === 'PUBLISHED', 'Procedure definition is not published', 400);
  assert(
    procedure.institutionId === mobilityRecord.institutionId,
    'Procedure definition does not belong to the same institution as the mobility record',
    403
  );

  const isApplicable = procedure.applicabilityRules.some(
    (rule) =>
      rule.isActive &&
      (!rule.destinationCity || rule.destinationCity === mobilityRecord.destinationCity) &&
      (!rule.mobilityType || rule.mobilityType === mobilityRecord.mobilityType) &&
      (!rule.lifecyclePhase || rule.lifecyclePhase === mobilityRecord.mobilityPhase)
  );
  assert(isApplicable, 'Procedure is not applicable for this mobility record', 400);

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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

const transitions: Record<TransitionAction, { from: DocumentSubmissionStateValue[]; to: DocumentSubmissionStateValue }> = {
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

function assertRoleForAction(role: PlatformRoleValue, action: TransitionAction) {
  if (['submit', 'resubmit'].includes(action)) {
    assert(role === PlatformRole.STUDENT, 'Only students can submit/resubmit', 403);
  }

  if (['start_review', 'approve', 'reject', 'reopen'].includes(action)) {
    assert(role === PlatformRole.COORDINATOR, 'Only coordinators can review actions', 403);
  }
}

function isDeadlineBlocked(deadline: { dueAt: Date; overrideDueAt: Date | null; state: string }) {
  if (deadline.state === 'FULFILLED') {
    return false;
  }

  const effectiveDueAt = deadline.overrideDueAt ?? deadline.dueAt;
  return new Date() > effectiveDueAt;
}

export async function transitionSubmission(input: {
  submissionId: string;
  userId: string;
  action: TransitionAction;
  rationale?: string;
}) {
  const user = await prisma.userAccount.findUnique({ where: { id: input.userId } });
  assert(!!user, 'User not found', 404);
  assertRoleForAction(user.role as PlatformRoleValue, input.action);

  const transition = transitions[input.action];
  const trimmedRationale = input.rationale?.trim();

  const update: Record<string, unknown> = {
    state: transition.to
  };

  if (input.action === 'submit' || input.action === 'resubmit') {
    update.submittedAt = new Date();
  }

  if (input.action === 'approve' || input.action === 'reject') {
    update.reviewedAt = new Date();
  }

  if (input.action === 'reject') {
    assert(!!trimmedRationale, 'Rejection requires rationale');
    update.rejectionRationale = trimmedRationale;
  }

  if (input.action === 'reopen') {
    assert(!!trimmedRationale, 'Reopening requires rationale');
    update.reopeningRationale = trimmedRationale;
  }

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const submission = await tx.documentSubmission.findUnique({
      where: { id: input.submissionId },
      include: { mobilityRecord: true }
    });

    assert(!!submission, 'Submission not found', 404);

    if (user.role === PlatformRole.STUDENT) {
      assert(submission.studentId === user.id, 'Student can only transition own submissions', 403);
    }

    if (user.role === PlatformRole.COORDINATOR) {
      assert(submission.mobilityRecord.coordinatorId === user.id, 'Coordinator not assigned to this mobility record', 403);
    }

    if (input.action === 'submit' || input.action === 'resubmit') {
      const deadline = await tx.deadline.findFirst({
        where: {
          mobilityRecordId: submission.mobilityRecordId,
          procedureDefinitionId: submission.procedureDefinitionId,
          obligationType: { in: ['SUBMISSION', 'RESUBMISSION'] }
        },
        orderBy: { dueAt: 'asc' }
      });

      if (deadline) {
        assert(!isDeadlineBlocked(deadline), 'Submission deadline has passed without an approved override', 400);
      }
    }

    assert(
      transition.from.includes(submission.state as DocumentSubmissionStateValue),
      `Invalid transition from ${submission.state} via ${input.action}`
    );

    const updated = await tx.documentSubmission.updateMany({
      where: { id: input.submissionId, state: submission.state },
      data: update
    });

    assert(updated.count > 0, 'Submission state changed concurrently, please retry');

    const result = await tx.documentSubmission.findUniqueOrThrow({ where: { id: input.submissionId } });

    if (input.action === 'approve') {
      await tx.deadline.updateMany({
        where: {
          mobilityRecordId: submission.mobilityRecordId,
          procedureDefinitionId: submission.procedureDefinitionId,
          obligationType: { in: ['SUBMISSION', 'RESUBMISSION'] }
        },
        data: { state: 'FULFILLED' }
      });
    }

    await tx.submissionEvent.create({
      data: {
        id: crypto.randomUUID(),
        submissionId: input.submissionId,
        actorId: user.id,
        fromState: submission.state,
        toState: transition.to,
        rationale: trimmedRationale || null
      }
    });

    await tx.auditRecord.create({
      data: {
        id: crypto.randomUUID(),
        actorId: user.id,
        actionType: toAuditAction(input.action),
        targetType: 'DocumentSubmission',
        targetId: input.submissionId,
        priorState: submission.state,
        newState: transition.to,
        outcome: 'SUCCESS',
        metadataJson: trimmedRationale ? JSON.stringify({ rationale: trimmedRationale }) : null
      }
    });

    return result;
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
        in: [DocumentSubmissionState.SUBMITTED, DocumentSubmissionState.RESUBMITTED, DocumentSubmissionState.IN_REVIEW]
      }
    },
    include: {
      student: true,
      procedureDefinition: true,
      mobilityRecord: true,
      events: { orderBy: { createdAt: 'desc' }, take: 5 }
    },
    orderBy: [{ updatedAt: 'asc' }]
  });
}

export async function listProceduresForMobilityRecord(mobilityRecordId: string) {
  const mobilityRecord = await prisma.mobilityRecord.findUnique({ where: { id: mobilityRecordId } });
  if (!mobilityRecord) return [];

  return prisma.procedureDefinition.findMany({
    where: {
      institutionId: mobilityRecord.institutionId,
      state: 'PUBLISHED',
      applicabilityRules: {
        some: {
          isActive: true,
          OR: [{ destinationCity: null }, { destinationCity: mobilityRecord.destinationCity }],
          AND: [
            { OR: [{ mobilityType: null }, { mobilityType: mobilityRecord.mobilityType }] },
            { OR: [{ lifecyclePhase: null }, { lifecyclePhase: mobilityRecord.mobilityPhase }] }
          ]
        }
      }
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
    include: { actor: true },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
}
