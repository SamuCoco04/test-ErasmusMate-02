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
