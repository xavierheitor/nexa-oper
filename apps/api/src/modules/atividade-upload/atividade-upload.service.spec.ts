import { AtividadeUploadService } from './atividade-upload.service';
import type { AtividadeUploadRequestContract } from '../../contracts/atividade-upload/atividade-upload.contract';

describe('AtividadeUploadService', () => {
  const payload: AtividadeUploadRequestContract = {
    atividadeUuid: '550e8400-e29b-41d4-a716-446655440000',
    turnoId: 10,
    statusFluxo: 'em_execucao',
    eventos: [
      {
        tipoEvento: 'inicio',
        latitude: -23.55,
        longitude: -46.63,
        capturadoEm: '2026-03-09T19:08:44.109Z',
      },
      {
        tipoEvento: 'inicio',
        latitude: -23.55,
        longitude: -46.63,
        capturadoEm: '2026-03-09T19:08:44.109Z',
        accuracy: 8.5,
        detalhe: 'payload repetido',
      },
    ],
  };

  const makeSut = () => {
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: 77 }]),
      atividadeMedidor: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        upsert: jest.fn(),
      },
      atividadeMaterialAplicado: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      atividadeFormResposta: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      atividadeEvento: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      turnoEletricista: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      aprOpcaoResposta: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      aprMedidaControle: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      aprGrupoPerguntaMedidaControleRelacao: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      atividadeAprPreenchida: {
        upsert: jest.fn(),
      },
      atividadeAprResposta: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
        create: jest.fn(),
      },
      atividadeAprAssinatura: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
    };

    const prisma = {
      atividadeExecucao: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({
          id: 77,
          atividadeUuid: payload.atividadeUuid,
        }),
      },
      atividadeFoto: {
        findFirst: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest
        .fn()
        .mockImplementation((callback: (client: unknown) => unknown) =>
          callback(tx),
        ),
    };

    const storage = {
      upload: jest.fn(),
      delete: jest.fn(),
    };

    const logger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const service = new AtividadeUploadService(
      prisma as never,
      storage as never,
      logger as never,
    );

    return { service, prisma, tx, storage, logger };
  };

  it('locks the execution row and deduplicates duplicated event signatures', async () => {
    const { service, tx, logger } = makeSut();

    await expect(service.persistUpload(payload, 55)).resolves.toMatchObject({
      status: 'ok',
      atividadeExecucaoId: 77,
      atividadeUuid: payload.atividadeUuid,
      alreadyExisted: false,
      savedPhotos: 0,
    });

    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
      tx.atividadeEvento.deleteMany.mock.invocationCallOrder[0],
    );
    expect(tx.atividadeEvento.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          atividadeExecucaoId: 77,
          tipoEvento: 'inicio',
          latitude: -23.55,
          longitude: -46.63,
          accuracy: 8.5,
          detalhe: 'payload repetido',
          createdBy: '55',
        }),
      ],
      skipDuplicates: true,
    });
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Eventos duplicados detectados'),
      expect.objectContaining({
        atividadeExecucaoId: 77,
        totalEventosRecebidos: 2,
        totalEventosPersistidos: 1,
        totalDuplicadosIgnorados: 1,
      }),
    );
  });

  it('reuses the canonical photo and removes the redundant uploaded file on checksum race', async () => {
    const { service, prisma, storage } = makeSut();

    prisma.atividadeFoto.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 901 });
    storage.upload.mockResolvedValue({
      path: 'atividades/550e8400-e29b-41d4-a716-446655440000/fotos/1-foto.jpg',
      url: '/uploads/atividades/550e8400-e29b-41d4-a716-446655440000/fotos/1-foto.jpg',
      size: 3,
      mimeType: 'image/jpeg',
    });
    prisma.atividadeFoto.create.mockRejectedValue({
      code: 'P2002',
      meta: { constraint: 'uq_atividade_foto_exec_checksum' },
      message:
        'Unique constraint failed on the constraint: `uq_atividade_foto_exec_checksum`',
    });

    await expect(
      service.persistUpload(
        {
          ...payload,
          eventos: [],
          fotos: [
            {
              ref: 'foto-1',
              fileName: 'foto.jpg',
              mimeType: 'image/jpeg',
              base64: 'YWJj',
            },
          ],
        },
        55,
      ),
    ).resolves.toMatchObject({
      status: 'ok',
      atividadeExecucaoId: 77,
      savedPhotos: 1,
    });

    expect(prisma.atividadeFoto.create).toHaveBeenCalledTimes(1);
    expect(storage.delete).toHaveBeenCalledWith(
      'atividades/550e8400-e29b-41d4-a716-446655440000/fotos/1-foto.jpg',
    );
  });

  it('rejects APR resposta that generates pendencia without medidas de controle', async () => {
    const { service, tx } = makeSut();

    tx.atividadeAprPreenchida.upsert.mockResolvedValue({ id: 901 });
    tx.aprOpcaoResposta.findMany.mockResolvedValue([
      {
        id: 12,
        nome: 'Não conforme',
        geraPendencia: true,
      },
    ]);
    tx.aprGrupoPerguntaMedidaControleRelacao.findMany.mockResolvedValue([
      {
        aprGrupoPerguntaId: 7,
        aprPerguntaId: 14,
        aprMedidaControleId: 88,
      },
    ]);

    await expect(
      service.persistUpload(
        {
          ...payload,
          aprs: [
            {
              aprUuid: 'apr-uuid-1',
              respostas: [
                {
                  aprGrupoPerguntaId: 7,
                  aprPerguntaId: 14,
                  aprPerguntaNomeSnapshot: 'Isolamento da área',
                  tipoRespostaSnapshot: 'opcao',
                  aprOpcaoRespostaId: 12,
                  aprOpcaoRespostaNomeSnapshot: 'Não conforme',
                },
              ],
              assinaturas: [
                {
                  nomeAssinante: 'Eletricista 1',
                },
              ],
            },
          ],
        },
        55,
      ),
    ).rejects.toThrow('exige ao menos uma medida de controle');
  });

  it('persists textoLivre when medida de controle "Outras" is selected', async () => {
    const { service, tx } = makeSut();

    tx.atividadeAprPreenchida.upsert.mockResolvedValue({ id: 901 });
    tx.aprOpcaoResposta.findMany.mockResolvedValue([
      {
        id: 12,
        nome: 'Não conforme',
        geraPendencia: true,
      },
    ]);
    tx.aprMedidaControle.findMany.mockResolvedValue([
      {
        id: 99,
        nome: 'Outras',
      },
    ]);
    tx.aprGrupoPerguntaMedidaControleRelacao.findMany.mockResolvedValue([
      {
        aprGrupoPerguntaId: 7,
        aprPerguntaId: 14,
        aprMedidaControleId: 99,
      },
    ]);
    tx.atividadeAprResposta.create.mockResolvedValue({ id: 3001 });

    await expect(
      service.persistUpload(
        {
          ...payload,
          aprs: [
            {
              aprUuid: 'apr-uuid-2',
              respostas: [
                {
                  aprGrupoPerguntaId: 7,
                  aprPerguntaId: 14,
                  aprPerguntaNomeSnapshot: 'Isolamento da área',
                  tipoRespostaSnapshot: 'opcao',
                  aprOpcaoRespostaId: 12,
                  aprOpcaoRespostaNomeSnapshot: 'Não conforme',
                  medidasControle: [
                    {
                      aprMedidaControleId: 99,
                      aprMedidaControleNomeSnapshot: 'Outras',
                      textoLivre: 'Sinalizar a área com cones adicionais',
                    },
                  ],
                },
              ],
              assinaturas: [
                {
                  nomeAssinante: 'Eletricista 1',
                },
              ],
            },
          ],
        },
        55,
      ),
    ).resolves.toMatchObject({
      status: 'ok',
      atividadeExecucaoId: 77,
    });

    expect(tx.atividadeAprResposta.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        AtividadeAprRespostaMedidaControle: {
          create: [
            expect.objectContaining({
              aprMedidaControleId: 99,
              medidaControleNomeSnapshot: 'Outras',
              textoLivre: 'Sinalizar a área com cones adicionais',
              createdBy: '55',
            }),
          ],
        },
      }),
    });
  });

  it('rejects medida de controle "Outras" without textoLivre', async () => {
    const { service, tx } = makeSut();

    tx.atividadeAprPreenchida.upsert.mockResolvedValue({ id: 901 });
    tx.aprOpcaoResposta.findMany.mockResolvedValue([
      {
        id: 12,
        nome: 'Não conforme',
        geraPendencia: true,
      },
    ]);
    tx.aprMedidaControle.findMany.mockResolvedValue([
      {
        id: 99,
        nome: 'Outras',
      },
    ]);
    tx.aprGrupoPerguntaMedidaControleRelacao.findMany.mockResolvedValue([
      {
        aprGrupoPerguntaId: 7,
        aprPerguntaId: 14,
        aprMedidaControleId: 99,
      },
    ]);

    await expect(
      service.persistUpload(
        {
          ...payload,
          aprs: [
            {
              aprUuid: 'apr-uuid-3',
              respostas: [
                {
                  aprGrupoPerguntaId: 7,
                  aprPerguntaId: 14,
                  aprPerguntaNomeSnapshot: 'Isolamento da área',
                  tipoRespostaSnapshot: 'opcao',
                  aprOpcaoRespostaId: 12,
                  aprOpcaoRespostaNomeSnapshot: 'Não conforme',
                  medidasControle: [
                    {
                      aprMedidaControleId: 99,
                      aprMedidaControleNomeSnapshot: 'Outras',
                    },
                  ],
                },
              ],
              assinaturas: [
                {
                  nomeAssinante: 'Eletricista 1',
                },
              ],
            },
          ],
        },
        55,
      ),
    ).rejects.toThrow('exige textoLivre para a medida de controle "Outras"');
  });
});
