import { z } from 'zod';
import { CHANNEL_TYPES } from '../constants.js';

/** Zod-схемы channel: имя в lowercase, PUBLIC/PRIVATE */

export const createChannelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-_]+$/, 'Channel name must be lowercase alphanumeric with - or _'),
  type: z.enum(CHANNEL_TYPES).default('PUBLIC'),
  topic: z.string().trim().max(250).optional(),
  description: z.string().trim().max(1000).optional(),
});

export const updateChannelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-_]+$/)
    .optional(),
  topic: z.string().trim().max(250).optional().nullable(),
  description: z.string().trim().max(1000).optional().nullable(),
});

export type CreateChannelInput = z.infer<typeof createChannelSchema>;
export type UpdateChannelInput = z.infer<typeof updateChannelSchema>;
