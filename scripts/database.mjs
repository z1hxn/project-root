import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
const databaseDir = resolve('.data/postgres');
const pg = new EmbeddedPostgres({
  databaseDir,
  user: 'root',
  password: process.env.LOCAL_DB_PASSWORD || 'root_local_dev',
  port: Number(process.env.LOCAL_DB_PORT || 54329),
  persistent: true,
  authMethod: 'scram-sha-256',
  postgresFlags: ['-h', '127.0.0.1', '-k', '/tmp'],
  onLog: () => {},
  onError: (message) => {
    if (/FATAL|ERROR/.test(String(message))) console.error(message);
  },
});
if (!existsSync(resolve(databaseDir, 'PG_VERSION'))) await pg.initialise();
await pg.start();
const client = pg.getPgClient();
await client.connect();
const { rows } = await client.query("SELECT 1 FROM pg_database WHERE datname = 'project_root'");
await client.end();
if (!rows.length) await pg.createDatabase('project_root');
console.log(
  `Local PostgreSQL ready on 127.0.0.1:${process.env.LOCAL_DB_PORT || 54329}. Ctrl+C to stop.`,
);
let stopping = false;
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, async () => {
    if (stopping) return;
    stopping = true;
    await pg.stop();
    process.exit(0);
  });
