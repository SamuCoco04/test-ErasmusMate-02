import { z } from 'zod';

export const createDraftSchema = z.object({
  userId: z.string().min(1),
  mobilityRecordId: z.string().min(1),
  procedureDefinitionId: z.string().min(1)
});

export const transitionSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(['submit', 'start_review', 'approve', 'reject', 'reopen', 'resubmit']),
  rationale: z.string().max(500).optional()
});
