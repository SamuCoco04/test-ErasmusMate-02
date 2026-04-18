import { PrismaClient, DocumentSubmissionState, MobilityRecordState, PlatformRole, ProcedureDefinitionState } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.auditRecord.deleteMany();
  await prisma.submissionEvent.deleteMany();
  await prisma.documentSubmission.deleteMany();
  await prisma.procedureDefinition.deleteMany();
  await prisma.mobilityRecord.deleteMany();
  await prisma.userAccount.deleteMany();
  await prisma.institution.deleteMany();

  const institution = await prisma.institution.create({
    data: { id: 'inst-ub', name: 'University of Barcelona' }
  });

  const student = await prisma.userAccount.create({
    data: {
      id: 'student-1',
      fullName: 'Maria Rodriguez',
      email: 'maria@example.edu',
      role: PlatformRole.STUDENT
    }
  });

  const coordinator = await prisma.userAccount.create({
    data: {
      id: 'coordinator-1',
      fullName: 'Dr. Anna Jensen',
      email: 'anna.jensen@example.edu',
      role: PlatformRole.COORDINATOR
    }
  });

  await prisma.userAccount.create({
    data: {
      id: 'admin-1',
      fullName: 'System Administrator',
      email: 'admin@example.edu',
      role: PlatformRole.ADMINISTRATOR
    }
  });

  const mobilityRecord = await prisma.mobilityRecord.create({
    data: {
      id: 'mobility-1',
      studentId: student.id,
      coordinatorId: coordinator.id,
      institutionId: institution.id,
      state: MobilityRecordState.ACTIVE,
      destinationCity: 'Barcelona',
      mobilityType: 'Studies',
      mobilityStart: new Date('2026-02-01T00:00:00.000Z'),
      mobilityEnd: new Date('2026-06-30T00:00:00.000Z')
    }
  });

  const procedure = await prisma.procedureDefinition.create({
    data: {
      id: 'proc-la-before',
      institutionId: institution.id,
      title: 'Learning Agreement - Before Mobility',
      version: 1,
      state: ProcedureDefinitionState.PUBLISHED
    }
  });

  const seededSubmission = await prisma.documentSubmission.create({
    data: {
      id: 'sub-1',
      mobilityRecordId: mobilityRecord.id,
      procedureDefinitionId: procedure.id,
      studentId: student.id,
      state: DocumentSubmissionState.DRAFT
    }
  });

  await prisma.submissionEvent.create({
    data: {
      id: 'event-1',
      submissionId: seededSubmission.id,
      actorId: student.id,
      fromState: null,
      toState: DocumentSubmissionState.DRAFT,
      rationale: 'Initial seeded draft'
    }
  });

  await prisma.auditRecord.create({
    data: {
      id: 'audit-1',
      actorId: student.id,
      actionType: 'SUBMISSION_DRAFT_CREATED',
      targetType: 'DocumentSubmission',
      targetId: seededSubmission.id,
      priorState: null,
      newState: DocumentSubmissionState.DRAFT,
      outcome: 'SUCCESS',
      metadataJson: JSON.stringify({ source: 'seed' })
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
