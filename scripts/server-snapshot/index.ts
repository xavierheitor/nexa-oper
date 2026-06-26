#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { collectBuild } from './collectors/build';
import { collectCertificates } from './collectors/certificates';
import { collectDatabase } from './collectors/database';
import { collectDisk } from './collectors/disk';
import { collectEcosystem } from './collectors/ecosystem';
import { collectEnvFiles } from './collectors/env-files';
import { collectGeneral } from './collectors/general';
import { collectGit } from './collectors/git';
import { collectLogs } from './collectors/logs';
import { collectNginx } from './collectors/nginx';
import { collectNode } from './collectors/node-info';
import { collectPackageJson } from './collectors/package-json';
import { collectPm2 } from './collectors/pm2';
import { collectPorts } from './collectors/ports';
import { collectProblemsSummary } from './collectors/problems-summary';
import { collectUploads } from './collectors/uploads';
import type { SnapshotContext } from './types';
import {
  ensureDiagnosticsDir,
  formatSnapshotTimestamp,
  writeSnapshot,
} from './utils/fs-helpers';

function findRepoRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
}

async function runCollectors(ctx: SnapshotContext): Promise<void> {
  await collectGeneral(ctx);
  await collectNode(ctx);
  await collectGit(ctx);
  await collectPackageJson(ctx);
  await collectPm2(ctx);
  await collectEcosystem(ctx);
  await collectEnvFiles(ctx);
  await collectUploads(ctx);
  await collectBuild(ctx);
  await collectLogs(ctx);
  await collectPorts(ctx);
  await collectDisk(ctx);
  await collectNginx(ctx);
  await collectCertificates(ctx);
  await collectDatabase(ctx);
  await collectProblemsSummary(ctx);
}

async function main(): Promise<void> {
  const repoRoot = findRepoRoot();
  const diagnosticsDir = await ensureDiagnosticsDir(repoRoot);
  const outputPath = path.join(
    diagnosticsDir,
    `server-snapshot-${formatSnapshotTimestamp()}.txt`,
  );

  const ctx: SnapshotContext = {
    repoRoot,
    outputPath,
    lines: [
      'NEXA OPER — SERVER SNAPSHOT',
      `Gerado em: ${new Date().toISOString()}`,
      `Repositório: ${repoRoot}`,
      '',
    ],
    problems: [],
    envValues: new Map<string, string>(),
  };

  await runCollectors(ctx);

  await writeSnapshot(outputPath, ctx.lines.join('\n'));

  console.log(`Snapshot salvo em: ${outputPath}`);

  if (ctx.problems.length) {
    console.log(`Problemas detectados: ${new Set(ctx.problems).size}`);
  }
}

main().catch((error: unknown) => {
  console.error('Falha ao gerar snapshot:', error);
  process.exitCode = 1;
});
