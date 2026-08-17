import { PrismaClient } from '@prisma/client';

// Single Prisma client per process
export const prisma = new PrismaClient();
