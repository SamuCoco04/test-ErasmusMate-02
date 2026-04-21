import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';

function assert(condition: boolean, message: string, statusCode = 400): asserts condition {
  if (!condition) throw new AppError(message, statusCode);
}

function computeProfileState(input: {
  discoverable: boolean;
  contactable: boolean;
  discoverabilityConsent: boolean;
  contactabilityConsent: boolean;
}): string {
  if (!input.discoverabilityConsent || !input.contactabilityConsent) return 'consent_revoked_or_restricted';
  if (input.contactable && input.discoverable) return 'contactable';
  if (input.discoverable) return 'discoverable';
  return 'profile_active_private';
}

async function ensureStudentWithMobility(userId: string, tx: Prisma.TransactionClient | typeof prisma = prisma) {
  const user = await tx.userAccount.findUnique({ where: { id: userId } });
  assert(!!user, 'User not found', 404);
  assert(user.role === 'STUDENT', 'Social features are available only for students', 403);

  const mobility = await tx.mobilityRecord.findFirst({
    where: { studentId: userId, state: { in: ['ACTIVE', 'APPROVED', 'IN_REVIEW'] } }
  });
  assert(!!mobility, 'Student is not currently eligible for social scope', 403);
  return { user, mobility };
}

export async function getOrCreateSocialProfile(userId: string) {
  const { mobility } = await ensureStudentWithMobility(userId);

  const existing = await prisma.socialSupportProfile.findUnique({
    where: { userId },
    include: { visibilitySettings: true, consentSettings: true, mobilityRecord: { include: { institution: true } } }
  });

  if (existing) return existing;

  return prisma.$transaction(async (tx) => {
    const profile = await tx.socialSupportProfile.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        mobilityRecordId: mobility.id,
        profileState: 'profile_active_private'
      }
    });

    await tx.socialVisibilitySettings.create({ data: { id: crypto.randomUUID(), profileId: profile.id } });
    await tx.socialConsentSettings.create({ data: { id: crypto.randomUUID(), profileId: profile.id } });

    return tx.socialSupportProfile.findUniqueOrThrow({
      where: { id: profile.id },
      include: { visibilitySettings: true, consentSettings: true, mobilityRecord: { include: { institution: true } } }
    });
  });
}

export async function upsertSocialProfile(input: {
  userId: string;
  mobilityRecordId: string;
  headline?: string | null;
  bio?: string | null;
  languages?: string | null;
  interests?: string | null;
  discoverable: boolean;
  contactable: boolean;
  discoverabilityConsent: boolean;
  contactabilityConsent: boolean;
  visibility: {
    showHeadline: boolean;
    showBio: boolean;
    showLanguages: boolean;
    showInterests: boolean;
    showDestination: boolean;
    showHostInstitution: boolean;
    showCity: boolean;
    showMobilityPeriod: boolean;
    showMobilityStage: boolean;
    directContactExposed: boolean;
  };
}) {
  const { mobility } = await ensureStudentWithMobility(input.userId);
  assert(mobility.id === input.mobilityRecordId, 'Mobility record mismatch for social profile', 403);

  if ((input.discoverable || input.contactable) && !input.discoverabilityConsent) {
    throw new AppError('Discoverability/contactability requires discoverability consent', 400);
  }
  if (input.contactable && !input.contactabilityConsent) {
    throw new AppError('Contactability requires contactability consent', 400);
  }

  const profileState = computeProfileState(input);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.socialSupportProfile.findUnique({ where: { userId: input.userId } });

    const profile = existing
      ? await tx.socialSupportProfile.update({
          where: { id: existing.id },
          data: {
            mobilityRecordId: input.mobilityRecordId,
            headline: input.headline ?? null,
            bio: input.bio ?? null,
            languages: input.languages ?? null,
            interests: input.interests ?? null,
            discoverable: input.discoverable && input.discoverabilityConsent,
            contactable: input.contactable && input.discoverabilityConsent && input.contactabilityConsent,
            profileState
          }
        })
      : await tx.socialSupportProfile.create({
          data: {
            id: crypto.randomUUID(),
            userId: input.userId,
            mobilityRecordId: input.mobilityRecordId,
            headline: input.headline ?? null,
            bio: input.bio ?? null,
            languages: input.languages ?? null,
            interests: input.interests ?? null,
            discoverable: input.discoverable && input.discoverabilityConsent,
            contactable: input.contactable && input.discoverabilityConsent && input.contactabilityConsent,
            profileState
          }
        });

    await tx.socialVisibilitySettings.upsert({
      where: { profileId: profile.id },
      create: { id: crypto.randomUUID(), profileId: profile.id, ...input.visibility },
      update: input.visibility
    });

    await tx.socialConsentSettings.upsert({
      where: { profileId: profile.id },
      create: {
        id: crypto.randomUUID(),
        profileId: profile.id,
        discoverabilityConsent: input.discoverabilityConsent,
        contactabilityConsent: input.contactabilityConsent,
        consentRevokedAt: input.discoverabilityConsent && input.contactabilityConsent ? null : new Date()
      },
      update: {
        discoverabilityConsent: input.discoverabilityConsent,
        contactabilityConsent: input.contactabilityConsent,
        consentRevokedAt: input.discoverabilityConsent && input.contactabilityConsent ? null : new Date()
      }
    });

    await tx.auditRecord.create({
      data: {
        id: crypto.randomUUID(),
        actorId: input.userId,
        actionType: 'SOCIAL_PROFILE_UPDATED',
        targetType: 'SocialSupportProfile',
        targetId: profile.id,
        outcome: 'SUCCESS',
        newState: profileState
      }
    });

    return tx.socialSupportProfile.findUniqueOrThrow({
      where: { id: profile.id },
      include: { visibilitySettings: true, consentSettings: true, mobilityRecord: { include: { institution: true } } }
    });
  });
}

