import { z } from 'zod';

/** Zod-схемы сообщений, реакций и cursor-пагинации */

export const createMessageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
  parentId: z.string().cuid().optional(),
  // UUID с клиента для идемпотентности
  clientId: z.string().uuid().optional(),
  mentionedUserIds: z.array(z.string().cuid()).max(20).optional(),
  attachmentIds: z.array(z.string().cuid()).max(10).optional(),
});

export const updateMessageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export const reactionSchema = z.object({
  emoji: z.string().trim().min(1).max(32),
});

export const messageCursorSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  // null — корневой канал/DM, cuid — тред
  parentId: z.string().cuid().optional().nullable(),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;
export type ReactionInput = z.infer<typeof reactionSchema>;
