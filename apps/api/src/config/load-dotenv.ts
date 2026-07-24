import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

/** Ищет .env вверх по дереву каталогов (до 6 уровней) */
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

/** Загружает .env из корня монорепо до Zod/Prisma-валидации */
export function loadDotenv() {
  const fromMeta = fileURLToPath(import.meta.url);
  const envPath =
    findEnvFile(process.cwd()) ??
    findEnvFile(dirname(fromMeta)) ??
    findEnvFile(resolve(dirname(fromMeta), '../../..'));

  if (envPath) {
    // Не перезаписываем уже заданные process.env (override: false)
    config({ path: envPath, override: false });
  }
}
