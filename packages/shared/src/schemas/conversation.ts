import { z } from 'zod';

/** Create DM/group: 1–8 members; name only for GROUP */

export const createConversationSchema = z.object({
  memberIds: z.array(z.string().cuid()).min(1).max(8),
  name: z.string().trim().min(1).max(80).optional(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
