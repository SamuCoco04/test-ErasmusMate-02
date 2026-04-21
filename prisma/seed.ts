import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.message.deleteMany();
  await prisma.messageThread.deleteMany();
  await prisma.socialConnection.deleteMany();
  await prisma.socialConsentSettings.deleteMany();
  await prisma.socialVisibilitySettings.deleteMany();
  await prisma.socialSupportProfile.deleteMany();
  await prisma.auditRecord.deleteMany();
  await prisma.exceptionEvent.deleteMany();
  await prisma.exceptionRequest.deleteMany();
  await prisma.deadline.deleteMany();
  await prisma.submissionEvent.deleteMany();
  await prisma.documentSubmission.deleteMany();
  await prisma.procedureApplicabilityRule.deleteMany();
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
      role: 'STUDENT'
    }
  });

  const studentTwo = await prisma.userAccount.create({
    data: {
      id: 'student-2',
      fullName: 'Luca Bianchi',
      email: 'luca@example.edu',
      role: 'STUDENT'
    }
  });

  const studentThree = await prisma.userAccount.create({
    data: {
      id: 'student-3',
      fullName: 'Elena Petrova',
      email: 'elena@example.edu',
      role: 'STUDENT'
    }
  });

  const coordinator = await prisma.userAccount.create({
    data: {
      id: 'coordinator-1',
      fullName: 'Dr. Anna Jensen',
      email: 'anna.jensen@example.edu',
      role: 'COORDINATOR'
    }
  });

  await prisma.userAccount.create({
    data: {
      id: 'admin-1',
      fullName: 'System Administrator',
      email: 'admin@example.edu',
      role: 'ADMINISTRATOR'
    }
  });

  const mobilityRecord = await prisma.mobilityRecord.create({
    data: {
      id: 'mobility-1',
      studentId: student.id,
      coordinatorId: coordinator.id,
      institutionId: institution.id,
      state: 'ACTIVE',
      destinationCity: 'Barcelona',
      mobilityType: 'STUDIES',
      mobilityPhase: 'DURING_MOBILITY',
      mobilityStart: new Date('2026-02-01T00:00:00.000Z'),
      mobilityEnd: new Date('2026-06-30T00:00:00.000Z')
    }
  });

  const mobilityRecordTwo = await prisma.mobilityRecord.create({
    data: {
      id: 'mobility-2',
      studentId: studentTwo.id,
      coordinatorId: coordinator.id,
      institutionId: institution.id,
      state: 'ACTIVE',
      destinationCity: 'Barcelona',
      mobilityType: 'STUDIES',
      mobilityPhase: 'DURING_MOBILITY',
      mobilityStart: new Date('2026-01-20T00:00:00.000Z'),
      mobilityEnd: new Date('2026-07-01T00:00:00.000Z')
    }
  });

  const mobilityRecordThree = await prisma.mobilityRecord.create({
    data: {
      id: 'mobility-3',
      studentId: studentThree.id,
      coordinatorId: coordinator.id,
      institutionId: institution.id,
      state: 'ACTIVE',
      destinationCity: 'Lisbon',
      mobilityType: 'STUDIES',
      mobilityPhase: 'PRE_DEPARTURE',
      mobilityStart: new Date('2026-08-01T00:00:00.000Z'),
      mobilityEnd: new Date('2027-01-30T00:00:00.000Z')
    }
  });

  const beforeMobilityProcedure = await prisma.procedureDefinition.create({
    data: {
      id: 'proc-la-before',
      institutionId: institution.id,
      title: 'Learning Agreement - Before Mobility',
      version: 1,
      phase: 'PRE_DEPARTURE',
      state: 'PUBLISHED'
    }
  });

  const duringMobilityProcedure = await prisma.procedureDefinition.create({
    data: {
      id: 'proc-changes-during',
      institutionId: institution.id,
      title: 'Learning Agreement - During Mobility Changes',
      version: 1,
      phase: 'DURING_MOBILITY',
      state: 'PUBLISHED'
    }
  });

  const endMobilityProcedure = await prisma.procedureDefinition.create({
    data: {
      id: 'proc-end-report',
      institutionId: institution.id,
      title: 'Final Mobility Report',
      version: 1,
      phase: 'END_OF_MOBILITY',
      state: 'PUBLISHED'
    }
  });

  await prisma.procedureApplicabilityRule.createMany({
    data: [
      {
        id: 'rule-before',
        procedureDefinitionId: beforeMobilityProcedure.id,
        lifecyclePhase: 'PRE_DEPARTURE',
        mobilityType: 'STUDIES',
        destinationCity: 'Barcelona'
      },
      {
        id: 'rule-during',
        procedureDefinitionId: duringMobilityProcedure.id,
        lifecyclePhase: 'DURING_MOBILITY',
        mobilityType: 'STUDIES',
        destinationCity: 'Barcelona'
      },
      {
        id: 'rule-end',
        procedureDefinitionId: endMobilityProcedure.id,
        lifecyclePhase: 'END_OF_MOBILITY',
        mobilityType: 'STUDIES',
        destinationCity: 'Barcelona'
      }
    ]
  });

  const seededSubmission = await prisma.documentSubmission.create({
    data: {
      id: 'sub-1',
      mobilityRecordId: mobilityRecord.id,
      procedureDefinitionId: duringMobilityProcedure.id,
      studentId: student.id,
      state: 'DRAFT'
    }
  });

  await prisma.submissionEvent.create({
    data: {
      id: 'event-1',
      submissionId: seededSubmission.id,
      actorId: student.id,
      fromState: null,
      toState: 'DRAFT',
      rationale: 'Initial seeded draft'
    }
  });

  await prisma.deadline.createMany({
    data: [
      {
        id: 'deadline-1',
        mobilityRecordId: mobilityRecord.id,
        procedureDefinitionId: duringMobilityProcedure.id,
        title: 'Submit During-Mobility Learning Agreement',
        dueAt: new Date('2026-04-25T23:59:00.000Z'),
        state: 'UPCOMING',
        obligationType: 'SUBMISSION'
      },
      {
        id: 'deadline-2',
        mobilityRecordId: mobilityRecord.id,
        procedureDefinitionId: endMobilityProcedure.id,
        title: 'Submit Final Mobility Report',
        dueAt: new Date('2026-07-10T23:59:00.000Z'),
        state: 'UPCOMING',
        obligationType: 'SUBMISSION'
      }
    ]
  });

  const seededException = await prisma.exceptionRequest.create({
    data: {
      id: 'exc-1',
      mobilityRecordId: mobilityRecord.id,
      studentId: student.id,
      scopeType: 'DEADLINE',
      scopeRefId: 'deadline-1',
      reason: 'Hosting department requested additional attachment review, asking for 3-day extension.',
      state: 'SUBMITTED'
    }
  });

  await prisma.exceptionEvent.create({
    data: {
      id: 'exc-event-1',
      exceptionId: seededException.id,
      actorId: student.id,
      fromState: null,
      toState: 'SUBMITTED',
      rationale: 'Initial request'
    }
  });

  await prisma.auditRecord.createMany({
    data: [
      {
        id: 'audit-1',
        actorId: student.id,
        actionType: 'SUBMISSION_DRAFT_CREATED',
        targetType: 'DocumentSubmission',
        targetId: seededSubmission.id,
        priorState: null,
        newState: 'DRAFT',
        outcome: 'SUCCESS',
        metadataJson: JSON.stringify({ source: 'seed' })
      },
      {
        id: 'audit-2',
        actorId: student.id,
        actionType: 'EXCEPTION_SUBMITTED',
        targetType: 'ExceptionRequest',
        targetId: seededException.id,
        priorState: null,
        newState: 'SUBMITTED',
        outcome: 'SUCCESS',
        metadataJson: JSON.stringify({ source: 'seed' })
      }
    ]
  });

  const socialProfileOne = await prisma.socialSupportProfile.create({
    data: {
      id: 'social-1',
      userId: student.id,
      mobilityRecordId: mobilityRecord.id,
      headline: 'Looking for peers in Barcelona mobility cohort',
      bio: 'Focused on Erasmus studies and housing tips around campus.',
      languages: 'Spanish, English',
      interests: 'Academics, local administration, student life',
      profileState: 'contactable',
      discoverable: true,
      contactable: true
    }
  });

  const socialProfileTwo = await prisma.socialSupportProfile.create({
    data: {
      id: 'social-2',
      userId: studentTwo.id,
      mobilityRecordId: mobilityRecordTwo.id,
      headline: 'Happy to help with registration and transport questions',
      bio: 'Second semester in Barcelona with practical onboarding tips.',
      languages: 'Italian, English, Spanish',
      interests: 'Transport, bureaucracy, budgeting',
      profileState: 'contactable',
      discoverable: true,
      contactable: true
    }
  });

  await prisma.socialSupportProfile.create({
    data: {
      id: 'social-3',
      userId: studentThree.id,
      mobilityRecordId: mobilityRecordThree.id,
      headline: 'Preparing for Lisbon mobility',
      profileState: 'profile_active_private',
      discoverable: false,
      contactable: false
    }
  });

  await prisma.socialVisibilitySettings.createMany({
    data: [
      {
        id: 'social-vis-1',
        profileId: socialProfileOne.id,
        showHeadline: true,
        showBio: true,
        showLanguages: true,
        showInterests: true,
        showDestination: true,
        showHostInstitution: true,
        showCity: true,
        showMobilityPeriod: true,
        showMobilityStage: true,
        directContactExposed: false
      },
      {
        id: 'social-vis-2',
        profileId: socialProfileTwo.id,
        showHeadline: true,
        showBio: true,
        showLanguages: true,
        showInterests: true,
        showDestination: true,
        showHostInstitution: true,
        showCity: true,
        showMobilityPeriod: true,
        showMobilityStage: true,
        directContactExposed: true
      },
      {
        id: 'social-vis-3',
        profileId: 'social-3',
        showHeadline: false,
        showBio: false,
        showLanguages: false,
        showInterests: false,
        showDestination: false,
        showHostInstitution: false,
        showCity: false,
        showMobilityPeriod: false,
        showMobilityStage: false,
        directContactExposed: false
      }
    ]
  });

  await prisma.socialConsentSettings.createMany({
    data: [
      {
        id: 'social-consent-1',
        profileId: socialProfileOne.id,
        discoverabilityConsent: true,
        contactabilityConsent: true
      },
      {
        id: 'social-consent-2',
        profileId: socialProfileTwo.id,
        discoverabilityConsent: true,
        contactabilityConsent: true
      },
      {
        id: 'social-consent-3',
        profileId: 'social-3',
        discoverabilityConsent: false,
        contactabilityConsent: false,
        consentRevokedAt: new Date('2026-03-10T00:00:00.000Z')
      }
    ]
  });

  const acceptedConnection = await prisma.socialConnection.create({
    data: {
      id: 'conn-accepted-1',
      requesterProfileId: socialProfileOne.id,
      recipientProfileId: socialProfileTwo.id,
      requesterUserId: student.id,
      recipientUserId: studentTwo.id,
      state: 'accepted',
      respondedAt: new Date('2026-03-01T10:00:00.000Z')
    }
  });

  const thread = await prisma.messageThread.create({
    data: {
      id: 'thread-1',
      connectionId: acceptedConnection.id,
      permissionState: 'permitted'
    }
  });

  await prisma.message.createMany({
    data: [
      {
        id: 'msg-1',
        threadId: thread.id,
        senderUserId: student.id,
        messageText: 'Hi Luca, do you have tips for first week registration?',
        sentAt: new Date('2026-03-02T09:00:00.000Z')
      },
      {
        id: 'msg-2',
        threadId: thread.id,
        senderUserId: studentTwo.id,
        messageText: 'Yes, start with Erasmus office slot booking and transport card setup.',
        sentAt: new Date('2026-03-02T09:05:00.000Z')
      }
    ]
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
