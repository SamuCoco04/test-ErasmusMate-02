import { Prisma, type LearningAgreementRow } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';

const Role = {
  STUDENT: 'STUDENT',
  COORDINATOR: 'COORDINATOR',
  ADMINISTRATOR: 'ADMINISTRATOR'
} as const;

const AgreementState = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  IN_REVIEW: 'IN_REVIEW',
  PARTIALLY_APPROVED: 'PARTIALLY_APPROVED',
  CHANGES_REQUESTED: 'CHANGES_REQUESTED',
  ACCEPTED: 'ACCEPTED'
} as const;

const RowState = {
  IN_REVIEW: 'IN_REVIEW',
  APPROVED: 'APPROVED',
  DENIED: 'DENIED'
} as const;

function assert(condition: boolean, message: string, statusCode = 400): asserts condition {
  if (!condition) throw new AppError(message, statusCode);
}

function inStates(states: string[], value: string) {
  return states.includes(value);
}

function normalizeGrade(grade?: string | null) {
  return grade?.trim() || null;
}

function hasRowChange(source: LearningAgreementRow, next: {
  homeCourseCode: string;
  homeCourseName: string;
  destinationCourseCode: string;
  destinationCourseName: string;
  ects: number;
  semester: string;
  grade?: string | null;
}) {
  return (
    source.homeCourseCode !== next.homeCourseCode ||
    source.homeCourseName !== next.homeCourseName ||
    source.destinationCourseCode !== next.destinationCourseCode ||
    source.destinationCourseName !== next.destinationCourseName ||
    source.ects !== next.ects ||
    source.semester !== next.semester ||
    (source.grade ?? null) !== normalizeGrade(next.grade)
  );
}

function deriveAgreementState(rows: Array<{ status: string; isLatest: boolean }>): string {
  const latest = rows.filter((row) => row.isLatest);
  if (!latest.length) return AgreementState.DRAFT;

  const hasInReview = latest.some((row) => row.status === RowState.IN_REVIEW);
  if (hasInReview) return AgreementState.IN_REVIEW;

  const approved = latest.filter((row) => row.status === RowState.APPROVED).length;
  const denied = latest.filter((row) => row.status === RowState.DENIED).length;

  if (approved === latest.length) return AgreementState.ACCEPTED;
  if (approved > 0 && denied > 0) return AgreementState.PARTIALLY_APPROVED;
  return AgreementState.CHANGES_REQUESTED;
}

async function getAgreementForActor(tx: Prisma.TransactionClient, agreementId: string, userId: string) {
  const [user, agreement] = await Promise.all([
    tx.userAccount.findUnique({ where: { id: userId } }),
    tx.learningAgreement.findUnique({
      where: { id: agreementId },
      include: {
        rows: { where: { isLatest: true }, orderBy: [{ createdAt: 'asc' }] },
        mobilityRecord: true
      }
    })
  ]);

  assert(!!user, 'User not found', 404);
  assert(!!agreement, 'Learning agreement not found', 404);

  if (user.role === Role.STUDENT) {
    assert(agreement.studentId === user.id, 'Unauthorized agreement access', 403);
  }
  if (user.role === Role.COORDINATOR) {
    assert(agreement.coordinatorId === user.id, 'Coordinator not assigned to this agreement', 403);
  }

  return { user, agreement };
}

