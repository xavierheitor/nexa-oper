/**
 * Serviço para gerenciar checklists preenchidos
 *
 * Este serviço é responsável por salvar checklists preenchidos pelos eletricistas,
 * processar pendências automáticas e gerenciar o fluxo de fotos.
 */

import { PrismaTransactionClient } from '@common/types/prisma';
import { parseMobileDate } from '@common/utils/date-timezone';
import { handleServiceError } from '@common/utils/error-handler';
import { withTimeout, TIMEOUT_CONFIG } from '@common/utils/timeout';
import { DatabaseService } from '@database/database.service';
import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import {
  SalvarChecklistPreenchidoDto,
  ChecklistPreenchidoResponseDto,
} from '../dto';

@Injectable()
export class ChecklistPreenchidoService {
  private readonly logger = new Logger(ChecklistPreenchidoService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Salva múltiplos checklists de um turno em transação
   *
   * IMPORTANTE: Este método salva apenas os checklists básicos dentro da transação.
   * O processamento de pendências e marcação de fotos é feito de forma assíncrona
   * para evitar problemas de timeout de transação.
   *
   * @param turnoId - ID do turno
   * @param checklists - Lista de checklists para salvar
   * @param transaction - Transação Prisma (opcional)
   * @param userId - ID do usuário para auditoria (opcional, usa 'system' como fallback)
   * @returns Resultado do salvamento básico
   */
  async salvarChecklistsDoTurno(
    turnoId: number,
    checklists: SalvarChecklistPreenchidoDto[],
    transaction?: PrismaTransactionClient,
    userId?: string
  ): Promise<{
    checklistsSalvos: number;
    checklistsPreenchidos: Array<{
      id: number;
      checklistId: number;
      respostas: any[];
    }>;
  }> {
    // ✅ Validar que array não está vazio antes de usar
    if (!checklists || checklists.length === 0) {
      throw new BadRequestException(
        'Pelo menos um checklist é obrigatório para salvar'
      );
    }

    this.logger.log(
      `Salvando ${checklists.length} checklists para turno ${turnoId}`
    );

    const prisma = transaction || this.db.getPrisma();
    let checklistsSalvos = 0;
    const checklistsPreenchidos: Array<{
      id: number;
      checklistId: number;
      respostas: any[];
    }> = [];

    try {
      // ✅ Paralelizar validações de checklists (não dependem um do outro)
      // Validar todos os checklists em paralelo antes de salvar
      await Promise.all(
        checklists.map(checklistData =>
          this.validarChecklistCompleto(
            checklistData.checklistId,
            checklistData.respostas,
            prisma
          )
        )
      );

      // Salvar checklists sequencialmente (dentro da transação, precisa ser sequencial)
      // mas as validações já foram feitas em paralelo
      for (const checklistData of checklists) {
        const checklistPreenchido = await this.salvarChecklistPreenchido(
          turnoId,
          checklistData,
          prisma,
          userId
        );

        checklistsSalvos++;

        // Armazenar dados para processamento posterior
        checklistsPreenchidos.push({
          id: checklistPreenchido.id,
          checklistId: checklistData.checklistId,
          respostas: checklistData.respostas,
        });
      }

      this.logger.log(`Checklists básicos salvos: ${checklistsSalvos}`);

      return {
        checklistsSalvos,
        checklistsPreenchidos,
      };
    } catch (error) {
      handleServiceError(
        error,
        this.logger,
        'Erro ao salvar checklists do turno',
        { operation: 'salvarChecklistsDoTurno' }
      );
      // Nunca chega aqui porque handleServiceError lança exceção, mas TypeScript precisa disso
      throw error;
    }
  }

  /**
   * Processa pendências e marcações de foto de forma assíncrona
   *
   * Este método é chamado após o salvamento dos checklists para processar
   * pendências automáticas e marcar respostas que aguardam foto.
   * É executado fora da transação principal para evitar timeouts.
   *
   * @param checklistsPreenchidos - Lista de checklists preenchidos para processar
   * @returns Resultado do processamento assíncrono
   */
  async processarChecklistsAssincrono(
    checklistsPreenchidos: Array<{
      id: number;
      checklistId: number;
      respostas: any[];
    }>
  ): Promise<{
    pendenciasGeradas: number;
    respostasAguardandoFoto: Array<{
      checklistRespostaId: number;
      perguntaId: number;
    }>;
  }> {
    // ✅ Validar que array não está vazio antes de processar
    if (!checklistsPreenchidos || checklistsPreenchidos.length === 0) {
      return {
        pendenciasGeradas: 0,
        respostasAguardandoFoto: [],
      };
    }

    this.logger.log(
      `Processando ${checklistsPreenchidos.length} checklists de forma assíncrona`
    );

    const pendenciasGeradas = 0;
    const respostasAguardandoFoto: Array<{
      checklistRespostaId: number;
      perguntaId: number;
    }> = [];

    try {
      // ✅ Paralelizar processamento de pendências e fotos quando possível
      // ✅ Com timeout para evitar travamentos
      const resultados = await withTimeout(
        Promise.all(
          checklistsPreenchidos.map(async checklistPreenchido => {
            // Processar pendências automáticas (fora da transação)
            const pendencias = await this.processarPendenciasAutomaticas(
              checklistPreenchido.id,
              checklistPreenchido.respostas
            );

            // Marcar respostas que aguardam foto (fora da transação)
            const respostasComFoto = await this.marcarRespostasAguardandoFoto(
              checklistPreenchido.id,
              checklistPreenchido.respostas
            );

            return {
              pendencias,
              respostasComFoto,
            };
          })
        ),
        TIMEOUT_CONFIG.CHECKLIST_PROCESSING,
        'Processamento de checklists excedeu o tempo limite'
      );

      // Agregar resultados
      let pendenciasGeradas = 0;
      const respostasAguardandoFoto: Array<{
        checklistRespostaId: number;
        perguntaId: number;
      }> = [];

      resultados.forEach(resultado => {
        pendenciasGeradas += resultado.pendencias.length;
        respostasAguardandoFoto.push(...resultado.respostasComFoto);
      });

      this.logger.log(
        `Processamento assíncrono concluído - Pendências: ${pendenciasGeradas}, Aguardando foto: ${respostasAguardandoFoto.length}`
      );

      return {
        pendenciasGeradas,
        respostasAguardandoFoto,
      };
    } catch (error) {
      this.logger.error('Erro no processamento assíncrono:', error);
      // Não lançar erro aqui para não afetar a resposta principal
      return {
        pendenciasGeradas: 0,
        respostasAguardandoFoto: [],
      };
    }
  }

  /**
   * Salva um checklist preenchido individual
   *
   * @param turnoId - ID do turno
   * @param checklistData - Dados do checklist
   * @param transaction - Transação Prisma (opcional)
   * @param userId - ID do usuário para auditoria (opcional, usa 'system' como fallback)
   * @returns Checklist preenchido criado
   */
  async salvarChecklistPreenchido(
    turnoId: number,
    checklistData: SalvarChecklistPreenchidoDto,
    transaction?: PrismaTransactionClient,
    userId?: string
  ): Promise<ChecklistPreenchidoResponseDto> {
    const prisma = transaction || this.db.getPrisma();
    // ✅ Converter userId para string (Prisma espera String para createdBy)
    const createdBy = userId ? String(userId) : 'system';

    // ✅ Validar que array de respostas não está vazio antes de salvar
    if (!checklistData.respostas || checklistData.respostas.length === 0) {
      throw new BadRequestException('Lista de respostas não pode estar vazia');
    }

    // Criar checklist preenchido
    const checklistPreenchido = await prisma.checklistPreenchido.create({
      data: {
        uuid: checklistData.uuid, // ✅ UUID obrigatório
        turnoId,
        checklistId: checklistData.checklistId,
        eletricistaId: checklistData.eletricistaId,
        dataPreenchimento: parseMobileDate(checklistData.dataPreenchimento),
        latitude: checklistData.latitude,
        longitude: checklistData.longitude,
        createdAt: new Date(),
        createdBy,
      },
    });

    // Salvar respostas
    for (const respostaData of checklistData.respostas) {
      await prisma.checklistResposta.create({
        data: {
          checklistPreenchidoId: checklistPreenchido.id,
          perguntaId: respostaData.perguntaId,
          opcaoRespostaId: respostaData.opcaoRespostaId,
          dataResposta: parseMobileDate(respostaData.dataResposta),
          aguardandoFoto: false, // Será atualizado depois se necessário
          fotosSincronizadas: 0,
          createdAt: new Date(),
          createdBy,
        },
      });
    }

    // Mapear para o DTO, convertendo null para undefined
    return {
      id: checklistPreenchido.id,
      turnoId: checklistPreenchido.turnoId,
      checklistId: checklistPreenchido.checklistId,
      eletricistaId: checklistPreenchido.eletricistaId,
      dataPreenchimento: checklistPreenchido.dataPreenchimento,
      latitude: checklistPreenchido.latitude ?? undefined,
      longitude: checklistPreenchido.longitude ?? undefined,
    };
  }

  /**
   * Valida se um checklist está completo (todas as perguntas respondidas)
   *
   * @param checklistId - ID do modelo do checklist
   * @param respostas - Respostas fornecidas
   * @param transaction - Transação Prisma (opcional)
   */
  async validarChecklistCompleto(
    checklistId: number,
    respostas: any[],
    transaction?: PrismaTransactionClient
  ): Promise<void> {
    const prisma = transaction || this.db.getPrisma();

    // ✅ Validar que array de respostas não está vazio
    if (!respostas || respostas.length === 0) {
      throw new BadRequestException('Lista de respostas não pode estar vazia');
    }

    // Buscar perguntas obrigatórias do checklist
    const perguntasObrigatorias =
      await prisma.checklistPerguntaRelacao.findMany({
        where: {
          checklistId,
          deletedAt: null,
        },
        include: {
          checklistPergunta: true,
        },
      });

    // Verificar se todas as perguntas foram respondidas
    const perguntasRespondidas = new Set(respostas.map(r => r.perguntaId));
    const perguntasFaltando = perguntasObrigatorias.filter(
      (p: any) => !perguntasRespondidas.has(p.checklistPerguntaId)
    );

    if (perguntasFaltando.length > 0) {
      const nomesPerguntas = perguntasFaltando.map(
        (p: any) => p.checklistPergunta.nome
      );
      throw new BadRequestException(
        `Checklist incompleto. Perguntas não respondidas: ${nomesPerguntas.join(', ')}`
      );
    }
  }

  /**
   * Processa pendências automáticas baseadas nas respostas
   *
   * @param checklistPreenchidoId - ID do checklist preenchido
   * @param respostas - Respostas do checklist
   * @returns Lista de pendências criadas
   */
  async processarPendenciasAutomaticas(
    checklistPreenchidoId: number,
    respostas: any[]
  ): Promise<any[]> {
    const prisma = this.db.getPrisma();
    const pendencias: any[] = [];

    // ✅ Validar que array de respostas não está vazio
    if (!respostas || respostas.length === 0) {
      return pendencias; // Retorna vazio se não houver respostas
    }

    // Buscar informações do checklist preenchido
    const checklistPreenchido = await prisma.checklistPreenchido.findUnique({
      where: { id: checklistPreenchidoId },
      include: {
        turno: true,
      },
    });

    if (!checklistPreenchido) {
      throw new NotFoundException('Checklist preenchido não encontrado');
    }

    // Para cada resposta, verificar se gera pendência
    for (const respostaData of respostas) {
      const opcaoResposta = await prisma.checklistOpcaoResposta.findUnique({
        where: { id: respostaData.opcaoRespostaId },
      });

      if (opcaoResposta?.geraPendencia) {
        // Buscar a resposta salva
        const resposta = await prisma.checklistResposta.findFirst({
          where: {
            checklistPreenchidoId,
            perguntaId: respostaData.perguntaId,
            opcaoRespostaId: respostaData.opcaoRespostaId,
          },
        });

        if (resposta) {
          // Criar pendência
          const pendencia = await prisma.checklistPendencia.create({
            data: {
              checklistRespostaId: resposta.id,
              checklistPreenchidoId,
              turnoId: checklistPreenchido.turnoId,
              status: 'AGUARDANDO_TRATAMENTO',
              observacaoProblema: `Pendência gerada automaticamente pela resposta: ${opcaoResposta.nome}`,
              createdAt: new Date(),
              createdBy: 'system',
            },
          });

          pendencias.push(pendencia);
        }
      }
    }

    return pendencias;
  }

  /**
   * Marca respostas que aguardam foto (quando geraPendencia=true)
   *
   * @param checklistPreenchidoId - ID do checklist preenchido
   * @param respostas - Respostas do checklist
   * @returns Lista de respostas que aguardam foto
   */
  async marcarRespostasAguardandoFoto(
    checklistPreenchidoId: number,
    respostas: any[]
  ): Promise<Array<{ checklistRespostaId: number; perguntaId: number }>> {
    const prisma = this.db.getPrisma();
    const respostasAguardandoFoto: Array<{
      checklistRespostaId: number;
      perguntaId: number;
    }> = [];

    // ✅ Validar que array de respostas não está vazio
    if (!respostas || respostas.length === 0) {
      return respostasAguardandoFoto; // Retorna vazio se não houver respostas
    }

    for (const respostaData of respostas) {
      const opcaoResposta = await prisma.checklistOpcaoResposta.findUnique({
        where: { id: respostaData.opcaoRespostaId },
      });

      if (opcaoResposta?.geraPendencia) {
        // Buscar a resposta salva
        const resposta = await prisma.checklistResposta.findFirst({
          where: {
            checklistPreenchidoId,
            perguntaId: respostaData.perguntaId,
            opcaoRespostaId: respostaData.opcaoRespostaId,
          },
        });

        if (resposta) {
          // Marcar como aguardando foto
          await prisma.checklistResposta.update({
            where: { id: resposta.id },
            data: {
              aguardandoFoto: true,
              updatedAt: new Date(),
              updatedBy: 'system',
            },
          });

          respostasAguardandoFoto.push({
            checklistRespostaId: resposta.id,
            perguntaId: respostaData.perguntaId,
          });
        }
      }
    }

    return respostasAguardandoFoto;
  }

  /**
   * Busca checklists preenchidos de um turno
   *
   * @param turnoId - ID do turno
   * @returns Lista de checklists preenchidos
   */
  async buscarChecklistsDoTurno(
    turnoId: number
  ): Promise<ChecklistPreenchidoResponseDto[]> {
    const checklists = await this.db.getPrisma().checklistPreenchido.findMany({
      where: { turnoId },
      include: {
        checklist: {
          select: {
            id: true,
            nome: true,
          },
        },
        eletricista: {
          select: {
            id: true,
            nome: true,
          },
        },
        ChecklistResposta: {
          include: {
            pergunta: true,
            opcaoResposta: true,
            ChecklistPendencia: true,
          },
        },
        ChecklistPendencia: true,
      },
    });

    return checklists.map((checklist: any) => ({
      id: checklist.id,
      turnoId: checklist.turnoId,
      checklistId: checklist.checklistId,
      checklistNome: checklist.checklist.nome,
      eletricistaId: checklist.eletricistaId,
      eletricistaNome: checklist.eletricista.nome,
      dataPreenchimento: checklist.dataPreenchimento,
      latitude: checklist.latitude,
      longitude: checklist.longitude,
      respostas: checklist.ChecklistResposta,
      pendenciasGeradas: checklist.ChecklistPendencia.length,
      respostasAguardandoFoto: checklist.ChecklistResposta.filter(
        (r: any) => r.aguardandoFoto
      ).length,
    }));
  }
}
