import { z } from 'zod';

/** Message search: text plus optional filters and cursor */

export const searchMessagesSchema = z.object({
  q: z.string().trim().min(1).max(200),
  channelId: z.string().cuid().optional(),
  userId: z.string().cuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type SearchMessagesInput = z.infer<typeof searchMessagesSchema>;
