import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  await prisma.moderationReport.deleteMany();
  await prisma.moderationCase.deleteMany();
  await prisma.socialFavorite.deleteMany();
  await prisma.socialContent.deleteMany();
  await prisma.placeContext.deleteMany();
  await prisma.message.deleteMany();
  await prisma.messageThread.deleteMany();
  await prisma.socialConnection.deleteMany();
  await prisma.socialConsentSettings.deleteMany();
  await prisma.socialVisibilitySettings.deleteMany();
  await prisma.socialSupportProfile.deleteMany();
  await prisma.auditRecord.deleteMany();
  await prisma.learningAgreementEvent.deleteMany();
  await prisma.learningAgreementRow.deleteMany();
  await prisma.learningAgreement.deleteMany();
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
}

async function main() {
  await clearDatabase();

  const institution = await prisma.institution.create({
    data: { id: 'inst-ub', name: 'University of Barcelona' }
  });

  const [student, studentTwo, studentThree, coordinator, admin] = await Promise.all([
    prisma.userAccount.create({
      data: {
        id: 'student-1',
        fullName: 'Maria Rodriguez',
        email: 'maria@example.edu',
        role: 'STUDENT'
      }
    }),
    prisma.userAccount.create({
      data: {
        id: 'student-2',
        fullName: 'Luca Bianchi',
        email: 'luca@example.edu',
        role: 'STUDENT'
      }
    }),
    prisma.userAccount.create({
      data: {
        id: 'student-3',
        fullName: 'Elena Petrova',
        email: 'elena@example.edu',
        role: 'STUDENT'
      }
    }),
    prisma.userAccount.create({
      data: {
        id: 'coordinator-1',
        fullName: 'Dr. Anna Jensen',
        email: 'anna.jensen@example.edu',
        role: 'COORDINATOR'
      }
    }),
    prisma.userAccount.create({
      data: {
        id: 'admin-1',
        fullName: 'System Administrator',
        email: 'admin@example.edu',
        role: 'ADMINISTRATOR'
      }
    })
  ]);

  const [mobilityRecord, mobilityRecordTwo, mobilityRecordThree] = await Promise.all([
    prisma.mobilityRecord.create({
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
    }),
    prisma.mobilityRecord.create({
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
    }),
    prisma.mobilityRecord.create({
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
    })
  ]);

  const [beforeMobilityProcedure, duringMobilityProcedure, endMobilityProcedure] = await Promise.all([
    prisma.procedureDefinition.create({
      data: {
        id: 'proc-la-before',
        institutionId: institution.id,
        title: 'Learning Agreement - Before Mobility',
        version: 1,
        phase: 'PRE_DEPARTURE',
        state: 'PUBLISHED'
      }
    }),
    prisma.procedureDefinition.create({
      data: {
        id: 'proc-changes-during',
        institutionId: institution.id,
        title: 'Learning Agreement - During Mobility Changes',
        version: 1,
        phase: 'DURING_MOBILITY',
        state: 'PUBLISHED'
      }
    }),
    prisma.procedureDefinition.create({
      data: {
        id: 'proc-end-report',
        institutionId: institution.id,
        title: 'Final Mobility Report',
        version: 1,
        phase: 'END_OF_MOBILITY',
        state: 'PUBLISHED'
      }
    })
  ]);

  await prisma.procedureApplicabilityRule.createMany({
    data: [
      {
        id: 'rule-before-barcelona',
        procedureDefinitionId: beforeMobilityProcedure.id,
        lifecyclePhase: 'PRE_DEPARTURE',
        mobilityType: 'STUDIES',
        destinationCity: 'Barcelona'
      },
      {
        id: 'rule-before-lisbon',
        procedureDefinitionId: beforeMobilityProcedure.id,
        lifecyclePhase: 'PRE_DEPARTURE',
        mobilityType: 'STUDIES',
        destinationCity: 'Lisbon'
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

  const [submissionDraft, submissionRejected, submissionApproved] = await Promise.all([
    prisma.documentSubmission.create({
      data: {
        id: 'sub-1',
        mobilityRecordId: mobilityRecord.id,
        procedureDefinitionId: duringMobilityProcedure.id,
        studentId: student.id,
        state: 'DRAFT'
      }
    }),
    prisma.documentSubmission.create({
      data: {
        id: 'sub-2',
        mobilityRecordId: mobilityRecord.id,
        procedureDefinitionId: duringMobilityProcedure.id,
        studentId: student.id,
        state: 'REJECTED',
        rejectionRationale: 'Missing host faculty signature in annex section.',
        submittedAt: new Date('2026-03-15T10:30:00.000Z'),
        reviewedAt: new Date('2026-03-16T11:10:00.000Z')
      }
    }),
    prisma.documentSubmission.create({
      data: {
        id: 'sub-3',
        mobilityRecordId: mobilityRecordTwo.id,
        procedureDefinitionId: duringMobilityProcedure.id,
        studentId: studentTwo.id,
        state: 'APPROVED',
        submittedAt: new Date('2026-03-10T09:00:00.000Z'),
        reviewedAt: new Date('2026-03-11T13:20:00.000Z')
      }
    })
  ]);

  await prisma.submissionEvent.createMany({
    data: [
      {
        id: 'event-sub-1-draft',
        submissionId: submissionDraft.id,
        actorId: student.id,
        fromState: null,
        toState: 'DRAFT',
        rationale: 'Started preparing changes dossier.'
      },
      {
        id: 'event-sub-2-draft',
        submissionId: submissionRejected.id,
        actorId: student.id,
        fromState: null,
        toState: 'DRAFT',
        rationale: 'Initial submission draft created.'
      },
      {
        id: 'event-sub-2-submitted',
        submissionId: submissionRejected.id,
        actorId: student.id,
        fromState: 'DRAFT',
        toState: 'SUBMITTED',
        rationale: 'Submitting signed changes request.'
      },
      {
        id: 'event-sub-2-review',
        submissionId: submissionRejected.id,
        actorId: coordinator.id,
        fromState: 'SUBMITTED',
        toState: 'IN_REVIEW',
        rationale: 'Document check in progress.'
      },
      {
        id: 'event-sub-2-reject',
        submissionId: submissionRejected.id,
        actorId: coordinator.id,
        fromState: 'IN_REVIEW',
        toState: 'REJECTED',
        rationale: 'Missing host faculty signature in annex section.'
      },
      {
        id: 'event-sub-3-draft',
        submissionId: submissionApproved.id,
        actorId: studentTwo.id,
        fromState: null,
        toState: 'DRAFT',
        rationale: 'Draft created for approved reference case.'
      },
      {
        id: 'event-sub-3-submitted',
        submissionId: submissionApproved.id,
        actorId: studentTwo.id,
        fromState: 'DRAFT',
        toState: 'SUBMITTED',
        rationale: 'Ready for coordinator review.'
      },
      {
        id: 'event-sub-3-review',
        submissionId: submissionApproved.id,
        actorId: coordinator.id,
        fromState: 'SUBMITTED',
        toState: 'IN_REVIEW',
        rationale: 'Coordinator checking procedure compliance.'
      },
      {
        id: 'event-sub-3-approve',
        submissionId: submissionApproved.id,
        actorId: coordinator.id,
        fromState: 'IN_REVIEW',
        toState: 'APPROVED',
        rationale: 'All mandatory fields and signatures valid.'
      }
    ]
  });

  const learningAgreement = await prisma.learningAgreement.create({
    data: {
      id: 'la-1',
      mobilityRecordId: mobilityRecord.id,
      studentId: student.id,
      coordinatorId: coordinator.id,
      state: 'PARTIALLY_APPROVED',
      submittedAt: new Date('2026-04-12T09:00:00.000Z'),
      lastReviewedAt: new Date('2026-04-14T11:00:00.000Z')
    }
  });

  const [laApprovedRow, laDeniedRow] = await Promise.all([
    prisma.learningAgreementRow.create({
      data: {
        id: 'la-row-1',
        agreementId: learningAgreement.id,
        rowKey: 'la-row-key-1',
        revision: 1,
        homeCourseCode: 'UB-ECON-301',
        homeCourseName: 'International Economics',
        destinationCourseCode: 'HOST-ECON-44',
        destinationCourseName: 'Global Trade Systems',
        ects: 6,
        semester: 'Semester 1',
        status: 'APPROVED',
        reviewedById: coordinator.id,
        reviewedAt: new Date('2026-04-14T10:30:00.000Z')
      }
    }),
    prisma.learningAgreementRow.create({
      data: {
        id: 'la-row-2',
        agreementId: learningAgreement.id,
        rowKey: 'la-row-key-2',
        revision: 1,
        homeCourseCode: 'UB-MATH-220',
        homeCourseName: 'Applied Statistics',
        destinationCourseCode: 'HOST-MATH-77',
        destinationCourseName: 'Data Analysis for Social Science',
        ects: 5,
        semester: 'Semester 1',
        status: 'DENIED',
        decisionRationale: 'Destination syllabus lacks probability modules required for equivalence.',
        reviewedById: coordinator.id,
        reviewedAt: new Date('2026-04-14T10:45:00.000Z')
      }
    })
  ]);

  await prisma.learningAgreementEvent.createMany({
    data: [
      {
        id: 'la-event-create',
        agreementId: learningAgreement.id,
        actorId: student.id,
        actionType: 'AGREEMENT_CREATED',
        toState: 'DRAFT'
      },
      {
        id: 'la-event-submit',
        agreementId: learningAgreement.id,
        actorId: student.id,
        actionType: 'AGREEMENT_SUBMITTED',
        fromState: 'DRAFT',
        toState: 'SUBMITTED'
      },
      {
        id: 'la-event-approve-row',
        agreementId: learningAgreement.id,
        rowId: laApprovedRow.id,
        actorId: coordinator.id,
        actionType: 'ROW_APPROVED',
        fromState: 'IN_REVIEW',
        toState: 'APPROVED'
      },
      {
        id: 'la-event-deny-row',
        agreementId: learningAgreement.id,
        rowId: laDeniedRow.id,
        actorId: coordinator.id,
        actionType: 'ROW_DENIED',
        fromState: 'IN_REVIEW',
        toState: 'DENIED',
        noteOrRationale: 'Destination syllabus lacks probability modules required for equivalence.'
      }
    ]
  });

  await prisma.deadline.createMany({
    data: [
      {
        id: 'deadline-1',
        mobilityRecordId: mobilityRecord.id,
        procedureDefinitionId: duringMobilityProcedure.id,
        title: 'Submit During-Mobility Learning Agreement',
        dueAt: new Date('2026-04-25T23:59:00.000Z'),
        overrideDueAt: new Date('2026-04-28T23:59:00.000Z'),
        state: 'OVERRIDDEN',
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
      },
      {
        id: 'deadline-3',
        mobilityRecordId: mobilityRecordTwo.id,
        procedureDefinitionId: duringMobilityProcedure.id,
        title: 'Coordinator review completion target',
        dueAt: new Date('2026-03-12T17:00:00.000Z'),
        state: 'FULFILLED',
        obligationType: 'REVIEW'
      },
      {
        id: 'deadline-4',
        mobilityRecordId: mobilityRecordThree.id,
        procedureDefinitionId: beforeMobilityProcedure.id,
        title: 'Pre-departure Learning Agreement submission',
        dueAt: new Date('2026-06-05T23:59:00.000Z'),
        state: 'UPCOMING',
        obligationType: 'SUBMISSION'
      }
    ]
  });

  const [exceptionSubmitted, exceptionApplied, exceptionRejected] = await Promise.all([
    prisma.exceptionRequest.create({
      data: {
        id: 'exc-1',
        mobilityRecordId: mobilityRecord.id,
        studentId: student.id,
        scopeType: 'DEADLINE',
        scopeRefId: 'deadline-1',
        reason: 'Hosting department requested additional attachment review, asking for 3-day extension.',
        state: 'SUBMITTED'
      }
    }),
    prisma.exceptionRequest.create({
      data: {
        id: 'exc-2',
        mobilityRecordId: mobilityRecordTwo.id,
        studentId: studentTwo.id,
        scopeType: 'DEADLINE',
        scopeRefId: 'deadline-3',
        reason: 'Coordinator requested urgent panel review deadline extension by one day.',
        state: 'APPLIED',
        decisionRationale: 'Approved after confirming coordinator schedule overlap.',
        reviewedById: coordinator.id,
        reviewedAt: new Date('2026-03-09T14:00:00.000Z')
      }
    }),
    prisma.exceptionRequest.create({
      data: {
        id: 'exc-3',
        mobilityRecordId: mobilityRecord.id,
        studentId: student.id,
        scopeType: 'DOCUMENT',
        scopeRefId: submissionRejected.id,
        reason: 'Requesting bypass of mandatory host signature due to processing delays.',
        state: 'REJECTED',
        decisionRationale: 'Signature remains mandatory per institutional policy.',
        reviewedById: coordinator.id,
        reviewedAt: new Date('2026-03-16T11:15:00.000Z')
      }
    })
  ]);

  await prisma.exceptionEvent.createMany({
    data: [
      {
        id: 'exc-event-1-submitted',
        exceptionId: exceptionSubmitted.id,
        actorId: student.id,
        fromState: null,
        toState: 'SUBMITTED',
        rationale: 'Initial request'
      },
      {
        id: 'exc-event-2-submitted',
        exceptionId: exceptionApplied.id,
        actorId: studentTwo.id,
        fromState: null,
        toState: 'SUBMITTED',
        rationale: 'Initial request'
      },
      {
        id: 'exc-event-2-review',
        exceptionId: exceptionApplied.id,
        actorId: coordinator.id,
        fromState: 'SUBMITTED',
        toState: 'IN_REVIEW',
        rationale: 'Queue processing started'
      },
      {
        id: 'exc-event-2-approve',
        exceptionId: exceptionApplied.id,
        actorId: coordinator.id,
        fromState: 'IN_REVIEW',
        toState: 'APPROVED',
        rationale: 'Extension justified'
      },
      {
        id: 'exc-event-2-apply',
        exceptionId: exceptionApplied.id,
        actorId: coordinator.id,
        fromState: 'APPROVED',
        toState: 'APPLIED',
        rationale: 'Deadline override registered'
      },
      {
        id: 'exc-event-3-submitted',
        exceptionId: exceptionRejected.id,
        actorId: student.id,
        fromState: null,
        toState: 'SUBMITTED',
        rationale: 'Initial request'
      },
      {
        id: 'exc-event-3-review',
        exceptionId: exceptionRejected.id,
        actorId: coordinator.id,
        fromState: 'SUBMITTED',
        toState: 'IN_REVIEW',
        rationale: 'Reviewing request for policy impact'
      },
      {
        id: 'exc-event-3-reject',
        exceptionId: exceptionRejected.id,
        actorId: coordinator.id,
        fromState: 'IN_REVIEW',
        toState: 'REJECTED',
        rationale: 'Signature remains mandatory per institutional policy.'
      }
    ]
  });

  await prisma.auditRecord.createMany({
    data: [
      {
        id: 'audit-1',
        actorId: student.id,
        actionType: 'SUBMISSION_DRAFT_CREATED',
        targetType: 'DocumentSubmission',
        targetId: submissionDraft.id,
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
        targetId: exceptionSubmitted.id,
        priorState: null,
        newState: 'SUBMITTED',
        outcome: 'SUCCESS',
        metadataJson: JSON.stringify({ source: 'seed' })
      },
      {
        id: 'audit-3',
        actorId: coordinator.id,
        actionType: 'SUBMISSION_REJECTED',
        targetType: 'DocumentSubmission',
        targetId: submissionRejected.id,
        priorState: 'IN_REVIEW',
        newState: 'REJECTED',
        outcome: 'SUCCESS',
        metadataJson: JSON.stringify({ source: 'seed', reason: 'missing_signature' })
      },
      {
        id: 'audit-4',
        actorId: admin.id,
        actionType: 'MODERATION_CASE_REVIEWED',
        targetType: 'ModerationCase',
        targetId: 'mod-case-1',
        priorState: 'reported',
        newState: 'in_review',
        outcome: 'SUCCESS',
        metadataJson: JSON.stringify({ source: 'seed' })
      }
    ]
  });

  const [socialProfileOne, socialProfileTwo] = await Promise.all([
    prisma.socialSupportProfile.create({
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
    }),
    prisma.socialSupportProfile.create({
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
    })
  ]);

  await prisma.socialSupportProfile.create({
    data: {
      id: 'social-3',
      userId: studentThree.id,
      mobilityRecordId: mobilityRecordThree.id,
      headline: 'Preparing for Lisbon mobility',
      bio: 'Currently private while pre-departure documents are being prepared.',
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

  const [acceptedConnection, blockedConnection] = await Promise.all([
    prisma.socialConnection.create({
      data: {
        id: 'conn-accepted-1',
        requesterProfileId: socialProfileOne.id,
        recipientProfileId: socialProfileTwo.id,
        requesterUserId: student.id,
        recipientUserId: studentTwo.id,
        state: 'accepted',
        respondedAt: new Date('2026-03-01T10:00:00.000Z')
      }
    }),
    prisma.socialConnection.create({
      data: {
        id: 'conn-blocked-1',
        requesterProfileId: socialProfileTwo.id,
        recipientProfileId: socialProfileOne.id,
        requesterUserId: studentTwo.id,
        recipientUserId: student.id,
        state: 'blocked',
        blockedByUserId: student.id,
        respondedAt: new Date('2026-03-20T08:00:00.000Z'),
        closedAt: new Date('2026-03-20T08:00:00.000Z')
      }
    })
  ]);


  await prisma.socialConnection.create({
    data: {
      id: 'conn-pending-1',
      requesterProfileId: socialProfileTwo.id,
      recipientProfileId: socialProfileOne.id,
      requesterUserId: studentTwo.id,
      recipientUserId: student.id,
      state: 'pending'
    }
  });

  const [permittedThread, blockedThread] = await Promise.all([
    prisma.messageThread.create({
      data: {
        id: 'thread-1',
        connectionId: acceptedConnection.id,
        permissionState: 'permitted'
      }
    }),
    prisma.messageThread.create({
      data: {
        id: 'thread-2',
        connectionId: blockedConnection.id,
        permissionState: 'blocked'
      }
    })
  ]);

  await prisma.message.createMany({
    data: [
      {
        id: 'msg-1',
        threadId: permittedThread.id,
        senderUserId: student.id,
        messageText: 'Hi Luca, do you have tips for first week registration?',
        sentAt: new Date('2026-03-02T09:00:00.000Z')
      },
      {
        id: 'msg-2',
        threadId: permittedThread.id,
        senderUserId: studentTwo.id,
        messageText: 'Yes, start with Erasmus office slot booking and transport card setup.',
        sentAt: new Date('2026-03-02T09:05:00.000Z')
      },
      {
        id: 'msg-3',
        threadId: permittedThread.id,
        senderUserId: student.id,
        messageText: 'Thanks! I will follow that order before class registration.',
        sentAt: new Date('2026-03-02T09:07:00.000Z')
      },
      {
        id: 'msg-4',
        threadId: blockedThread.id,
        senderUserId: studentTwo.id,
        messageText: 'This thread should not accept new messages once blocked.',
        sentAt: new Date('2026-03-20T07:59:00.000Z')
      }
    ]
  });

  await prisma.placeContext.createMany({
    data: [
      {
        id: 'place-1',
        label: 'UB Main Campus Area',
        city: 'Barcelona',
        country: 'Spain',
        category: 'university_area',
        latitude: 41.3842,
        longitude: 2.1636,
        erasmusScopeTag: 'academic_onboarding',
        isApproved: true,
        isActive: true,
        isPublic: true
      },
      {
        id: 'place-2',
        label: 'Sants Transit Hub',
        city: 'Barcelona',
        country: 'Spain',
        category: 'transport_hub',
        latitude: 41.3791,
        longitude: 2.1392,
        erasmusScopeTag: 'arrival_and_transport',
        isApproved: true,
        isActive: true,
        isPublic: true
      },
      {
        id: 'place-3',
        label: 'Student Office District',
        city: 'Barcelona',
        country: 'Spain',
        category: 'civic_office',
        latitude: 41.3888,
        longitude: 2.1589,
        erasmusScopeTag: 'administrative_tasks',
        isApproved: true,
        isActive: true,
        isPublic: true
      },
      {
        id: 'place-4',
        label: 'Shared Housing Quarter',
        city: 'Barcelona',
        country: 'Spain',
        category: 'student_housing_zone',
        latitude: 41.3965,
        longitude: 2.1614,
        erasmusScopeTag: 'housing_guidance',
        isApproved: true,
        isActive: true,
        isPublic: true
      },
      {
        id: 'place-5',
        label: 'Lisbon Erasmus Admin Point',
        city: 'Lisbon',
        country: 'Portugal',
        category: 'civic_office',
        latitude: 38.7223,
        longitude: -9.1393,
        erasmusScopeTag: 'pre_departure_prep',
        isApproved: true,
        isActive: true,
        isPublic: true
      }
    ]
  });

  const [recommendation, review, tip, opinion, hiddenRecommendation] = await Promise.all([
    prisma.socialContent.create({
      data: {
        id: 'content-1',
        authorId: student.id,
        authorProfileId: socialProfileOne.id,
        kind: 'recommendation',
        title: 'Best first-week accommodation checklist',
        body: 'Start with verified student housing portals and keep landlord communication documented for Erasmus onboarding.',
        destinationCity: 'Barcelona',
        topicCategory: 'accommodation',
        placeContextId: 'place-4',
        state: 'published_visible',
        moderationState: 'VISIBLE'
      }
    }),
    prisma.socialContent.create({
      data: {
        id: 'content-2',
        authorId: studentTwo.id,
        authorProfileId: socialProfileTwo.id,
        kind: 'review',
        title: 'Transport card setup experience',
        body: 'The metro card process is efficient if you pre-book your student verification slot.',
        rating: 4,
        destinationCity: 'Barcelona',
        topicCategory: 'transport',
        placeContextId: 'place-2',
        state: 'published_visible',
        moderationState: 'VISIBLE'
      }
    }),
    prisma.socialContent.create({
      data: {
        id: 'content-3',
        authorId: studentTwo.id,
        authorProfileId: socialProfileTwo.id,
        kind: 'tip',
        title: 'Bureaucracy timing tip',
        body: 'Go to administration offices early in the morning to avoid queue spikes during semester change weeks.',
        destinationCity: 'Barcelona',
        topicCategory: 'bureaucracy',
        placeContextId: 'place-3',
        state: 'published_visible',
        moderationState: 'VISIBLE'
      }
    }),
    prisma.socialContent.create({
      data: {
        id: 'content-4',
        authorId: student.id,
        authorProfileId: socialProfileOne.id,
        kind: 'opinion',
        title: 'Campus support desks are improving',
        body: 'In-person support quality improved this term compared with last year onboarding reports.',
        rating: 4,
        destinationCity: 'Barcelona',
        topicCategory: 'academics',
        placeContextId: 'place-1',
        state: 'published_visible',
        moderationState: 'VISIBLE'
      }
    }),
    prisma.socialContent.create({
      data: {
        id: 'content-5',
        authorId: studentTwo.id,
        authorProfileId: socialProfileTwo.id,
        kind: 'recommendation',
        title: 'Outdated private address list',
        body: 'Contains non-public location references and was hidden by moderation for policy mismatch.',
        destinationCity: 'Barcelona',
        topicCategory: 'daily_living',
        placeContextId: 'place-1',
        state: 'hidden_or_restricted',
        moderationState: 'HIDDEN'
      }
    })
  ]);

  await prisma.socialFavorite.createMany({
    data: [
      {
        id: 'favorite-1',
        userId: student.id,
        socialContentId: review.id
      },
      {
        id: 'favorite-2',
        userId: student.id,
        socialContentId: tip.id
      }
    ]
  });

  const [moderationCaseReview, moderationCaseHidden] = await Promise.all([
    prisma.moderationCase.create({
      data: {
        id: 'mod-case-1',
        targetType: 'review',
        targetContentId: review.id,
        caseState: 'in_review',
        moderatorId: admin.id
      }
    }),
    prisma.moderationCase.create({
      data: {
        id: 'mod-case-2',
        targetType: 'recommendation',
        targetContentId: hiddenRecommendation.id,
        caseState: 'resolved_hidden',
        moderatorId: admin.id
      }
    })
  ]);

  await prisma.moderationReport.createMany({
    data: [
      {
        id: 'mod-report-1',
        reporterId: student.id,
        targetType: 'review',
        targetContentId: review.id,
        reportReason: 'Potentially misleading process details',
        reportDetails: 'Could need verification on updated process steps.',
        moderationCaseId: moderationCaseReview.id,
        state: 'in_review'
      },
      {
        id: 'mod-report-2',
        reporterId: student.id,
        targetType: 'recommendation',
        targetContentId: hiddenRecommendation.id,
        reportReason: 'Contains private location details',
        reportDetails: 'Includes non-public private references not allowed for map/social display.',
        moderationCaseId: moderationCaseHidden.id,
        state: 'resolved'
      }
    ]
  });

  await prisma.socialContent.updateMany({
    where: { id: { in: [recommendation.id, opinion.id] } },
    data: { reportCount: 0 }
  });

  await prisma.socialContent.update({
    where: { id: review.id },
    data: { reportCount: 1 }
  });

  await prisma.socialContent.update({
    where: { id: hiddenRecommendation.id },
    data: { reportCount: 1 }
  });

  console.info('Seed complete with deterministic phase-7 demo dataset.');
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
