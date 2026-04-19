import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import type { ExceptionAction } from './types';

const PlatformRole = { STUDENT: 'STUDENT', COORDINATOR: 'COORDINATOR', ADMINISTRATOR: 'ADMINISTRATOR' } as const;

const ExceptionRequestState = {
  SUBMITTED: 'SUBMITTED',
  IN_REVIEW: 'IN_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  APPLIED: 'APPLIED',
  CLOSED: 'CLOSED'
} as const;

const DEADLINE_OVERRIDE_EXTENSION_DAYS = 3;

type ExceptionStateValue = (typeof ExceptionRequestState)[keyof typeof ExceptionRequestState];

function assert(condition: boolean, message: string, statusCode = 400): asserts condition {
  if (!condition) throw new AppError(message, statusCode);
}

function toAuditAction(action: ExceptionAction): string {
  return {
    start_review: 'EXCEPTION_IN_REVIEW',
    approve: 'EXCEPTION_APPROVED',
    reject: 'EXCEPTION_REJECTED',
    apply: 'EXCEPTION_APPLIED',
    close: 'EXCEPTION_CLOSED'
  }[action];
}

const transitions: Record<ExceptionAction, { from: ExceptionStateValue[]; to: ExceptionStateValue }> = {
  start_review: { from: [ExceptionRequestState.SUBMITTED], to: ExceptionRequestState.IN_REVIEW },
  approve: { from: [ExceptionRequestState.IN_REVIEW], to: ExceptionRequestState.APPROVED },
  reject: { from: [ExceptionRequestState.IN_REVIEW], to: ExceptionRequestState.REJECTED },
  apply: { from: [ExceptionRequestState.APPROVED], to: ExceptionRequestState.APPLIED },
  close: {
    from: [ExceptionRequestState.APPLIED, ExceptionRequestState.REJECTED],
    to: ExceptionRequestState.CLOSED
  }
};

export async function createExceptionRequest(input: {
  userId: string;
  mobilityRecordId: string;
  scopeType: 'DEADLINE' | 'DOCUMENT' | 'PROCEDURE';
  scopeRefId?: string;
  reason: string;
}) {
  const user = await prisma.userAccount.findUnique({ where: { id: input.userId } });
  assert(!!user, 'User not found', 404);
  assert(user.role === PlatformRole.STUDENT, 'Only students can create exception requests', 403);

  const mobilityRecord = await prisma.mobilityRecord.findUnique({ where: { id: input.mobilityRecordId } });
  assert(!!mobilityRecord, 'Mobility record not found', 404);
  assert(mobilityRecord.studentId === input.userId, 'Mobility record does not belong to student', 403);

  if (input.scopeType === 'DEADLINE') {
    assert(!!input.scopeRefId, 'scopeRefId is required for DEADLINE scope exceptions');
    const deadline = await prisma.deadline.findUnique({ where: { id: input.scopeRefId } });
    assert(!!deadline, 'Deadline not found for exception scope', 404);
    assert(deadline.mobilityRecordId === input.mobilityRecordId, 'Deadline does not belong to mobility record', 400);
  }

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const exception = await tx.exceptionRequest.create({
      data: {
        id: crypto.randomUUID(),
        mobilityRecordId: input.mobilityRecordId,
        studentId: input.userId,
        scopeType: input.scopeType,
        scopeRefId: input.scopeRefId ?? null,
        reason: input.reason,
        state: ExceptionRequestState.SUBMITTED
      }
    });

    await tx.exceptionEvent.create({
      data: {
        id: crypto.randomUUID(),
        exceptionId: exception.id,
        actorId: input.userId,
        fromState: null,
        toState: ExceptionRequestState.SUBMITTED,
        rationale: input.reason
      }
    });

    await tx.auditRecord.create({
      data: {
        id: crypto.randomUUID(),
        actorId: input.userId,
        actionType: 'EXCEPTION_SUBMITTED',
        targetType: 'ExceptionRequest',
        targetId: exception.id,
        priorState: null,
        newState: ExceptionRequestState.SUBMITTED,
        outcome: 'SUCCESS',
        metadataJson: JSON.stringify({ scopeType: input.scopeType, scopeRefId: input.scopeRefId ?? null })
      }
    });

    return exception;
  });
}

