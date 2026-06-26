import { Injectable } from '@nestjs/common';
import { isPrismaUniqueConstraintError } from '../../../core/database/prisma-error.util';
import { PrismaService } from '../../../database/prisma.service';
import { AppLogger } from '../../../core/logger/app-logger';
import type { ChecklistPreenchidoItemDto } from '../dto/checklist-preenchido.dto';

export interface SalvarChecklistsDoTurnoInput {
  turnoId: number;
  checklists: ChecklistPreenchidoItemDto[];
  createdBy?: string;
}

@Injectable()
export class ChecklistPreenchidoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Salva checklists do turno (cabeçalhos + respostas) dentro de uma transação.
   * Identifica respostas que gerarão pendência; pendências são criadas em processarChecklistsAssincrono.
   * O parâmetro tx permite executar dentro de uma transação externa (ex.: abertura de turno).
   */
  async salvarChecklistsDoTurno(
    input: SalvarChecklistsDoTurnoInput,
    tx: PrismaService = this.prisma,
  ): Promise<{
    checklistPreenchidoIds: number[];
    respostasAguardandoFoto: number[];
  }> {
    const { turnoId, checklists, createdBy = 'system' } = input;
    const checklistPreenchidoIds: number[] = [];
    const respostasAguardandoFoto: number[] = [];

    const dataPreenchimento = new Date();
    const todasOpcoesIds = new Set<number>();
    for (const cp of checklists) {
      for (const r of cp.respostas) {
        todasOpcoesIds.add(r.opcaoRespostaId);
      }
    }

    const opcoes = await tx.checklistOpcaoResposta.findMany({
      where: { id: { in: Array.from(todasOpcoesIds) } },
      select: { id: true, geraPendencia: true },
    });

    const opcoesMap = new Map(opcoes.map((o) => [o.id, o]));

    const existingPreenchidos = await tx.checklistPreenchido.findMany({
      where: { uuid: { in: checklists.map((cp) => cp.uuid) } },
      select: {
        id: true,
        uuid: true,
        _count: { select: { ChecklistResposta: true } },
      },
    });
    const existingByUuid = new Map(
      existingPreenchidos.map((item) => [item.uuid, item]),
    );

    for (const cp of checklists) {
      const existing = existingByUuid.get(cp.uuid);
      if (existing && existing._count.ChecklistResposta > 0) {
        checklistPreenchidoIds.push(existing.id);
        await this.collectRespostasAguardandoFoto(
          tx,
          existing.id,
          opcoesMap,
          respostasAguardandoFoto,
        );
        continue;
      }

      const preenchido =
        existing ??
        (await tx.checklistPreenchido.create({
          data: {
            uuid: cp.uuid,
            turnoId,
            checklistId: cp.checklistId,
            eletricistaId: cp.eletricistaId,
            dataPreenchimento,
            latitude: cp.latitude,
            longitude: cp.longitude,
            createdBy,
          },
        }));

      checklistPreenchidoIds.push(preenchido.id);

      if (cp.respostas.length > 0) {
        await tx.checklistResposta.createMany({
          data: cp.respostas.map((r) => ({
            checklistPreenchidoId: preenchido.id,
            perguntaId: r.perguntaId,
            opcaoRespostaId: r.opcaoRespostaId,
            dataResposta: dataPreenchimento,
            aguardandoFoto: false,
            fotosSincronizadas: 0,
            createdBy,
          })),
        });
      }

      await this.collectRespostasAguardandoFoto(
        tx,
        preenchido.id,
        opcoesMap,
        respostasAguardandoFoto,
      );
    }

    this.logger.operation('Checklists salvos no turno', {
      turnoId,
      count: checklists.length,
      respostasAguardandoFoto: respostasAguardandoFoto.length,
    });

    return {
      checklistPreenchidoIds: [...new Set(checklistPreenchidoIds)],
      respostasAguardandoFoto: [...new Set(respostasAguardandoFoto)],
    };
  }

  private async collectRespostasAguardandoFoto(
    tx: PrismaService,
    checklistPreenchidoId: number,
    opcoesMap: Map<number, { id: number; geraPendencia: boolean }>,
    respostasAguardandoFoto: number[],
  ) {
    const respostas = await tx.checklistResposta.findMany({
      where: { checklistPreenchidoId },
      select: { id: true, opcaoRespostaId: true },
    });

    for (const resposta of respostas) {
      if (opcoesMap.get(resposta.opcaoRespostaId)?.geraPendencia) {
        respostasAguardandoFoto.push(resposta.id);
      }
    }
  }

  /**
   * Processamento assíncrono: cria pendências e marca respostas que aguardam foto.
   * Chamado após a abertura do turno (fora da transação principal).
   */
  async processarChecklistsAssincrono(
    checklistPreenchidoIds: number[],
  ): Promise<void> {
    const uniqueIds = [...new Set(checklistPreenchidoIds)];

    for (const cpId of uniqueIds) {
      await this.processarPendenciasAutomaticas(cpId);
      await this.marcarRespostasAguardandoFoto(cpId);
    }
  }

  /**
   * Para cada resposta cuja opção tem geraPendencia=true, cria ChecklistPendencia.
   */
  private async processarPendenciasAutomaticas(
    checklistPreenchidoId: number,
  ): Promise<void> {
    const respostas = await this.prisma.checklistResposta.findMany({
      where: { checklistPreenchidoId },
      include: {
        opcaoResposta: true,
        ChecklistPendencia: true,
      },
    });

    for (const r of respostas) {
      if (!r.opcaoResposta.geraPendencia || r.ChecklistPendencia) continue;

      const cp = await this.prisma.checklistPreenchido.findUnique({
        where: { id: checklistPreenchidoId },
        select: { turnoId: true },
      });
      if (!cp) continue;

      try {
        await this.prisma.checklistPendencia.create({
          data: {
            checklistRespostaId: r.id,
            checklistPreenchidoId,
            turnoId: cp.turnoId,
            status: 'AGUARDANDO_TRATAMENTO',
            createdBy: 'system',
          },
        });
      } catch (error: unknown) {
        if (
          isPrismaUniqueConstraintError(error, 'checklistrespostaid')
        ) {
          this.logger.warn(
            'Pendência já existia para a resposta (retry/idempotência); reenvio ignorado.',
            {
              checklistPreenchidoId,
              checklistRespostaId: r.id,
            },
          );
          continue;
        }

        throw error;
      }
    }
  }

  /**
   * Marca em ChecklistResposta as que aguardam foto (quando há pendência).
   */
  private async marcarRespostasAguardandoFoto(
    checklistPreenchidoId: number,
  ): Promise<void> {
    const pendencias = await this.prisma.checklistPendencia.findMany({
      where: { checklistPreenchidoId },
      include: { checklistResposta: true },
    });

    for (const p of pendencias) {
      if (!p.checklistResposta.aguardandoFoto) {
        await this.prisma.checklistResposta.update({
          where: { id: p.checklistRespostaId },
          data: { aguardandoFoto: true, updatedBy: 'system' },
        });
      }
    }
  }
}