type DiscoverableProfile = {
  id: string;
  userId: string;
  headline: string | null;
  bio: string | null;
  languages: string | null;
  interests: string | null;
  user: { fullName: string; email: string };
  mobilityRecord: {
    destinationCity: string;
    mobilityPhase: string;
    mobilityStart: Date;
    mobilityEnd: Date;
    institution: { name: string };
  };
  visibilitySettings: {
    showHeadline: boolean;
    showBio: boolean;
    showLanguages: boolean;
    showInterests: boolean;
    showHostInstitution: boolean;
    showCity: boolean;
    showMobilityPeriod: boolean;
    showMobilityStage: boolean;
    directContactExposed: boolean;
  } | null;
};

function redactProfile(profile: DiscoverableProfile) {
  const visibility = profile.visibilitySettings;
  return {
    id: profile.id,
    userId: profile.userId,
    studentName: profile.user.fullName,
    headline: visibility?.showHeadline ? profile.headline : null,
    bio: visibility?.showBio ? profile.bio : null,
    languages: visibility?.showLanguages ? profile.languages : null,
    interests: visibility?.showInterests ? profile.interests : null,
    destinationCity: visibility?.showCity ? profile.mobilityRecord.destinationCity : null,
    hostInstitution: visibility?.showHostInstitution ? profile.mobilityRecord.institution.name : null,
    mobilityStage: visibility?.showMobilityStage ? profile.mobilityRecord.mobilityPhase : null,
    mobilityPeriod: visibility?.showMobilityPeriod
      ? `${profile.mobilityRecord.mobilityStart.toISOString().slice(0, 10)} to ${profile.mobilityRecord.mobilityEnd.toISOString().slice(0, 10)}`
      : null,
    directContactExposed: visibility?.directContactExposed ?? false,
    contactEmail: visibility?.directContactExposed ? profile.user.email : null
  };
}

