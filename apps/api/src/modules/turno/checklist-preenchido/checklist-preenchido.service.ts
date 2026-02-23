import { Injectable } from '@nestjs/common';
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

    for (const cp of checklists) {
      const preenchido = await tx.checklistPreenchido.create({
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
      });
      checklistPreenchidoIds.push(preenchido.id);

      for (const r of cp.respostas) {
        const opcao = opcoesMap.get(r.opcaoRespostaId);
        const resposta = await tx.checklistResposta.create({
          data: {
            checklistPreenchidoId: preenchido.id,
            perguntaId: r.perguntaId,
            opcaoRespostaId: r.opcaoRespostaId,
            dataResposta: dataPreenchimento,
            aguardandoFoto: false,
            fotosSincronizadas: 0,
            createdBy,
          },
        });
        if (opcao?.geraPendencia) {
          respostasAguardandoFoto.push(resposta.id);
        }
      }
    }

    this.logger.operation('Checklists salvos no turno', {
      turnoId,
      count: checklists.length,
      respostasAguardandoFoto: respostasAguardandoFoto.length,
    });

    return { checklistPreenchidoIds, respostasAguardandoFoto };
  }

  /**
   * Processamento assíncrono: cria pendências e marca respostas que aguardam foto.
   * Chamado após a abertura do turno (fora da transação principal).
   */
  async processarChecklistsAssincrono(
    checklistPreenchidoIds: number[],
  ): Promise<void> {
    for (const cpId of checklistPreenchidoIds) {
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

      await this.prisma.checklistPendencia.create({
        data: {
          checklistRespostaId: r.id,
          checklistPreenchidoId,
          turnoId: cp.turnoId,
          status: 'AGUARDANDO_TRATAMENTO',
          createdBy: 'system',
        },
      });
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
