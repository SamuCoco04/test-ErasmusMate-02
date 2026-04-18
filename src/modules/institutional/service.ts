import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';

function getEffectiveDeadlineState(deadline: {
  dueAt: Date;
  overrideDueAt: Date | null;
  state: string;
}) {
  if (deadline.state === 'FULFILLED') return 'FULFILLED';
  if (deadline.overrideDueAt) return 'OVERRIDDEN';

  const now = new Date();
  return now > deadline.dueAt ? 'OVERDUE' : 'UPCOMING';
}

export async function getStudentInstitutionalDashboard(userId: string, mobilityRecordId: string) {
  const mobilityRecord = await prisma.mobilityRecord.findUnique({
    where: { id: mobilityRecordId },
    include: {
      student: true,
      coordinator: true,
      institution: true
    }
  });

  if (!mobilityRecord) {
    throw new AppError('Mobility record not found', 404);
  }

  if (mobilityRecord.studentId !== userId) {
    throw new AppError('Unauthorized mobility record access', 403);
  }

  const [submissions, exceptions, deadlines, procedures] = await Promise.all([
    prisma.documentSubmission.findMany({ where: { mobilityRecordId }, orderBy: { updatedAt: 'desc' } }),
    prisma.exceptionRequest.findMany({ where: { mobilityRecordId }, orderBy: { updatedAt: 'desc' } }),
    prisma.deadline.findMany({ where: { mobilityRecordId }, orderBy: { dueAt: 'asc' } }),
    listApplicableProceduresForMobilityRecord(mobilityRecordId)
  ]);

  return {
    mobilityRecord,
    summary: {
      submissionsTotal: submissions.length,
      pendingSubmissions: submissions.filter((s) => ['DRAFT', 'REJECTED', 'REOPENED'].includes(s.state)).length,
      exceptionsTotal: exceptions.length,
      exceptionsPending: exceptions.filter((e) => ['SUBMITTED', 'IN_REVIEW', 'APPROVED'].includes(e.state)).length,
      upcomingDeadlines: deadlines.filter((d) => getEffectiveDeadlineState(d) !== 'FULFILLED').length
    },
    deadlines: deadlines.map((d) => ({ ...d, effectiveState: getEffectiveDeadlineState(d) })),
    procedures
  };
}

export async function listApplicableProceduresForMobilityRecord(mobilityRecordId: string) {
  const mobilityRecord = await prisma.mobilityRecord.findUnique({ where: { id: mobilityRecordId } });
  if (!mobilityRecord) {
    throw new AppError('Mobility record not found', 404);
  }

  const procedures = await prisma.procedureDefinition.findMany({
    where: {
      institutionId: mobilityRecord.institutionId,
      state: 'PUBLISHED',
      applicabilityRules: {
        some: {
          isActive: true,
          OR: [{ destinationCity: null }, { destinationCity: mobilityRecord.destinationCity }],
          AND: [{ OR: [{ mobilityType: null }, { mobilityType: mobilityRecord.mobilityType }] }],
          lifecyclePhase: mobilityRecord.mobilityPhase
        }
      }
    },
    include: {
      applicabilityRules: true
    },
    orderBy: [{ phase: 'asc' }, { title: 'asc' }]
  });

  return procedures;
}

export async function listDeadlinesForRole(input: {
  role: 'student' | 'coordinator';
  userId: string;
  mobilityRecordId?: string;
}) {
  if (input.role === 'student') {
    const deadlines = await prisma.deadline.findMany({
      where: {
        mobilityRecord: {
          studentId: input.userId,
          ...(input.mobilityRecordId ? { id: input.mobilityRecordId } : {})
        }
      },
      include: {
        mobilityRecord: true,
        procedureDefinition: true
      },
      orderBy: { dueAt: 'asc' }
    });

    return deadlines.map((d) => ({ ...d, effectiveState: getEffectiveDeadlineState(d) }));
  }

  const deadlines = await prisma.deadline.findMany({
    where: {
      mobilityRecord: {
        coordinatorId: input.userId,
        ...(input.mobilityRecordId ? { id: input.mobilityRecordId } : {})
      }
    },
    include: {
      mobilityRecord: {
        include: { student: true }
      },
      procedureDefinition: true
    },
    orderBy: { dueAt: 'asc' }
  });

  return deadlines.map((d) => ({ ...d, effectiveState: getEffectiveDeadlineState(d) }));
}

export async function listAuditTrailForMobility(mobilityRecordId: string) {
  const [submissionIds, exceptionIds] = await Promise.all([
    prisma.documentSubmission.findMany({
      where: { mobilityRecordId },
      select: { id: true }
    }),
    prisma.exceptionRequest.findMany({
      where: { mobilityRecordId },
      select: { id: true }
    })
  ]);

  const targetIds = [mobilityRecordId, ...submissionIds.map((s) => s.id), ...exceptionIds.map((e) => e.id)];

  return prisma.auditRecord.findMany({
    where: {
      OR: [
        { targetType: 'MobilityRecord', targetId: mobilityRecordId },
        { targetType: 'DocumentSubmission', targetId: { in: submissionIds.map((s) => s.id) } },
        { targetType: 'ExceptionRequest', targetId: { in: exceptionIds.map((e) => e.id) } },
        { targetId: { in: targetIds } }
      ]
    },
    include: {
      actor: true
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
}
