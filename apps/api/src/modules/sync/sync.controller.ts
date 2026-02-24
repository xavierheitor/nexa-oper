import { Controller, Get, Headers, Param, Query, Res } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import type {
  SyncCollectionResponseContract,
  SyncScopeContract,
} from '../../contracts/sync/sync.contract';
import { envelope } from '../../core/http/interceptors';
import { InjectUserContracts } from '../auth/modules/contract-permissions/decorators/inject-user-contracts.decorator';
import { GetUserContracts } from '../auth/modules/contract-permissions/decorators/get-user-contracts.decorator';
import { GetUsuarioMobileId } from '../auth/modules/contract-permissions/decorators/get-usuario-mobile-id.decorator';
import { BuildSyncManifestUseCase } from './application/use-cases/build-sync-manifest.use-case';
import { GetSyncCollectionUseCase } from './application/use-cases/get-sync-collection.use-case';
import { SyncManifestDto } from './dto/sync-manifest.dto';

/**
 * Controller responsável pela sincronização de dados com o aplicativo mobile.
 *
 * Oferece endpoints para obter o manifesto de dados (índice de coleções e etags)
 * e para baixar coleções individuais (em modo snapshot ou delta).
 */
@ApiTags('sync')
@ApiBearerAuth()
@Controller('sync')
@InjectUserContracts()
export class SyncController {
  constructor(
    private readonly buildSyncManifestUseCase: BuildSyncManifestUseCase,
    private readonly getSyncCollectionUseCase: GetSyncCollectionUseCase,
  ) {}

  /**
   * Retorna o manifesto de sincronização contendo o hash do escopo e as etags de todas as coleções.
   *
   * O cliente deve enviar o header `If-None-Match` com a etag do manifesto anterior.
   * Se nada mudou no servidor para o usuário/contratos atuais, retorna 304 Not Modified.
   *
   * @param userId - ID do usuário.
   * @param contractIds - IDs dos contratos permitidos para o usuário.
   * @param res - Objeto de resposta Express (usado para setar headers e status 304).
   * @param ifNoneMatch - Header condicional para cache.
   * @returns O manifesto ou status 304.
   */
  @Get('manifest')
  @ApiOperation({
    summary: 'Manifest',
    description:
      'Retorna o índice de coleções com etag. Use If-None-Match para receber 304 quando nada mudou.',
  })
  @ApiHeader({
    name: 'If-None-Match',
    required: false,
    description: 'Etag do manifest anterior (para cache 304)',
  })
  @ApiOkResponse({
    description: 'Manifest com serverTime, scopeHash e collections',
    type: SyncManifestDto,
  })
  @ApiResponse({ status: 304, description: 'Not Modified – nada mudou' })
  async manifest(
    @GetUsuarioMobileId() userId: number | undefined,
    @GetUserContracts() contractIds: number[],
    @Res() res: Response,
    @Headers('if-none-match') ifNoneMatch?: string,
  ) {
    const scope: SyncScopeContract = {
      userId: userId ?? 0,
      contractIds,
    };

    const result = await this.buildSyncManifestUseCase.execute(
      scope,
      ifNoneMatch,
    );

    if (result.statusCode === 304) {
      return res.status(304).end();
    }

    return res
      .setHeader('ETag', result.etag)
      .status(200)
      .json(envelope(result.manifest));
  }

  /**
   * Retorna os dados de uma coleção específica.
   *
   * Suporta dois modos:
   * - **Snapshot**: Retorna todos os dados da coleção.
   * - **Delta**: Retorna apenas as mudanças (upserts e deletes) desde a data especificada em `since`.
   *
   * @param userId - ID do usuário.
   * @param contractIds - IDs dos contratos permitidos.
   * @param name - Nome da coleção (ex: 'equipe', 'veiculo').
   * @param since - (Opcional) Data/hora ISO do último sync (apenas para coleções delta).
   * @param until - (Opcional) Data/hora ISO limite para o delta (default: agora).
   * @returns Os dados da coleção (items e metadados de sync).
   */
  @Get('collections/:name')
  @ApiOperation({
    summary: 'Coleção',
    description:
      'Baixa snapshot ou delta da coleção. Delta usa since/until; snapshot retorna tudo.',
  })
  @ApiParam({
    name: 'name',
    description: 'Nome da coleção',
    enum: [
      'eletricista',
      'equipe',
      'veiculo',
      'checklist-modelo',
      'checklist-pergunta',
      'checklist-pergunta-relacao',
      'checklist-opcao-resposta',
      'checklist-opcao-resposta-relacao',
      'checklist-tipo-veiculo-relacao',
      'checklist-tipo-equipe-relacao',
      'tipo-equipe',
      'tipo-veiculo',
      'atividade-tipo',
      'atividade-tipo-servico',
      'atividade-form-template',
      'atividade-form-pergunta',
      'atividade-form-tipo-servico-relacao',
      'apr-modelo',
      'apr-tipo-atividade-relacao',
      'apr-grupo-pergunta',
      'apr-grupo-relacao',
      'apr-pergunta',
      'apr-grupo-pergunta-relacao',
      'apr-opcao-resposta',
      'apr-grupo-opcao-resposta-relacao',
      'material-catalogo',
    ],
  })
  @ApiQuery({
    name: 'since',
    required: false,
    description: 'Token ISO do último delta (modo delta; primeira sync: vazio)',
  })
  @ApiQuery({
    name: 'until',
    required: false,
    description: 'Data limite ISO (modo delta; default: agora)',
  })
  @ApiOkResponse({
    description:
      'Snapshot: { serverTime, nextSince: null, items, deletedIds: [] }. Delta: { serverTime, nextSince, items, deletedIds }',
  })
  @ApiResponse({ status: 404, description: 'Coleção não encontrada' })
  async collection(
    @GetUsuarioMobileId() userId: number | undefined,
    @GetUserContracts() contractIds: number[],
    @Param('name') name: string,
    @Query('since') since?: string,
    @Query('until') until?: string,
  ): Promise<SyncCollectionResponseContract> {
    const scope: SyncScopeContract = {
      userId: userId ?? 0,
      contractIds,
    };

    return this.getSyncCollectionUseCase.execute(scope, name, {
      since,
      until,
    });
  }
}