export async function discoverStudents(input: {
  userId: string;
  search?: string;
  destination?: string;
  hostInstitution?: string;
  city?: string;
  mobilityStage?: string;
  mobilityPeriod?: string;
}) {
  await ensureStudentWithMobility(input.userId);

  const search = input.search?.trim();
  const profiles = await prisma.socialSupportProfile.findMany({
    where: {
      userId: { not: input.userId },
      discoverable: true,
      consentSettings: { discoverabilityConsent: true },
      mobilityRecord: {
        state: { in: ['ACTIVE', 'APPROVED', 'IN_REVIEW'] },
        ...(input.destination ? { destinationCity: { contains: input.destination } } : {}),
        ...(input.city ? { destinationCity: { contains: input.city } } : {}),
        ...(input.mobilityStage ? { mobilityPhase: input.mobilityStage } : {})
      },
      ...(input.hostInstitution
        ? { mobilityRecord: { institution: { name: { contains: input.hostInstitution } } } }
        : {}),
      ...(input.mobilityPeriod
        ? {
            OR: [
              { mobilityRecord: { mobilityStart: { lte: new Date(input.mobilityPeriod) }, mobilityEnd: { gte: new Date(input.mobilityPeriod) } } }
            ]
          }
        : {}),
      ...(search
        ? {
            OR: [
              { user: { fullName: { contains: search } } },
              { headline: { contains: search } },
              { interests: { contains: search } },
              { mobilityRecord: { destinationCity: { contains: search } } }
            ]
          }
        : {})
    },
    include: {
      user: true,
      mobilityRecord: { include: { institution: true } },
      visibilitySettings: true,
      consentSettings: true
    },
    orderBy: [{ updatedAt: 'desc' }]
  });

  return profiles.map(redactProfile);
}

async function ensureSocialPair(userId: string, targetProfileId: string, tx: Prisma.TransactionClient | typeof prisma = prisma) {
  const self = await tx.socialSupportProfile.findUnique({
    where: { userId },
    include: { consentSettings: true, mobilityRecord: true }
  });
  assert(!!self, 'Create your social profile before connecting', 400);

  const target = await tx.socialSupportProfile.findUnique({
    where: { id: targetProfileId },
    include: { consentSettings: true, mobilityRecord: true }
  });
  assert(!!target, 'Target profile not found', 404);
  assert(target.userId !== userId, 'Cannot connect with yourself');
  assert(target.discoverable && target.contactable, 'Target profile is not discoverable/contactable', 400);
  assert(target.consentSettings?.discoverabilityConsent && target.consentSettings?.contactabilityConsent, 'Target consent restrictions prevent connection', 400);
  return { self, target };
}

export async function createConnectionRequest(userId: string, targetProfileId: string) {
  await ensureStudentWithMobility(userId);

  return prisma.$transaction(async (tx) => {
    const { self, target } = await ensureSocialPair(userId, targetProfileId, tx);

    const existing = await tx.socialConnection.findFirst({
      where: {
        OR: [
          { requesterUserId: userId, recipientUserId: target.userId },
          { requesterUserId: target.userId, recipientUserId: userId }
        ],
        state: { in: ['pending', 'accepted', 'blocked'] }
      }
    });
    assert(!existing, 'Connection already pending/active or blocked', 400);

    const connection = await tx.socialConnection.create({
      data: {
        id: crypto.randomUUID(),
        requesterProfileId: self.id,
        recipientProfileId: target.id,
        requesterUserId: userId,
        recipientUserId: target.userId,
        state: 'pending'
      }
    });

    await tx.auditRecord.create({
      data: {
        id: crypto.randomUUID(),
        actorId: userId,
        actionType: 'SOCIAL_CONNECTION_REQUESTED',
        targetType: 'SocialConnection',
        targetId: connection.id,
        newState: 'pending',
        outcome: 'SUCCESS'
      }
    });

    return connection;
  });
}

