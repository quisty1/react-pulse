import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

/** Walks up the directory tree looking for .env (up to 6 levels) */
function findEnvFile(startDir: string) {
  let current = startDir;
  for (let i = 0; i < 6; i += 1) {
    const candidate = resolve(current, '.env');
    if (existsSync(candidate)) return candidate;
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}

/** Loads .env from the monorepo root before Zod/Prisma validation */
export function loadDotenv() {
  const fromMeta = fileURLToPath(import.meta.url);
  const envPath =
    findEnvFile(process.cwd()) ??
    findEnvFile(dirname(fromMeta)) ??
    findEnvFile(resolve(dirname(fromMeta), '../../..'));

  if (envPath) {
    // Do not overwrite existing process.env (override: false)
    config({ path: envPath, override: false });
  }
}
