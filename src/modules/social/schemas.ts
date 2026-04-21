import { z } from 'zod';

export const socialProfileSchema = z.object({
  userId: z.string().min(1),
  mobilityRecordId: z.string().min(1),
  headline: z.string().max(120).optional().nullable(),
  bio: z.string().max(600).optional().nullable(),
  languages: z.string().max(200).optional().nullable(),
  interests: z.string().max(300).optional().nullable(),
  discoverable: z.boolean(),
  contactable: z.boolean(),
  discoverabilityConsent: z.boolean(),
  contactabilityConsent: z.boolean(),
  visibility: z.object({
    showHeadline: z.boolean(),
    showBio: z.boolean(),
    showLanguages: z.boolean(),
    showInterests: z.boolean(),
    showDestination: z.boolean(),
    showHostInstitution: z.boolean(),
    showCity: z.boolean(),
    showMobilityPeriod: z.boolean(),
    showMobilityStage: z.boolean(),
    directContactExposed: z.boolean()
  })
});

export const discoveryQuerySchema = z.object({
  userId: z.string().min(1),
  search: z.string().optional(),
  destination: z.string().optional(),
  hostInstitution: z.string().optional(),
  city: z.string().optional(),
  mobilityStage: z.string().optional(),
  mobilityPeriod: z
    .string()
    .min(1)
    .refine((val) => !isNaN(Date.parse(val)), { message: 'mobilityPeriod must be a valid date (YYYY-MM-DD)' })
    .optional()
});

export const createConnectionSchema = z.object({
  userId: z.string().min(1),
  targetProfileId: z.string().min(1)
});

export const connectionActionSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(['accept', 'reject', 'cancel', 'block'])
});

export const sendMessageSchema = z.object({
  userId: z.string().min(1),
  connectionId: z.string().min(1),
  messageText: z.string().min(1).max(1000)
});

const contentKind = z.enum(['recommendation', 'tip', 'review', 'opinion']);
const topicCategory = z.enum(['accommodation', 'transport', 'bureaucracy', 'academics', 'daily_living']);

export const createSocialContentSchema = z.object({
  userId: z.string().min(1),
  kind: contentKind,
  title: z.string().min(3).max(120),
  body: z.string().min(10).max(2000),
  rating: z.number().int().min(1).max(5).optional(),
  destinationCity: z.string().min(2).max(80),
  topicCategory,
  placeContextId: z.string().min(1).optional().nullable()
});

export const updateSocialContentSchema = createSocialContentSchema
  .omit({ userId: true, kind: true })
  .extend({ userId: z.string().min(1), contentId: z.string().min(1) });

export const deleteSocialContentSchema = z.object({
  userId: z.string().min(1),
  contentId: z.string().min(1)
});

export const socialContentQuerySchema = z.object({
  userId: z.string().min(1),
  kind: contentKind.optional(),
  destinationCity: z.string().optional(),
  topicCategory: topicCategory.optional(),
  minRating: z.coerce.number().int().min(1).max(5).optional(),
  search: z.string().optional(),
  mineOnly: z
    .string()
    .optional()
    .transform((val) => val === 'true')
});

export const favoriteSchema = z.object({
  userId: z.string().min(1),
  contentId: z.string().min(1)
});

export const reportContentSchema = z.object({
  userId: z.string().min(1),
  targetType: contentKind,
  targetContentId: z.string().min(1),
  reportReason: z.string().min(3).max(200),
  reportDetails: z.string().max(1000).optional().nullable()
});

export const moderationQueueQuerySchema = z.object({
  userId: z.string().min(1),
  state: z
    .enum([
      'reported',
      'threshold_hidden_pending_review',
      'in_review',
      'resolved_hidden',
      'resolved_removed',
      'resolved_restricted',
      'cleared'
    ])
    .optional()
});

export const moderationActionSchema = z.object({
  userId: z.string().min(1),
  caseId: z.string().min(1),
  action: z.enum(['hide', 'remove', 'restrict', 'maintain_visible', 'clear']),
  outcomeSummary: z.string().min(3).max(500)
});

export const socialMapQuerySchema = z.object({
  userId: z.string().min(1),
  city: z.string().optional(),
  category: z.enum(['university_area', 'student_housing_zone', 'transport_hub', 'civic_office', 'daily_living_area']).optional(),
  contentType: contentKind.optional(),
  destination: z.string().optional(),
  minRating: z.coerce.number().int().min(1).max(5).optional(),
  search: z.string().optional()
});

export const socialMapReportSchema = z.object({
  userId: z.string().min(1),
  reportReason: z.string().min(3).max(200),
  reportDetails: z.string().max(1000).optional().nullable()
});
