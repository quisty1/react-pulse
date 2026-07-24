import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { Router } from 'express';
import multer from 'multer';
import { ALLOWED_MIME_TYPES } from '@pulse/shared';
import type { Env } from '../../config/env.js';
import { badRequest, forbidden, notFound } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
  'text/plain': '.txt',
  'application/zip': '.zip',
};

export function createFilesRouter(env: Env) {
  const router = Router();
  const uploadDir = env.UPLOAD_DIR;
  if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
  });

  router.post('/files', authenticate(env), upload.single('file'), async (req, res, next) => {
    try {
      const file = req.file;
      if (!file) throw badRequest('File is required');
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_MIME_TYPES)[number])) {
        throw badRequest('Unsupported file type');
      }

      const ext = EXT_BY_MIME[file.mimetype] ?? extname(file.originalname).toLowerCase();
      const storageName = `${randomUUID()}${ext}`;
      const storagePath = join(uploadDir, storageName);
      await pipeline(
        (await import('node:stream')).Readable.from(file.buffer),
        createWriteStream(storagePath),
      );

      const attachment = await prisma.attachment.create({
        data: {
          uploaderId: req.user!.sub,
          fileName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          storagePath,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          id: attachment.id,
          fileName: attachment.fileName,
          mimeType: attachment.mimeType,
          size: attachment.size,
          url: `/api/files/${attachment.id}`,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/users/me/avatar',
    authenticate(env),
    upload.single('file'),
    async (req, res, next) => {
      try {
        const file = req.file;
        if (!file) throw badRequest('File is required');
        if (!file.mimetype.startsWith('image/')) throw badRequest('Avatar must be an image');

        const ext = EXT_BY_MIME[file.mimetype] ?? '.png';
        const storageName = `avatar-${req.user!.sub}${ext}`;
        const storagePath = join(uploadDir, storageName);
        await pipeline(
          (await import('node:stream')).Readable.from(file.buffer),
          createWriteStream(storagePath),
        );

        const avatarUrl = `/api/files/avatar/${req.user!.sub}${ext}`;
        const user = await prisma.user.update({
          where: { id: req.user!.sub },
          data: { avatarUrl },
        });

        res.json({
          success: true,
          data: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            statusMessage: user.statusMessage,
            createdAt: user.createdAt.toISOString(),
          },
        });
      } catch (err) {
        next(err);
      }
    },
  );

  router.get('/files/avatar/:name', async (req, res, next) => {
    try {
      const name = String(req.params.name);
      const filePath = join(uploadDir, name.startsWith('avatar-') ? name : `avatar-${name}`);
      if (!existsSync(filePath)) throw notFound('Avatar not found');
      res.sendFile(filePath);
    } catch (err) {
      next(err);
    }
  });

  router.get('/files/:id', authenticate(env), async (req, res, next) => {
    try {
      const attachment = await prisma.attachment.findUnique({
        where: { id: String(req.params.id) },
      });
      if (!attachment) throw notFound('File not found');

      if (attachment.messageId) {
        const message = await prisma.message.findUnique({ where: { id: attachment.messageId } });
        if (!message) throw notFound('File not found');
      } else if (attachment.uploaderId !== req.user!.sub) {
        throw forbidden();
      }

      res.download(attachment.storagePath, attachment.fileName);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