export async function actOnConnection(connectionId: string, userId: string, action: 'accept' | 'reject' | 'cancel' | 'block') {
  await ensureStudentWithMobility(userId);

  return prisma.$transaction(async (tx) => {
    const connection = await tx.socialConnection.findUnique({ where: { id: connectionId }, include: { thread: true } });
    assert(!!connection, 'Connection not found', 404);

    const isRequester = connection.requesterUserId === userId;
    const isRecipient = connection.recipientUserId === userId;
    assert(isRequester || isRecipient, 'Connection is not yours', 403);

    let nextState = connection.state;
    if (action === 'accept') {
      assert(isRecipient, 'Only recipient can accept', 403);
      assert(connection.state === 'pending', 'Only pending can be accepted', 400);
      nextState = 'accepted';
    }
    if (action === 'reject') {
      assert(isRecipient, 'Only recipient can reject', 403);
      assert(connection.state === 'pending', 'Only pending can be rejected', 400);
      nextState = 'rejected';
    }
    if (action === 'cancel') {
      assert(isRequester, 'Only sender can cancel', 403);
      assert(connection.state === 'pending', 'Only pending can be cancelled', 400);
      nextState = 'cancelled';
    }
    if (action === 'block') {
      assert(['pending', 'accepted'].includes(connection.state), 'Only active/pending connections can be blocked', 400);
      nextState = 'blocked';
    }

    const updated = await tx.socialConnection.update({
      where: { id: connection.id },
      data: {
        state: nextState,
        respondedAt: nextState === 'accepted' || nextState === 'rejected' ? new Date() : connection.respondedAt,
        blockedByUserId: action === 'block' ? userId : connection.blockedByUserId,
        closedAt: ['cancelled', 'blocked', 'rejected'].includes(nextState) ? new Date() : null
      }
    });

    if (action === 'accept' && !connection.thread) {
      await tx.messageThread.create({
        data: {
          id: crypto.randomUUID(),
          connectionId: connection.id,
          permissionState: 'permitted'
        }
      });
    }

    if (action === 'block' && connection.thread) {
      await tx.messageThread.update({ where: { id: connection.thread.id }, data: { permissionState: 'blocked' } });
    }

    if (['cancel', 'reject'].includes(action) && connection.thread) {
      await tx.messageThread.update({ where: { id: connection.thread.id }, data: { permissionState: 'expired_or_closed_retained' } });
    }

    await tx.auditRecord.create({
      data: {
        id: crypto.randomUUID(),
        actorId: userId,
        actionType: `SOCIAL_CONNECTION_${action.toUpperCase()}`,
        targetType: 'SocialConnection',
        targetId: connection.id,
        priorState: connection.state,
        newState: nextState,
        outcome: 'SUCCESS'
      }
    });

    return updated;
  });
}

export async function listConnections(userId: string) {
  await ensureStudentWithMobility(userId);
  return prisma.socialConnection.findMany({
    where: { OR: [{ requesterUserId: userId }, { recipientUserId: userId }] },
    include: {
      requesterUser: true,
      recipientUser: true,
      requesterProfile: true,
      recipientProfile: true,
      thread: true
    },
    orderBy: [{ initiatedAt: 'desc' }]
  });
}

async function assertMessagePermission(connectionId: string, userId: string, tx: Prisma.TransactionClient | typeof prisma = prisma) {
  const connection = await tx.socialConnection.findUnique({
    where: { id: connectionId },
    include: { thread: true }
  });
  assert(!!connection, 'Connection not found', 404);
  assert(connection.requesterUserId === userId || connection.recipientUserId === userId, 'Connection is not yours', 403);
  assert(connection.state === 'accepted', 'Messaging is only allowed for accepted connections', 403);
  assert(connection.state !== 'blocked', 'Blocked connections cannot message', 403);
  assert(connection.thread?.permissionState === 'permitted', 'Messaging permission is not active', 403);
  return connection;
}

export async function sendMessage(input: { userId: string; connectionId: string; messageText: string }) {
  await ensureStudentWithMobility(input.userId);

  return prisma.$transaction(async (tx) => {
    const connection = await assertMessagePermission(input.connectionId, input.userId, tx);
    const message = await tx.message.create({
      data: {
        id: crypto.randomUUID(),
        threadId: connection.thread!.id,
        senderUserId: input.userId,
        messageText: input.messageText.trim()
      }
    });

    await tx.auditRecord.create({
      data: {
        id: crypto.randomUUID(),
        actorId: input.userId,
        actionType: 'SOCIAL_MESSAGE_SENT',
        targetType: 'MessageThread',
        targetId: connection.thread!.id,
        outcome: 'SUCCESS'
      }
    });

    return message;
  });
}

export async function listMessages(userId: string, connectionId: string) {
  await ensureStudentWithMobility(userId);
  const connection = await assertMessagePermission(connectionId, userId);
  return prisma.message.findMany({
    where: { threadId: connection.thread!.id },
    include: { sender: true },
    orderBy: [{ sentAt: 'asc' }]
  });
}
