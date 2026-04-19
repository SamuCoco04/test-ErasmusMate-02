import { z } from 'zod';
import { exceptionActions } from './types';

export const createExceptionSchema = z
  .object({
    userId: z.string().min(1),
    mobilityRecordId: z.string().min(1),
    scopeType: z.enum(['DEADLINE', 'DOCUMENT', 'PROCEDURE']),
    scopeRefId: z.string().optional(),
    reason: z.string().min(10).max(1000)
  })
  .superRefine((data, ctx) => {
    if (data.scopeType === 'DEADLINE' && !data.scopeRefId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['scopeRefId'],
        message: 'scopeRefId is required when scopeType is DEADLINE'
      });
    }
  });

export const exceptionDecisionSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(exceptionActions),
  rationale: z.string().max(1000).optional()
});
