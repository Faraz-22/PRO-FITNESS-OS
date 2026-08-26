import { z } from 'zod';

export const updateBranchSchema = z.object({
  name: z.string().min(2, 'Branch name must be at least 2 characters'),
  code: z.string().min(2, 'Code must be at least 2 characters'),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  timezone: z.string().min(2, 'Timezone is required')
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().nullable().optional()
});

export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
