// Локальный Postgres без Docker: данные в .data/pg у корня монорепо
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import EmbeddedPostgres from 'embedded-postgres';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const databaseDir = resolve(root, '.data/pg');
mkdirSync(databaseDir, { recursive: true });

const port = Number(process.env.PG_PORT ?? 5432);
const user = process.env.POSTGRES_USER ?? 'pulse';
const password = process.env.POSTGRES_PASSWORD ?? 'pulse';
const database = process.env.POSTGRES_DB ?? 'pulse';

const pg = new EmbeddedPostgres({
  databaseDir,
  user,
  password,
  port,
  persistent: true,
  // UTF-8, чтобы кириллица в сообщениях не ломалась
  initdbFlags: ['--encoding=UTF8', '--locale=C'],
  onLog: (message) => {
    process.stdout.write(`[pg] ${message}`);
  },
  onError: (message) => {
    process.stderr.write(`[pg:error] ${message}`);
  },
});

async function main() {
  console.log(`Starting embedded PostgreSQL in ${databaseDir} on :${port}`);
  await pg.initialise();
  await pg.start();

  try {
    await pg.createDatabase(database);
    console.log(`Database "${database}" ready`);
  } catch {
    console.log(`Database "${database}" already exists`);
  }

  console.log('Embedded Postgres is running. Keep this terminal open.');
  console.log(
    `DATABASE_URL=postgresql://${user}:${password}@localhost:${port}/${database}?schema=public`,
  );
  console.log('Next: pnpm db:push && pnpm db:seed && pnpm dev');

  const stop = async () => {
    console.log('\nStopping embedded PostgreSQL…');
    await pg.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => {
    void stop();
  });
  process.on('SIGTERM', () => {
    void stop();
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
