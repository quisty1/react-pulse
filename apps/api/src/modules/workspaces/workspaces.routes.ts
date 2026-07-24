import { Router } from 'express';
import {
  createWorkspaceSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  updateWorkspaceSchema,
} from '@pulse/shared';
import type { Env } from '../../config/env.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { WorkspaceService } from './workspaces.service.js';

export function createWorkspacesRouter(env: Env) {
  const router = Router();
  const service = new WorkspaceService();

  router.use(authenticate(env));

  router.post('/invites/:token/accept', async (req, res, next) => {
    try {
      const data = await service.acceptInvite(req.user!.sub, String(req.params.token));
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  });

  router.get('/', async (req, res, next) => {
    try {
      const data = await service.listForUser(req.user!.sub);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  });

  router.post('/', validate(createWorkspaceSchema), async (req, res, next) => {
    try {
      const data = await service.create(req.user!.sub, req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  });

  router.get('/:workspaceId', async (req, res, next) => {
    try {
      const data = await service.get(req.user!.sub, String(req.params.workspaceId));
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:workspaceId', validate(updateWorkspaceSchema), async (req, res, next) => {
    try {
      const data = await service.update(req.user!.sub, String(req.params.workspaceId), req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  });

  router.get('/:workspaceId/members', async (req, res, next) => {
    try {
      const data = await service.listMembers(req.user!.sub, String(req.params.workspaceId));
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  });

  router.post('/:workspaceId/invites', validate(inviteMemberSchema), async (req, res, next) => {
    try {
      const data = await service.createInvite(
        req.user!.sub,
        String(req.params.workspaceId),
        req.body,
      );
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  });

  router.patch(
    '/:workspaceId/members/:memberId',
    validate(updateMemberRoleSchema),
    async (req, res, next) => {
      try {
        const data = await service.updateMemberRole(
          req.user!.sub,
          String(req.params.workspaceId),
          String(req.params.memberId),
          req.body.role,
        );
        res.json({ success: true, data });
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete('/:workspaceId/members/:memberId', async (req, res, next) => {
    try {
      const data = await service.removeMember(
        req.user!.sub,
        String(req.params.workspaceId),
        String(req.params.memberId),
      );
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  });

  router.post('/:workspaceId/leave', async (req, res, next) => {
    try {
      const data = await service.leave(req.user!.sub, String(req.params.workspaceId));
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