export async function transitionExceptionRequest(input: {
  exceptionId: string;
  userId: string;
  action: ExceptionAction;
  rationale?: string;
}) {
  const user = await prisma.userAccount.findUnique({ where: { id: input.userId } });
  assert(!!user, 'User not found', 404);
  assert(user.role === PlatformRole.COORDINATOR, 'Only coordinators can decide exception requests', 403);

  const transition = transitions[input.action];
  const trimmedRationale = input.rationale?.trim();

  if (input.action === 'reject') {
    assert(!!trimmedRationale, 'Reject decision requires rationale');
  }

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const exception = await tx.exceptionRequest.findUnique({
      where: { id: input.exceptionId },
      include: { mobilityRecord: true }
    });

    assert(!!exception, 'Exception request not found', 404);
    assert(exception.mobilityRecord.coordinatorId === input.userId, 'Coordinator not assigned to this mobility record', 403);

    assert(
      transition.from.includes(exception.state as ExceptionStateValue),
      `Invalid exception transition from ${exception.state} via ${input.action}`
    );

    const update: Record<string, unknown> = {
      state: transition.to
    };

    if (['approve', 'reject'].includes(input.action)) {
      update.reviewedAt = new Date();
      update.reviewedById = input.userId;
      update.decisionRationale = trimmedRationale ?? null;
    }

    if (input.action === 'apply') {
      assert(
        exception.scopeType === 'DEADLINE' && !!exception.scopeRefId,
        'apply is only supported for DEADLINE-scoped exceptions with a referenced deadline'
      );
      const deadline = await tx.deadline.findUnique({ where: { id: exception.scopeRefId! } });
      assert(!!deadline, 'Referenced deadline not found', 404);

      const baseDate = deadline.overrideDueAt ?? deadline.dueAt;
      const override = new Date(baseDate);
      override.setDate(override.getDate() + DEADLINE_OVERRIDE_EXTENSION_DAYS);

      await tx.deadline.update({
        where: { id: deadline.id },
        data: {
          overrideDueAt: override,
          state: 'OVERRIDDEN'
        }
      });

      await tx.auditRecord.create({
        data: {
          id: crypto.randomUUID(),
          actorId: input.userId,
          actionType: 'DEADLINE_OVERRIDDEN_BY_EXCEPTION',
          targetType: 'Deadline',
          targetId: deadline.id,
          priorState: deadline.state,
          newState: 'OVERRIDDEN',
          outcome: 'SUCCESS',
          metadataJson: JSON.stringify({ exceptionId: exception.id, overrideDueAt: override.toISOString() })
        }
      });
    }

    const updated = await tx.exceptionRequest.updateMany({
      where: { id: input.exceptionId, state: exception.state },
      data: update
    });

    assert(updated.count > 0, 'Exception request state changed concurrently, please retry');

    const result = await tx.exceptionRequest.findUniqueOrThrow({ where: { id: input.exceptionId } });

    await tx.exceptionEvent.create({
      data: {
        id: crypto.randomUUID(),
        exceptionId: input.exceptionId,
        actorId: input.userId,
        fromState: exception.state,
        toState: transition.to,
        rationale: trimmedRationale ?? null
      }
    });

    await tx.auditRecord.create({
      data: {
        id: crypto.randomUUID(),
        actorId: input.userId,
        actionType: toAuditAction(input.action),
        targetType: 'ExceptionRequest',
        targetId: input.exceptionId,
        priorState: exception.state,
        newState: transition.to,
        outcome: 'SUCCESS',
        metadataJson: trimmedRationale ? JSON.stringify({ rationale: trimmedRationale }) : null
      }
    });

    return result;
  });
}

export async function listExceptionsForRole(input: { role: 'student' | 'coordinator'; userId: string }) {
  if (input.role === 'student') {
    return prisma.exceptionRequest.findMany({
      where: { studentId: input.userId },
      include: {
        mobilityRecord: true,
        events: { orderBy: { createdAt: 'desc' }, take: 6 }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  return prisma.exceptionRequest.findMany({
    where: {
      mobilityRecord: { coordinatorId: input.userId },
      state: { in: ['SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'APPLIED'] }
    },
    include: {
      student: true,
      mobilityRecord: true,
      events: { orderBy: { createdAt: 'desc' }, take: 6 }
    },
    orderBy: [{ state: 'asc' }, { updatedAt: 'asc' }]
  });
}
