import { PrismaClient } from '@prisma/client';

// Единый Prisma-клиент на процесс
export const prisma = new PrismaClient();
