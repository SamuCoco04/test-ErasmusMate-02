import { z } from 'zod';

export const agreementStateSchema = z.enum([
  'DRAFT',
  'SUBMITTED',
  'IN_REVIEW',
  'PARTIALLY_APPROVED',
  'CHANGES_REQUESTED',
  'ACCEPTED'
]);

export const rowDecisionSchema = z.enum(['APPROVED', 'DENIED']);

const rowInputSchema = z.object({
  homeCourseCode: z.string().trim().min(1).max(50),
  homeCourseName: z.string().trim().min(1).max(200),
  destinationCourseCode: z.string().trim().min(1).max(50),
  destinationCourseName: z.string().trim().min(1).max(200),
  ects: z.number().gt(0).max(60),
  semester: z.string().trim().min(1).max(50),
  grade: z.string().trim().max(20).nullable().optional()
});

export const createAgreementSchema = z.object({
  userId: z.string().min(1),
  mobilityRecordId: z.string().min(1)
});

export const addRowSchema = z.object({
  userId: z.string().min(1),
  row: rowInputSchema
});

export const updateRowSchema = z.object({
  userId: z.string().min(1),
  row: rowInputSchema
});

export const removeRowSchema = z.object({
  userId: z.string().min(1)
});

export const transitionAgreementSchema = z.object({
  userId: z.string().min(1)
});

export const decideRowSchema = z.object({
  userId: z.string().min(1),
  decision: rowDecisionSchema,
  rationale: z.string().trim().max(1000).optional()
});
