import { z } from 'zod';

/** Создание DM/группы: 1–8 участников, name только для GROUP */

export const createConversationSchema = z.object({
  memberIds: z.array(z.string().cuid()).min(1).max(8),
  name: z.string().trim().min(1).max(80).optional(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
