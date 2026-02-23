import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import type {
  SyncDeltaResponseContract,
  SyncManifestResultContract,
  SyncScopeContract,
  SyncSnapshotResponseContract,
} from '../../contracts/sync/sync.contract';
import { AppError } from '../../core/errors/app-error';
import { PrismaService } from '../../database/prisma.service';
import { SYNC_COLLECTIONS, type SyncCollectionDef } from './sync.registry';
import type { SyncReaderPort } from './domain/ports/sync-reader.port';

function sha1(str: string) {
  return createHash('sha1').update(str).digest('hex');
}

/**
 * Serviço responsável pela lógica de sincronização.
 * Gerencia a construção do manifesto e a recuperação de dados (snapshot/delta)
 * delegando para as definições de coleção registradas.
 */
@Injectable()
export class SyncService implements SyncReaderPort {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calcula um hash que representa o escopo atual (usuário e contratos).
   * Se o escopo mudar (ex: usuário ganhou novo contrato), o hash muda, forçando o cliente a re-sincronizar se necessário.
   *
   * @param scope - O escopo de sincronização (userId, contractIds).
   * @returns Hash SHA1 do escopo.
   */
  computeScopeHash(scope: SyncScopeContract): string {
    const payload = {
      userId: scope.userId,
      contractIds: scope.contractIds?.slice().sort() ?? [],
    };
    return sha1(JSON.stringify(payload));
  }

  /**
   * Constrói o manifesto de sincronização contendo o estado atual (etag) de todas as coleções.
   *
   * @param scope - O escopo de sincronização.
   * @returns Objeto contendo o manifesto (SyncManifestDto) e sua ETag geral.
   */
  async buildManifest(
    scope: SyncScopeContract,
  ): Promise<SyncManifestResultContract> {
    const serverTime = new Date();
    const scopeHash = this.computeScopeHash(scope);

    const collectionsEntries = await Promise.all(
      SYNC_COLLECTIONS.map(async (c) => {
        const etag = await c.computeEtag(this.prisma, scope);
        return [c.name, { name: c.name, etag, mode: c.mode }] as const;
      }),
    );

    const collections = Object.fromEntries(collectionsEntries);

    const manifest = {
      serverTime: serverTime.toISOString(),
      scopeHash,
      collections,
    };

    // ETag do manifest (pra responder 304)
    const manifestEtag = sha1(JSON.stringify(manifest));
    return { manifest, etag: `"${manifestEtag}"` };
  }

  /**
   * Obtém a definição de uma coleção pelo nome.
   *
   * @param name - Nome da coleção.
   * @returns Definição da coleção.
   * @throws {AppError} Se a coleção não for encontrada.
   */
  getCollectionDef(name: string): SyncCollectionDef {
    const def = SYNC_COLLECTIONS.find((c) => c.name === name);
    if (!def) throw AppError.notFound(`Collection not found: ${name}`);
    return def;
  }

  /**
   * Obtém o snapshot completo de uma coleção.
   *
   * @param name - Nome da coleção.
   * @param scope - Escopo de sincronização.
   * @returns Objeto com `items` e `serverTime`.
   */
  async getCollectionSnapshot(
    name: string,
    scope: SyncScopeContract,
  ): Promise<SyncSnapshotResponseContract> {
    const def = this.getCollectionDef(name);
    if (def.mode !== 'snapshot' || !def.snapshot) {
      throw AppError.notFound(`Collection ${def.name} is not snapshot`);
    }
    const serverTime = new Date().toISOString();
    const items = await def.snapshot(this.prisma, scope);
    return {
      serverTime,
      nextSince: null,
      items,
      deletedIds: [],
    };
  }

  /**
   * Obtém o delta (diferença) de uma coleção baseada em data.
   *
   * @param name - Nome da coleção.
   * @param scope - Escopo de sincronização.
   * @param params - Parâmetros `since` e `until`.
   * @returns Objeto com `items` (criados/modificados), `deletedIds` (removidos) e `nextSince`.
   */
  async getCollectionDelta(
    name: string,
    scope: SyncScopeContract,
    params: { since: string; until: string },
  ): Promise<SyncDeltaResponseContract> {
    const def = this.getCollectionDef(name);
    if (def.mode !== 'delta' || !def.delta) {
      throw AppError.notFound(`Collection ${def.name} is not delta`);
    }

    const untilDate = params.until ? new Date(params.until) : new Date();
    if (Number.isNaN(untilDate.getTime())) {
      throw AppError.validation('Parâmetro until inválido');
    }

    const since = params.since ?? '';
    if (since) {
      const sinceDate = new Date(since);
      if (Number.isNaN(sinceDate.getTime())) {
        throw AppError.validation('Parâmetro since inválido');
      }
    }

    const out = await def.delta(this.prisma, scope, {
      since,
      until: untilDate,
    });
    return {
      serverTime: untilDate.toISOString(),
      nextSince: out.nextSince,
      items: out.items,
      deletedIds: out.deletedIds,
    };
  }
}