export async function createOrGetDraftAgreement(input: { userId: string; mobilityRecordId: string }) {
  const user = await prisma.userAccount.findUnique({ where: { id: input.userId } });
  assert(!!user, 'User not found', 404);
  assert(user.role === Role.STUDENT, 'Only students can create learning agreements', 403);

  const mobilityRecord = await prisma.mobilityRecord.findUnique({ where: { id: input.mobilityRecordId } });
  assert(!!mobilityRecord, 'Mobility record not found', 404);
  assert(mobilityRecord.studentId === input.userId, 'Unauthorized mobility record access', 403);

  try {
    return await prisma.$transaction(async (tx) => {
      const agreement = await tx.learningAgreement.create({
        data: {
          id: crypto.randomUUID(),
          mobilityRecordId: mobilityRecord.id,
          studentId: input.userId,
          coordinatorId: mobilityRecord.coordinatorId,
          state: AgreementState.DRAFT
        }
      });

      await tx.learningAgreementEvent.create({
        data: {
          id: crypto.randomUUID(),
          agreementId: agreement.id,
          actorId: input.userId,
          actionType: 'AGREEMENT_CREATED',
          toState: AgreementState.DRAFT,
          noteOrRationale: 'Learning Agreement draft created.'
        }
      });

      await tx.auditRecord.create({
        data: {
          id: crypto.randomUUID(),
          actorId: input.userId,
          actionType: 'LEARNING_AGREEMENT_CREATED',
          targetType: 'LearningAgreement',
          targetId: agreement.id,
          newState: AgreementState.DRAFT,
          outcome: 'SUCCESS'
        }
      });

      return agreement;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const existing = await prisma.learningAgreement.findUnique({
        where: { mobilityRecordId: mobilityRecord.id }
      });
      if (existing) return existing;
    }

    throw error;
  }
}

export async function getAgreementDetail(input: { agreementId: string; userId: string }) {
  const agreement = await prisma.learningAgreement.findUnique({
    where: { id: input.agreementId },
    include: {
      rows: {
        where: { isLatest: true },
        orderBy: [{ createdAt: 'asc' }]
      },
      events: {
        include: { actor: true },
        orderBy: { createdAt: 'desc' },
        take: 60
      },
      mobilityRecord: true
    }
  });
  assert(!!agreement, 'Learning agreement not found', 404);

  const user = await prisma.userAccount.findUnique({ where: { id: input.userId } });
  assert(!!user, 'User not found', 404);

  if (user.role === Role.STUDENT) {
    assert(agreement.studentId === user.id, 'Unauthorized agreement access', 403);
  }
  if (user.role === Role.COORDINATOR) {
    assert(agreement.coordinatorId === user.id, 'Coordinator not assigned to this agreement', 403);
  }

  return {
    ...agreement,
    permissions: {
      canEdit: user.role === Role.STUDENT && inStates([AgreementState.DRAFT, AgreementState.CHANGES_REQUESTED, AgreementState.PARTIALLY_APPROVED], agreement.state),
      canSubmit: user.role === Role.STUDENT && agreement.state === AgreementState.DRAFT,
      canResubmit: user.role === Role.STUDENT && inStates([AgreementState.CHANGES_REQUESTED, AgreementState.PARTIALLY_APPROVED], agreement.state),
      canReview: user.role === Role.COORDINATOR && inStates([AgreementState.SUBMITTED, AgreementState.IN_REVIEW], agreement.state)
    }
  };
}

export async function addAgreementRow(input: {
  agreementId: string;
  userId: string;
  row: {
    homeCourseCode: string;
    homeCourseName: string;
    destinationCourseCode: string;
    destinationCourseName: string;
    ects: number;
    semester: string;
    grade?: string | null;
  };
}) {
  return prisma.$transaction(async (tx) => {
    const { user, agreement } = await getAgreementForActor(tx, input.agreementId, input.userId);
    assert(user.role === Role.STUDENT, 'Only students can edit rows', 403);
    assert(inStates([AgreementState.DRAFT, AgreementState.CHANGES_REQUESTED, AgreementState.PARTIALLY_APPROVED], agreement.state), 'Agreement is not editable in current state', 400);

    const row = await tx.learningAgreementRow.create({
      data: {
        id: crypto.randomUUID(),
        agreementId: input.agreementId,
        rowKey: crypto.randomUUID(),
        revision: 1,
        homeCourseCode: input.row.homeCourseCode,
        homeCourseName: input.row.homeCourseName,
        destinationCourseCode: input.row.destinationCourseCode,
        destinationCourseName: input.row.destinationCourseName,
        ects: input.row.ects,
        semester: input.row.semester,
        grade: normalizeGrade(input.row.grade),
        status: RowState.IN_REVIEW
      }
    });

    await tx.learningAgreementEvent.create({
      data: {
        id: crypto.randomUUID(),
        agreementId: input.agreementId,
        rowId: row.id,
        actorId: user.id,
        actionType: 'ROW_ADDED',
        toState: RowState.IN_REVIEW
      }
    });

    return row;
  });
}

export async function updateAgreementRow(input: {
  agreementId: string;
  rowId: string;
  userId: string;
  row: {
    homeCourseCode: string;
    homeCourseName: string;
    destinationCourseCode: string;
    destinationCourseName: string;
    ects: number;
    semester: string;
    grade?: string | null;
  };
}) {
  return prisma.$transaction(async (tx) => {
    const { user, agreement } = await getAgreementForActor(tx, input.agreementId, input.userId);
    assert(user.role === Role.STUDENT, 'Only students can edit rows', 403);
    assert(inStates([AgreementState.DRAFT, AgreementState.CHANGES_REQUESTED, AgreementState.PARTIALLY_APPROVED], agreement.state), 'Agreement is not editable in current state', 400);

    const source = await tx.learningAgreementRow.findUnique({ where: { id: input.rowId } });
    assert(!!source, 'Row not found', 404);
    assert(source.agreementId === input.agreementId, 'Row does not belong to agreement', 400);
    assert(source.isLatest, 'Only latest row revisions are editable', 400);

    const changed = hasRowChange(source, input.row);
    assert(changed, 'Row revision requires an actual change', 400);

    if (source.status === RowState.IN_REVIEW && agreement.state === AgreementState.DRAFT) {
      const updated = await tx.learningAgreementRow.update({
        where: { id: source.id },
        data: {
          homeCourseCode: input.row.homeCourseCode,
          homeCourseName: input.row.homeCourseName,
          destinationCourseCode: input.row.destinationCourseCode,
          destinationCourseName: input.row.destinationCourseName,
          ects: input.row.ects,
          semester: input.row.semester,
          grade: normalizeGrade(input.row.grade)
        }
      });

      await tx.learningAgreementEvent.create({
        data: {
          id: crypto.randomUUID(),
          agreementId: input.agreementId,
          rowId: updated.id,
          actorId: user.id,
          actionType: 'ROW_UPDATED',
          fromState: source.status,
          toState: updated.status
        }
      });
      return updated;
    }

    await tx.learningAgreementRow.update({ where: { id: source.id }, data: { isLatest: false } });

    const revision = await tx.learningAgreementRow.create({
      data: {
        id: crypto.randomUUID(),
        agreementId: input.agreementId,
        rowKey: source.rowKey,
        revision: source.revision + 1,
        supersedesRowId: source.id,
        homeCourseCode: input.row.homeCourseCode,
        homeCourseName: input.row.homeCourseName,
        destinationCourseCode: input.row.destinationCourseCode,
        destinationCourseName: input.row.destinationCourseName,
        ects: input.row.ects,
        semester: input.row.semester,
        grade: normalizeGrade(input.row.grade),
        status: RowState.IN_REVIEW,
        decisionRationale: null,
        reviewedById: null,
        reviewedAt: null
      }
    });

    await tx.learningAgreementEvent.create({
      data: {
        id: crypto.randomUUID(),
        agreementId: input.agreementId,
        rowId: revision.id,
        actorId: user.id,
        actionType: source.status === RowState.APPROVED ? 'ROW_APPROVED_REVISION_CREATED' : 'ROW_REVISED',
        fromState: source.status,
        toState: RowState.IN_REVIEW
      }
    });

    return revision;
  });
}

export async function removeAgreementRow(input: { agreementId: string; rowId: string; userId: string }) {
  return prisma.$transaction(async (tx) => {
    const { user, agreement } = await getAgreementForActor(tx, input.agreementId, input.userId);
    assert(user.role === Role.STUDENT, 'Only students can remove rows', 403);
    assert(agreement.state === AgreementState.DRAFT, 'Rows can only be removed in DRAFT state', 400);

    const row = await tx.learningAgreementRow.findUnique({ where: { id: input.rowId } });
    assert(!!row, 'Row not found', 404);
    assert(row.agreementId === input.agreementId, 'Row does not belong to agreement', 400);
    assert(row.isLatest, 'Only latest rows can be removed', 400);

    await tx.learningAgreementRow.delete({ where: { id: row.id } });

    await tx.learningAgreementEvent.create({
      data: {
        id: crypto.randomUUID(),
        agreementId: input.agreementId,
        actorId: user.id,
        actionType: 'ROW_REMOVED',
        noteOrRationale: `Removed row ${row.rowKey}`
      }
    });
  });
}

async function validateAgreementReadyForSubmit(tx: Prisma.TransactionClient, agreementId: string) {
  const rows = await tx.learningAgreementRow.findMany({ where: { agreementId, isLatest: true } });
  assert(rows.length > 0, 'Cannot submit agreement without rows', 400);
  for (const row of rows) {
    assert(Boolean(row.homeCourseCode && row.homeCourseName && row.destinationCourseCode && row.destinationCourseName && row.semester), 'All required row fields must be complete', 400);
    assert(row.ects > 0, 'ECTS must be greater than 0', 400);
  }
}

export async function submitAgreement(input: { agreementId: string; userId: string }) {
  return prisma.$transaction(async (tx) => {
    const { user, agreement } = await getAgreementForActor(tx, input.agreementId, input.userId);
    assert(user.role === Role.STUDENT, 'Only students can submit agreements', 403);
    assert(agreement.state === AgreementState.DRAFT, 'Only draft agreements can be submitted', 400);

    await validateAgreementReadyForSubmit(tx, agreement.id);

    const submittedAt = new Date();
    const updateResult = await tx.learningAgreement.updateMany({
      where: { id: agreement.id, state: AgreementState.DRAFT },
      data: { state: AgreementState.SUBMITTED, submittedAt, version: { increment: 1 } }
    });
    assert(updateResult.count > 0, 'Only draft agreements can be submitted', 400);

    const updated = await tx.learningAgreement.findUniqueOrThrow({ where: { id: agreement.id } });

    await tx.learningAgreementEvent.create({
      data: {
        id: crypto.randomUUID(),
        agreementId: agreement.id,
        actorId: user.id,
        actionType: 'AGREEMENT_SUBMITTED',
        fromState: AgreementState.DRAFT,
        toState: AgreementState.SUBMITTED
      }
    });

    await tx.auditRecord.create({
      data: {
        id: crypto.randomUUID(),
        actorId: user.id,
        actionType: 'LEARNING_AGREEMENT_SUBMITTED',
        targetType: 'LearningAgreement',
        targetId: agreement.id,
        priorState: AgreementState.DRAFT,
        newState: AgreementState.SUBMITTED,
        outcome: 'SUCCESS'
      }
    });

    return updated;
  });
}

export async function resubmitAgreement(input: { agreementId: string; userId: string }) {
  return prisma.$transaction(async (tx) => {
    const { user, agreement } = await getAgreementForActor(tx, input.agreementId, input.userId);
    assert(user.role === Role.STUDENT, 'Only students can resubmit agreements', 403);
    assert(inStates([AgreementState.CHANGES_REQUESTED, AgreementState.PARTIALLY_APPROVED], agreement.state), 'Agreement is not in a resubmittable state', 400);

    await validateAgreementReadyForSubmit(tx, agreement.id);

    const deniedLatestRows = agreement.rows.filter((row) => row.isLatest && row.status === RowState.DENIED);
    assert(deniedLatestRows.length === 0, 'Denied rows must be revised before resubmission', 400);

    const submittedAt = new Date();
    const previousState = agreement.state;
    const updateResult = await tx.learningAgreement.updateMany({
      where: {
        id: agreement.id,
        state: { in: [AgreementState.CHANGES_REQUESTED, AgreementState.PARTIALLY_APPROVED] }
      },
      data: { state: AgreementState.SUBMITTED, submittedAt, version: { increment: 1 } }
    });
    assert(updateResult.count > 0, 'Agreement state changed during resubmission; please retry', 409);

    const updated = await tx.learningAgreement.findUniqueOrThrow({
      where: { id: agreement.id }
    });

    await tx.learningAgreementEvent.create({
      data: {
        id: crypto.randomUUID(),
        agreementId: agreement.id,
        actorId: user.id,
        actionType: 'AGREEMENT_RESUBMITTED',
        fromState: previousState,
        toState: AgreementState.SUBMITTED
      }
    });

    await tx.auditRecord.create({
      data: {
        id: crypto.randomUUID(),
        actorId: user.id,
        actionType: 'LEARNING_AGREEMENT_RESUBMITTED',
        targetType: 'LearningAgreement',
        targetId: agreement.id,
        priorState: previousState,
        newState: AgreementState.SUBMITTED,
        outcome: 'SUCCESS'
      }
    });

    return updated;
  });
}

export async function decideAgreementRow(input: {
  agreementId: string;
  rowId: string;
  userId: string;
  decision: 'APPROVED' | 'DENIED';
  rationale?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const { user, agreement } = await getAgreementForActor(tx, input.agreementId, input.userId);
    assert(user.role === Role.COORDINATOR, 'Only coordinators can decide rows', 403);
    assert(inStates([AgreementState.SUBMITTED, AgreementState.IN_REVIEW], agreement.state), 'Agreement is not in coordinator review state', 400);

    const row = await tx.learningAgreementRow.findUnique({ where: { id: input.rowId } });
    assert(!!row, 'Row not found', 404);
    assert(row.agreementId === input.agreementId, 'Row does not belong to agreement', 400);
    assert(row.isLatest, 'Only latest row revisions can be decided', 400);
    assert(row.status === RowState.IN_REVIEW, 'Only in-review rows can be decided', 400);

    const trimmedRationale = input.rationale?.trim();
    if (input.decision === RowState.DENIED) {
      assert(!!trimmedRationale, 'Deny decision requires rationale', 400);
    }

    const reviewedAt = new Date();
    const decisionUpdate = await tx.learningAgreementRow.updateMany({
      where: {
        id: row.id,
        agreementId: input.agreementId,
        isLatest: true,
        status: RowState.IN_REVIEW,
        reviewedAt: null
      },
      data: {
        status: input.decision,
        decisionRationale: input.decision === RowState.DENIED ? trimmedRationale : null,
        reviewedById: user.id,
        reviewedAt
      }
    });
    assert(decisionUpdate.count > 0, 'Row has already been decided', 409);

    const latestRows = await tx.learningAgreementRow.findMany({ where: { agreementId: input.agreementId, isLatest: true } });
    const aggregate = deriveAgreementState(latestRows.map((item) => ({ status: item.status, isLatest: item.isLatest })));

    const nextState = aggregate;
    const fromState = agreement.state;
    await tx.learningAgreement.update({
      where: { id: input.agreementId },
      data: {
        state: nextState,
        lastReviewedAt: new Date(),
        acceptedAt: nextState === AgreementState.ACCEPTED ? new Date() : null
      }
    });

    await tx.learningAgreementEvent.create({
      data: {
        id: crypto.randomUUID(),
        agreementId: input.agreementId,
        rowId: row.id,
        actorId: user.id,
        actionType: input.decision === RowState.APPROVED ? 'ROW_APPROVED' : 'ROW_DENIED',
        fromState: row.status,
        toState: input.decision,
        noteOrRationale: trimmedRationale ?? null
      }
    });

    if (fromState !== nextState) {
      await tx.learningAgreementEvent.create({
        data: {
          id: crypto.randomUUID(),
          agreementId: input.agreementId,
          actorId: user.id,
          actionType: 'AGREEMENT_STATE_RECALCULATED',
          fromState,
          toState: nextState
        }
      });
    }

    await tx.auditRecord.create({
      data: {
        id: crypto.randomUUID(),
        actorId: user.id,
        actionType: input.decision === RowState.APPROVED ? 'LEARNING_AGREEMENT_ROW_APPROVED' : 'LEARNING_AGREEMENT_ROW_DENIED',
        targetType: 'LearningAgreementRow',
        targetId: row.id,
        priorState: RowState.IN_REVIEW,
        newState: input.decision,
        outcome: 'SUCCESS'
      }
    });
  });
}

