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
    showDestination: boolean;
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
    destinationCity: visibility?.showDestination && visibility?.showCity ? profile.mobilityRecord.destinationCity : null,
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
        ...(input.mobilityStage ? { mobilityPhase: input.mobilityStage } : {}),
        ...(input.hostInstitution ? { institution: { name: { contains: input.hostInstitution } } } : {}),
        ...(input.mobilityPeriod
          ? { mobilityStart: { lte: new Date(input.mobilityPeriod) }, mobilityEnd: { gte: new Date(input.mobilityPeriod) } }
          : {})
      },
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
  assert(
    Boolean(target.consentSettings?.discoverabilityConsent && target.consentSettings?.contactabilityConsent),
    'Target consent restrictions prevent connection',
    400
  );
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
  assert(connection.thread?.permissionState === 'permitted', 'Messaging permission is not active', 403);
  return connection;
}

export async function sendMessage(input: { userId: string; connectionId: string; messageText: string }) {
  await ensureStudentWithMobility(input.userId);

  return prisma.$transaction(async (tx) => {
    const connection = await assertMessagePermission(input.connectionId, input.userId, tx);
    const trimmedText = input.messageText.trim();
    assert(trimmedText.length > 0, 'Message text cannot be empty or whitespace only', 400);
    const message = await tx.message.create({
      data: {
        id: crypto.randomUUID(),
        threadId: connection.thread!.id,
        senderUserId: input.userId,
        messageText: trimmedText
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

const REPORT_THRESHOLD = Number(process.env.SOCIAL_REPORT_THRESHOLD ?? 3);

async function ensureAdministrator(userId: string, tx: Prisma.TransactionClient | typeof prisma = prisma) {
  const user = await tx.userAccount.findUnique({ where: { id: userId } });
  assert(!!user, 'User not found', 404);
  assert(user.role === 'ADMINISTRATOR', 'Moderation access is restricted to administrators', 403);
  return user;
}

async function ensureAccessibleContentForStudent(userId: string, contentId: string, tx: Prisma.TransactionClient | typeof prisma = prisma) {
  await ensureStudentWithMobility(userId, tx);
  const content = await tx.socialContent.findUnique({
    where: { id: contentId },
    include: { placeContext: true, author: true }
  });
  assert(!!content, 'Social content not found', 404);

  const isAuthor = content.authorId === userId;
  const accessible =
    isAuthor ||
    (['published_visible', 'updated_visible'].includes(content.state) && content.moderationState === 'VISIBLE');
  assert(accessible, 'Content is not accessible under current visibility/moderation rules', 403);
  return content;
}

function assertContentScope(input: { kind: string; body: string; title: string; destinationCity: string; topicCategory: string }) {
  const text = `${input.title} ${input.body}`.toLowerCase();
  const disallowed = ['crypto trading', 'nightclub promoter', 'sports betting'];
  assert(!disallowed.some((term) => text.includes(term)), 'Content must remain Erasmus-relevant', 400);
  assert(input.destinationCity.trim().length > 1, 'Destination/city context is required', 400);
  assert(['accommodation', 'transport', 'bureaucracy', 'academics', 'daily_living'].includes(input.topicCategory), 'Unsupported topic category', 400);
  if (['review', 'opinion'].includes(input.kind)) {
    // rating validation is performed in zod and API layer.
  }
}

export async function listSocialContent(input: {
  userId: string;
  kind?: 'recommendation' | 'tip' | 'review' | 'opinion';
  destinationCity?: string;
  topicCategory?: 'accommodation' | 'transport' | 'bureaucracy' | 'academics' | 'daily_living';
  minRating?: number;
  search?: string;
  mineOnly?: boolean;
}) {
  await ensureStudentWithMobility(input.userId);

  const where: Prisma.SocialContentWhereInput = {
    ...(input.mineOnly
      ? { authorId: input.userId, state: { not: 'removed' } }
      : {
          state: { in: ['published_visible', 'updated_visible'] },
          moderationState: 'VISIBLE'
        }),
    ...(input.kind ? { kind: input.kind } : {}),
    ...(input.destinationCity ? { destinationCity: { contains: input.destinationCity } } : {}),
    ...(input.topicCategory ? { topicCategory: input.topicCategory } : {}),
    ...(input.minRating ? { rating: { gte: input.minRating } } : {}),
    ...(input.search
      ? {
          OR: [{ title: { contains: input.search } }, { body: { contains: input.search } }, { destinationCity: { contains: input.search } }]
        }
      : {})
  };

  const content = await prisma.socialContent.findMany({
    where,
    include: {
      author: true,
      placeContext: true,
      favorites: { where: { userId: input.userId } }
    },
    orderBy: [{ updatedAt: 'desc' }]
  });

  return content.map((item) => ({
    ...item,
    isFavorited: item.favorites.length > 0
  }));
}

export async function createSocialContent(input: {
  userId: string;
  kind: 'recommendation' | 'tip' | 'review' | 'opinion';
  title: string;
  body: string;
  rating?: number;
  destinationCity: string;
  topicCategory: 'accommodation' | 'transport' | 'bureaucracy' | 'academics' | 'daily_living';
  placeContextId?: string | null;
}) {
  const { mobility } = await ensureStudentWithMobility(input.userId);
  const profile = await getOrCreateSocialProfile(input.userId);
  assert(profile.profileState !== 'consent_revoked_or_restricted', 'Consent restrictions block content publishing', 403);
  assertContentScope(input);
  if (['review', 'opinion'].includes(input.kind)) assert(!!input.rating, 'Reviews/opinions require rating', 400);
  if (['recommendation', 'tip'].includes(input.kind)) assert(!input.rating, 'Recommendations/tips do not support rating', 400);

  if (input.placeContextId) {
    const place = await prisma.placeContext.findUnique({ where: { id: input.placeContextId } });
    assert(!!place && place.isPublic, 'Place context must reference a public Erasmus-relevant place', 400);
  }

  return prisma.$transaction(async (tx) => {
    const created = await tx.socialContent.create({
      data: {
        id: crypto.randomUUID(),
        authorId: input.userId,
        authorProfileId: profile.id,
        kind: input.kind,
        title: input.title.trim(),
        body: input.body.trim(),
        rating: input.rating ?? null,
        destinationCity: input.destinationCity.trim() || mobility.destinationCity,
        topicCategory: input.topicCategory,
        placeContextId: input.placeContextId ?? null,
        state: 'published_visible',
        moderationState: 'VISIBLE'
      }
    });
    await tx.auditRecord.create({
      data: {
        id: crypto.randomUUID(),
        actorId: input.userId,
        actionType: 'SOCIAL_CONTENT_CREATED',
        targetType: 'SocialContent',
        targetId: created.id,
        newState: created.state,
        outcome: 'SUCCESS'
      }
    });
    return created;
  });
}

export async function updateSocialContent(input: {
  userId: string;
  contentId: string;
  title: string;
  body: string;
  rating?: number;
  destinationCity: string;
  topicCategory: 'accommodation' | 'transport' | 'bureaucracy' | 'academics' | 'daily_living';
  placeContextId?: string | null;
}) {
  await ensureStudentWithMobility(input.userId);
  const current = await prisma.socialContent.findUnique({ where: { id: input.contentId } });
  assert(!!current, 'Social content not found', 404);
  assert(current.authorId === input.userId, 'Only the author can edit content', 403);
  assert(!['removed', 'hidden_or_restricted'].includes(current.state), 'Content is locked by moderation/retention state', 400);
  assert(current.moderationState !== 'REMOVED', 'Removed content cannot be edited', 400);
  assertContentScope({ ...input, kind: current.kind });

  if (input.placeContextId) {
    const place = await prisma.placeContext.findUnique({ where: { id: input.placeContextId } });
    assert(!!place && place.isPublic, 'Place context must reference a public Erasmus-relevant place', 400);
  }

  const updated = await prisma.socialContent.update({
    where: { id: input.contentId },
    data: {
      title: input.title.trim(),
      body: input.body.trim(),
      rating: current.kind === 'review' || current.kind === 'opinion' ? (input.rating ?? null) : null,
      destinationCity: input.destinationCity.trim(),
      topicCategory: input.topicCategory,
      placeContextId: input.placeContextId ?? null,
      state: 'updated_visible'
    }
  });
  await prisma.auditRecord.create({
    data: {
      id: crypto.randomUUID(),
      actorId: input.userId,
      actionType: 'SOCIAL_CONTENT_UPDATED',
      targetType: 'SocialContent',
      targetId: updated.id,
      priorState: current.state,
      newState: updated.state,
      outcome: 'SUCCESS'
    }
  });
  return updated;
}

export async function deleteSocialContent(userId: string, contentId: string) {
  await ensureStudentWithMobility(userId);
  const current = await prisma.socialContent.findUnique({ where: { id: contentId } });
  assert(!!current, 'Social content not found', 404);
  assert(current.authorId === userId, 'Only the author can delete content', 403);
  assert(!['REMOVED', 'RESTRICTED', 'HIDDEN'].includes(current.moderationState), 'Content is locked by moderation outcome', 400);

  const updated = await prisma.socialContent.update({
    where: { id: contentId },
    data: { state: 'author_deleted' }
  });
  await prisma.auditRecord.create({
    data: {
      id: crypto.randomUUID(),
      actorId: userId,
      actionType: 'SOCIAL_CONTENT_DELETED_BY_AUTHOR',
      targetType: 'SocialContent',
      targetId: updated.id,
      priorState: current.state,
      newState: updated.state,
      outcome: 'SUCCESS'
    }
  });
  return updated;
}

export async function listPlaceContexts(userId: string) {
  await ensureStudentWithMobility(userId);
  return prisma.placeContext.findMany({ where: { isPublic: true }, orderBy: [{ city: 'asc' }, { label: 'asc' }] });
}

export async function setFavorite(userId: string, contentId: string, favorited: boolean) {
  await ensureAccessibleContentForStudent(userId, contentId);

  if (favorited) {
    const favorite = await prisma.socialFavorite.upsert({
      where: { userId_socialContentId: { userId, socialContentId: contentId } },
      create: { id: crypto.randomUUID(), userId, socialContentId: contentId },
      update: {}
    });
    return favorite;
  }
  await prisma.socialFavorite.deleteMany({ where: { userId, socialContentId: contentId } });
  return { userId, socialContentId: contentId, removed: true };
}

export async function listFavorites(userId: string) {
  await ensureStudentWithMobility(userId);
  return prisma.socialFavorite.findMany({
    where: { userId, socialContent: { state: { in: ['published_visible', 'updated_visible'] }, moderationState: 'VISIBLE' } },
    include: { socialContent: { include: { author: true, placeContext: true } } },
    orderBy: [{ createdAt: 'desc' }]
  });
}

export async function reportSocialContent(input: {
  userId: string;
  targetType: 'recommendation' | 'tip' | 'review' | 'opinion';
  targetContentId: string;
  reportReason: string;
  reportDetails?: string | null;
}) {
  await ensureStudentWithMobility(input.userId);

  return prisma.$transaction(async (tx) => {
    const content = await tx.socialContent.findUnique({ where: { id: input.targetContentId } });
    assert(!!content, 'Reported content not found', 404);
    assert(content.kind === input.targetType, 'Report target type mismatch', 400);

    const duplicate = await tx.moderationReport.findFirst({
      where: { reporterId: input.userId, targetContentId: content.id, state: { in: ['reported', 'in_review'] } }
    });
    assert(!duplicate, 'You already have an active report for this content', 400);

    let moderationCase = await tx.moderationCase.findFirst({
      where: { targetType: content.kind, targetContentId: content.id, caseState: { in: ['reported', 'threshold_hidden_pending_review', 'in_review'] } }
    });

    if (!moderationCase) {
      moderationCase = await tx.moderationCase.create({
        data: {
          id: crypto.randomUUID(),
          targetType: content.kind,
          targetContentId: content.id,
          caseState: 'reported'
        }
      });
    }

    const report = await tx.moderationReport.create({
      data: {
        id: crypto.randomUUID(),
        reporterId: input.userId,
        targetType: input.targetType,
        targetContentId: input.targetContentId,
        reportReason: input.reportReason.trim(),
        reportDetails: input.reportDetails?.trim() || null,
        moderationCaseId: moderationCase.id,
        state: 'reported'
      }
    });

    const reportCount = await tx.moderationReport.count({
      where: { targetContentId: content.id, state: { in: ['reported', 'in_review'] } }
    });

    const reachedThreshold = reportCount >= REPORT_THRESHOLD;
    await tx.socialContent.update({
      where: { id: content.id },
      data: {
        reportCount,
        moderationState: reachedThreshold ? 'THRESHOLD_HIDDEN' : content.moderationState,
        state: reachedThreshold ? 'hidden_or_restricted' : content.state
      }
    });

    if (reachedThreshold) {
      await tx.moderationCase.update({
        where: { id: moderationCase.id },
        data: { caseState: 'threshold_hidden_pending_review', thresholdTriggered: true }
      });
    }

    await tx.auditRecord.create({
      data: {
        id: crypto.randomUUID(),
        actorId: input.userId,
        actionType: 'SOCIAL_CONTENT_REPORTED',
        targetType: 'ModerationReport',
        targetId: report.id,
        newState: reachedThreshold ? 'threshold_hidden_pending_review' : 'reported',
        outcome: 'SUCCESS'
      }
    });

    return { report, thresholdTriggered: reachedThreshold, threshold: REPORT_THRESHOLD, activeReportCount: reportCount };
  });
}

export async function listModerationQueue(input: { userId: string; state?: string }) {
  await ensureAdministrator(input.userId);
  return prisma.moderationCase.findMany({
    where: input.state ? { caseState: input.state } : {},
    include: {
      targetContent: { include: { author: true, placeContext: true } },
      reports: { include: { reporter: true }, orderBy: [{ reportedAt: 'desc' }] },
      moderator: true
    },
    orderBy: [{ updatedAt: 'desc' }]
  });
}

export async function applyModerationAction(input: {
  userId: string;
  caseId: string;
  action: 'hide' | 'remove' | 'restrict' | 'maintain_visible' | 'clear';
  outcomeSummary: string;
}) {
  await ensureAdministrator(input.userId);
  return prisma.$transaction(async (tx) => {
    const moderationCase = await tx.moderationCase.findUnique({ where: { id: input.caseId }, include: { reports: true } });
    assert(!!moderationCase, 'Moderation case not found', 404);

    if (moderationCase.targetContentId) {
      const nextContentStateByAction: Record<typeof input.action, { moderationState: string; state: string; caseState: string }> = {
        hide: { moderationState: 'HIDDEN', state: 'hidden_or_restricted', caseState: 'resolved_hidden' },
        remove: { moderationState: 'REMOVED', state: 'removed', caseState: 'resolved_removed' },
        restrict: { moderationState: 'RESTRICTED', state: 'hidden_or_restricted', caseState: 'resolved_restricted' },
        maintain_visible: { moderationState: 'VISIBLE', state: 'updated_visible', caseState: 'cleared' },
        clear: { moderationState: 'VISIBLE', state: 'updated_visible', caseState: 'cleared' }
      };
      const transition = nextContentStateByAction[input.action];

      await tx.socialContent.update({
        where: { id: moderationCase.targetContentId },
        data: {
          moderationState: transition.moderationState,
          state: transition.state,
          reportCount: 0
        }
      });

      await tx.moderationCase.update({
        where: { id: moderationCase.id },
        data: {
          caseState: transition.caseState,
          moderationAction: input.action,
          outcomeSummary: input.outcomeSummary.trim(),
          moderatorId: input.userId,
          resolvedAt: new Date()
        }
      });
    } else {
      await tx.moderationCase.update({
        where: { id: moderationCase.id },
        data: {
          caseState: input.action === 'clear' || input.action === 'maintain_visible' ? 'cleared' : 'resolved_restricted',
          moderationAction: input.action,
          outcomeSummary: input.outcomeSummary.trim(),
          moderatorId: input.userId,
          resolvedAt: new Date()
        }
      });
    }

    await tx.moderationReport.updateMany({
      where: { moderationCaseId: moderationCase.id, state: { in: ['reported', 'in_review'] } },
      data: { state: 'resolved', reviewedAt: new Date() }
    });

    await tx.auditRecord.create({
      data: {
        id: crypto.randomUUID(),
        actorId: input.userId,
        actionType: 'SOCIAL_MODERATION_ACTION_APPLIED',
        targetType: 'ModerationCase',
        targetId: moderationCase.id,
        newState: input.action,
        outcome: 'SUCCESS',
        metadataJson: JSON.stringify({ outcomeSummary: input.outcomeSummary })
      }
    });

    return tx.moderationCase.findUniqueOrThrow({
      where: { id: moderationCase.id },
      include: {
        targetContent: true,
        reports: true,
        moderator: true
      }
    });
  });
}
