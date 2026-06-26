import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { runCommand } from '../utils/shell';
import { sectionTitle } from '../utils/fs-helpers';
import type { SnapshotContext } from '../types';

const LETSENCRYPT_LIVE = '/etc/letsencrypt/live';

export async function collectCertificates(ctx: SnapshotContext): Promise<void> {
  ctx.lines.push(sectionTitle(14, 'Certificados'));

  try {
    const domains = await readdir(LETSENCRYPT_LIVE);
    const validDomains = domains.filter(name => name !== 'README');

    if (!validDomains.length) {
      ctx.lines.push('(nenhum certificado Let\'s Encrypt encontrado)');
      ctx.lines.push('');
      return;
    }

    for (const domain of validDomains.sort()) {
      const certPath = path.join(LETSENCRYPT_LIVE, domain, 'cert.pem');
      const openssl = await runCommand('openssl', [
        'x509',
        '-in',
        certPath,
        '-noout',
        '-dates',
        '-subject',
      ]);

      ctx.lines.push(`Domínio: ${domain}`);

      if (openssl.stdout) {
        const lines = openssl.stdout.split('\n');
        const notBefore = lines.find(line => line.startsWith('notBefore='));
        const notAfter = lines.find(line => line.startsWith('notAfter='));
        const subject = lines.find(line => line.startsWith('subject='));

        if (subject) ctx.lines.push(`  ${subject}`);
        if (notBefore) ctx.lines.push(`  ${notBefore}`);
        if (notAfter) ctx.lines.push(`  ${notAfter}`);
      } else {
        try {
          const pem = await readFile(certPath, 'utf8');
          ctx.lines.push(`  cert.pem encontrado (${pem.length} bytes)`);
        } catch {
          ctx.lines.push('  (cert.pem não legível)');
        }
      }

      ctx.lines.push('');
    }
  } catch {
    ctx.lines.push(
      '(Let\'s Encrypt não acessível — normal em ambiente local ou sem permissão)',
    );
    ctx.lines.push('');
  }
}