export async function listCoordinatorReviewQueue(userId: string) {
  const user = await prisma.userAccount.findUnique({ where: { id: userId } });
  assert(!!user, 'User not found', 404);
  assert(user.role === Role.COORDINATOR, 'Only coordinators can view review queue', 403);

  return prisma.learningAgreement.findMany({
    where: {
      coordinatorId: userId,
      state: { in: [AgreementState.SUBMITTED, AgreementState.IN_REVIEW] }
    },
    include: {
      student: { select: { fullName: true } },
      mobilityRecord: { select: { id: true, destinationCity: true } },
      rows: { where: { isLatest: true }, orderBy: { createdAt: 'asc' } }
    },
    orderBy: [{ updatedAt: 'desc' }]
  });
}

export async function getAcademicSummary(input: { mobilityRecordId: string; userId: string }) {
  const mobilityRecord = await prisma.mobilityRecord.findUnique({ where: { id: input.mobilityRecordId } });
  assert(!!mobilityRecord, 'Mobility record not found', 404);

  const user = await prisma.userAccount.findUnique({ where: { id: input.userId } });
  assert(!!user, 'User not found', 404);

  if (user.role === Role.STUDENT) {
    assert(mobilityRecord.studentId === user.id, 'Unauthorized mobility record access', 403);
  }
  if (user.role === Role.COORDINATOR) {
    assert(mobilityRecord.coordinatorId === user.id, 'Coordinator not assigned to this mobility record', 403);
  }

  const agreement = await prisma.learningAgreement.findUnique({
    where: { mobilityRecordId: mobilityRecord.id },
    include: {
      rows: {
        where: { isLatest: true, status: RowState.APPROVED },
        orderBy: [{ semester: 'asc' }, { homeCourseCode: 'asc' }]
      }
    }
  });

  return {
    mobilityRecord,
    agreement: agreement
      ? {
          id: agreement.id,
          state: agreement.state,
          acceptedAt: agreement.acceptedAt,
          rows: agreement.rows
        }
      : null
  };
}
