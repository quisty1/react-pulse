import { z } from 'zod';
import { WORKSPACE_ROLES } from '../constants.js';

/** Zod-схемы workspace: создание, инвайт, смена роли */

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2).max(64),
  // Если slug не передан — генерируется на сервере
  slug: z
    .string()
    .trim()
    .min(2)
    .max(48)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().trim().min(2).max(64).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email().optional(),
  role: z.enum(WORKSPACE_ROLES).default('MEMBER'),
});

// OWNER через эту схему не назначают
export const updateMemberRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
