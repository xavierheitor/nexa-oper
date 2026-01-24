/**
 * Serviço de Turnos
 *
 * Este serviço implementa toda a lógica de negócio relacionada
 * aos turnos da operação, incluindo abertura, fechamento,
 * validações complexas e integração com permissões de contrato.
 *
 * RESPONSABILIDADES:
 * - Abertura de turnos com validações de conflito
 * - Fechamento de turnos com validações de negócio
 * - Validações de duplicidade (veículo, equipe, eletricista)
 * - Integração com permissões de contrato
 * - Transformação de dados entre DTOs e entidades
 * - Logging estruturado de operações
 * - Tratamento de erros específicos
 * - Integração com banco de dados via Prisma
 *
 * VALIDAÇÕES DE NEGÓCIO:
 * - Não pode haver turno aberto para o mesmo veículo
 * - Não pode haver turno aberto para a mesma equipe
 * - Não pode haver turno aberto para o mesmo eletricista
 * - Quilometragem de fechamento deve ser maior que a de abertura
 * - Data de fechamento deve ser posterior à data de abertura
 * - Validação de existência de veículo, equipe e eletricistas
 *
 * @example
 * ```typescript
 * // Abrir turno com validações
 * const turno = await turnoService.abrirTurno(abrirDto, allowedContracts);
 *
 * // Fechar turno com validações
 * const turnoFechado = await turnoService.fecharTurno(fecharDto, allowedContracts);
 * ```
 */

import {
  getDefaultUserContext,
  createAuditData,
  updateAuditData,
  deleteAuditData,
} from '@common/utils/audit';
import { formatDateOnly, parseMobileDate } from '@common/utils/date-timezone';
import { handleCrudError } from '@common/utils/error-handler';
import {
  buildPaginationMeta,
  validatePaginationParams,
  normalizePaginationParams,
} from '@common/utils/pagination';
import { withTransactionTimeout, withSyncTimeout } from '@common/utils/timeout';
import { validateId, ensureEntityExists } from '@common/utils/validation';
import { DatabaseService } from '@database/database.service';
import { ContractPermission } from '@core/auth/services/contract-permissions.service';
import { extractAllowedContractIds } from '@core/auth/utils/contract-helpers';
import { TurnoRealizadoService } from '@modules/turno-realizado/turno-realizado.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import {
  ORDER_CONFIG,
  ERROR_MESSAGES as TURNO_ERRORS,
  TURNO_STATUS,
} from '@common/constants/turno';
import {
  AbrirTurnoDto,
  FecharTurnoDto,
  TurnoListResponseDto,
  TurnoResponseDto,
  TurnoSyncDto,
} from '../dto';
import { ChecklistPreenchidoService } from './checklist-preenchido.service';


/**
 * Interface de parâmetros para consulta paginada interna
 */
interface FindAllParams {
  page: number;
  limit: number;
  search?: string;
  veiculoId?: number;
  equipeId?: number;
  eletricistaId?: number;
  status?: string;
  dataInicio?: string;
  dataFim?: string;
}

/**
 * Serviço responsável pelas operações de turnos
 */
@Injectable()
export class TurnoService {
  private readonly logger = new Logger(TurnoService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly checklistPreenchidoService: ChecklistPreenchidoService,
    private readonly turnoRealizadoService: TurnoRealizadoService
  ) {}

  /**
   * Abre um novo turno com validações de conflito
   *
   * @param abrirDto - Dados para abertura do turno
   * @param allowedContracts - Contratos permitidos para o usuário
   * @returns Turno criado com ID remoto
   */
  async abrirTurno(
    abrirDto: AbrirTurnoDto,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    allowedContracts: ContractPermission[],
    userId?: string
  ): Promise<TurnoResponseDto> {
    this.logger.log(
      `Abrindo turno - Veículo: ${abrirDto.veiculoId}, Equipe: ${abrirDto.equipeId}`
    );

    try {
      // Validação de permissões de contrato
      // Por enquanto, turnos não têm restrição de contrato direta
      // mas mantemos a estrutura para futuras implementações

      // Validações de existência (podem ficar fora da transação)
      await this.validateEntidadesExistem(abrirDto);

      // Validações de negócio
      this.validateDadosAbertura(abrirDto);

      // Contexto do usuário
      // ✅ Converter userId para string (Prisma espera String para createdBy)
      const userContext = userId
        ? { userId: String(userId), userName: String(userId), roles: [] }
        : getDefaultUserContext();

      // Dados de auditoria para criação
      const auditData = createAuditData(userContext);

      // Usar transação para garantir atomicidade com timeout
      const resultado = await withTransactionTimeout(
        this.db.getPrisma().$transaction(async transaction => {
          // ✅ VALIDAÇÕES DE CONFLITO DENTRO DA TRANSAÇÃO (evita race conditions)
          // Verifica se já existe turno aberto para o veículo
          const turnoVeiculo = await transaction.turno.findFirst({
            where: {
              veiculoId: abrirDto.veiculoId,
              dataFim: null,
              deletedAt: null,
            },
          });
          if (turnoVeiculo) {
            throw new ConflictException(TURNO_ERRORS.TURNO_JA_ABERTO);
          }

          // Verifica se já existe turno aberto para a equipe
          const turnoEquipe = await transaction.turno.findFirst({
            where: {
              equipeId: abrirDto.equipeId,
              dataFim: null,
              deletedAt: null,
            },
          });
          if (turnoEquipe) {
            throw new ConflictException(TURNO_ERRORS.TURNO_JA_ABERTO_EQUIPE);
          }

          // ✅ Paralelizar validação de conflitos de eletricistas
          // Buscar todos os turnos abertos que têm algum dos eletricistas em paralelo
          const eletricistaIds = abrirDto.eletricistas.map(
            e => e.eletricistaId
          );
          const turnosComEletricistas = await transaction.turno.findMany({
            where: {
              TurnoEletricistas: {
                some: {
                  eletricistaId: { in: eletricistaIds },
                  deletedAt: null,
                },
              },
              dataFim: null,
              deletedAt: null,
            },
            include: {
              TurnoEletricistas: {
                where: {
                  eletricistaId: { in: eletricistaIds },
                  deletedAt: null,
                },
                select: {
                  eletricistaId: true,
                },
              },
            },
          });

          // Verificar se algum eletricista já está em turno aberto
          if (turnosComEletricistas.length > 0) {
            const eletricistasEmConflito = new Set<number>();
            turnosComEletricistas.forEach(turno => {
              turno.TurnoEletricistas.forEach(te => {
                eletricistasEmConflito.add(te.eletricistaId);
              });
            });

            if (eletricistasEmConflito.size > 0) {
              throw new ConflictException(
                TURNO_ERRORS.TURNO_JA_ABERTO_ELETRICISTA
              );
            }
          }

          // Criação do turno
          const turno = await transaction.turno.create({
            data: {
              dataSolicitacao: new Date(),
              dataInicio: parseMobileDate(abrirDto.dataInicio),
              veiculoId: abrirDto.veiculoId,
              equipeId: abrirDto.equipeId,
              dispositivo: abrirDto.dispositivo,
              kmInicio: abrirDto.kmInicio,
              ...auditData,
            },
            include: {
              veiculo: {
                select: {
                  id: true,
                  placa: true,
                  modelo: true,
                },
              },
              equipe: {
                select: {
                  id: true,
                  nome: true,
                },
              },
              TurnoEletricistas: {
                include: {
                  eletricista: {
                    select: {
                      id: true,
                      nome: true,
                      matricula: true,
                    },
                  },
                },
              },
            },
          });

          // Criação dos eletricistas do turno
          await transaction.turnoEletricista.createMany({
            data: abrirDto.eletricistas.map(eletricista => ({
              turnoId: turno.id,
              eletricistaId: eletricista.eletricistaId,
              motorista: eletricista.motorista || false,
              ...auditData,
            })),
          });

          // Salvar checklists básicos se fornecidos (dentro da transação)
          let checklistsBasicResult = null;
          if (abrirDto.checklists && abrirDto.checklists.length > 0) {
            checklistsBasicResult =
              await this.checklistPreenchidoService.salvarChecklistsDoTurno(
                turno.id,
                abrirDto.checklists,
                transaction,
                userId
              );
          }

          return { turno, checklistsBasicResult };
        })
      );

      // Busca o turno completo com relacionamentos
      const turnoCompleto = await this.buscarTurnoCompleto(resultado.turno.id);

      this.logger.log(`Turno aberto com sucesso - ID: ${resultado.turno.id}`);

      // Criar TurnoRealizado e TurnoRealizadoEletricista para reconciliação
      // Isso permite que a reconciliação funcione mesmo quando turnos são abertos via mobile
      try {
        const dataReferencia = new Date(turnoCompleto.dataInicio);
        // Normalizar para início do dia (00:00:00) para dataReferencia
        dataReferencia.setHours(0, 0, 0, 0);

        await this.turnoRealizadoService.abrirTurno({
          equipeId: turnoCompleto.equipeId,
          dataReferencia: formatDateOnly(dataReferencia),
          turnoId: resultado.turno.id, // Referência ao Turno original
          eletricistasAbertos: turnoCompleto.TurnoEletricistas.map(
            (te: any) => ({
              eletricistaId: te.eletricistaId,
              abertoEm: turnoCompleto.dataInicio.toISOString(),
              deviceInfo: turnoCompleto.dispositivo || undefined,
            })
          ),
          origem: 'mobile',
          executadoPor: userId || String(turnoCompleto.createdBy || 'system'),
        });

        this.logger.log(
          `TurnoRealizado criado para reconciliação - Turno ID: ${resultado.turno.id}`
        );
      } catch (error: any) {
        // Não bloquear a resposta se falhar criar TurnoRealizado
        // Mas logar o erro para debug
        this.logger.warn(
          `Erro ao criar TurnoRealizado para reconciliação (Turno ID: ${resultado.turno.id}): ${error.message}`
        );
      }

      // Processar pendências e fotos de forma assíncrona (fora da transação)
      const checklistsParaProcessar =
        resultado.checklistsBasicResult?.checklistsPreenchidos;
      if (checklistsParaProcessar && checklistsParaProcessar.length > 0) {
        this.logger.log(
          'Iniciando processamento assíncrono de pendências e fotos'
        );

        // Executar processamento assíncrono sem aguardar
        this.checklistPreenchidoService
          .processarChecklistsAssincrono(checklistsParaProcessar)
          .then(resultadoAssincrono => {
            this.logger.log(
              `Processamento assíncrono concluído - Pendências: ${resultadoAssincrono.pendenciasGeradas}, Aguardando foto: ${resultadoAssincrono.respostasAguardandoFoto.length}`
            );
          })
          .catch(error => {
            this.logger.error('Erro no processamento assíncrono:', error);
          });
      }

      // Adicionar informações básicas de checklists na resposta
      const response = this.formatarTurnoResponse(turnoCompleto);
      if (resultado.checklistsBasicResult) {
        (response as any).checklistsSalvos =
          resultado.checklistsBasicResult.checklistsSalvos;
        (response as any).processamentoAssincrono = 'Em andamento';
      }

      return response;
    } catch (error) {
      handleCrudError(error, this.logger, 'create', 'turno');
    }
  }

  /**
   * Fecha um turno existente
   *
   * @param fecharDto - Dados para fechamento do turno
   * @param allowedContracts - Contratos permitidos para o usuário
   * @returns Turno fechado
   */
  async fecharTurno(
    fecharDto: FecharTurnoDto,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    allowedContracts: ContractPermission[]
  ): Promise<TurnoResponseDto> {
    this.logger.log(`Fechando turno - ID: ${fecharDto.turnoId}`);

    try {
      // Validação de permissões de contrato

      // Validação do ID
      validateId(fecharDto.turnoId, 'ID do turno');

      // Busca o turno
      const turno = await this.buscarTurnoCompleto(fecharDto.turnoId);
      if (!turno) {
        throw new NotFoundException(TURNO_ERRORS.TURNO_NOT_FOUND);
      }

      // Verifica se o turno já está fechado ANTES de validar
      // Se estiver fechado, retorna os dados do turno fechado para o app sincronizar
      if (turno.dataFim) {
        // Retorna um objeto especial que será tratado no controller
        return {
          _alreadyClosed: true,
          id: turno.id,
          dataFim: turno.dataFim,
          KmFim: turno.KmFim,
        } as any;
      }

      // Validações de fechamento
      this.validatePodeFecharTurno(turno, fecharDto);

      // Contexto do usuário
      const userContext = getDefaultUserContext();

      // Dados de auditoria para atualização
      const auditData = updateAuditData(userContext);

      // Atualização do turno
      const turnoFechado = await this.db.getPrisma().turno.update({
        where: { id: fecharDto.turnoId },
        data: {
          dataFim: parseMobileDate(fecharDto.dataFim),
          KmFim: fecharDto.kmFim,
          ...auditData,
        },
        include: {
          veiculo: {
            select: {
              id: true,
              placa: true,
              modelo: true,
            },
          },
          equipe: {
            select: {
              id: true,
              nome: true,
            },
          },
          TurnoEletricistas: {
            include: {
              eletricista: {
                select: {
                  id: true,
                  nome: true,
                  matricula: true,
                },
              },
            },
          },
        },
      });

      this.logger.log(`Turno fechado com sucesso - ID: ${turnoFechado.id}`);

      // Fechar também o TurnoRealizado correspondente para manter sincronização
      // Primeiro tenta buscar pelo turnoId (método preferencial após migração)
      // Se não encontrar, usa fallback por data e equipe
      try {
        const userContext = getDefaultUserContext();
        const executadoPor = String(
          userContext.userId || turnoFechado.updatedBy || 'system'
        );

        // Tentar fechar pelo turnoId primeiro (mais preciso)
        let turnoRealizadoFechado =
          await this.turnoRealizadoService.fecharTurnoPorTurnoId(
            turnoFechado.id,
            executadoPor
          );

        // Se não encontrou pelo turnoId, tentar por data e equipe (fallback para turnos antigos)
        if (!turnoRealizadoFechado) {
          const dataReferencia = new Date(turnoFechado.dataInicio);
          turnoRealizadoFechado =
            await this.turnoRealizadoService.fecharTurnoPorDataEquipe(
              dataReferencia,
              turnoFechado.equipeId,
              executadoPor
            );
        }
      } catch (error: any) {
        // Não falhar o fechamento do Turno se houver erro ao fechar TurnoRealizado
        // Apenas logar o erro para debug
        this.logger.warn(
          `Erro ao fechar TurnoRealizado correspondente (Turno ID: ${turnoFechado.id}): ${error.message}`
        );
      }

      return this.formatarTurnoResponse(turnoFechado);
    } catch (error) {
      handleCrudError(error, this.logger, 'update', 'turno');
    }
  }

  /**
   * Lista turnos com paginação e filtros
   *
   * @param params - Parâmetros de consulta
   * @param allowedContracts - Contratos permitidos para o usuário
   * @returns Lista paginada de turnos
   */
  async findAll(
    params: FindAllParams,
    allowedContracts: ContractPermission[]
  ): Promise<TurnoListResponseDto> {
    this.logger.log(
      `Listando turnos - página: ${params.page}, limite: ${params.limit}, busca: ${params.search || 'nenhuma'}`
    );

    try {
      // Validação de parâmetros de paginação
      validatePaginationParams(params.page, params.limit);
      const { page, limit } = normalizePaginationParams(
        params.page,
        params.limit
      );

      // Construção da cláusula WHERE
      const where = this.buildWhereClause(params, allowedContracts);

      // Consulta com paginação
      const [data, total] = await Promise.all([
        this.db.getPrisma().turno.findMany({
          where,
          orderBy: ORDER_CONFIG.DEFAULT_ORDER,
          skip: (page - 1) * limit,
          take: limit,
          include: {
            veiculo: {
              select: {
                id: true,
                placa: true,
                modelo: true,
              },
            },
            equipe: {
              select: {
                id: true,
                nome: true,
              },
            },
            TurnoEletricistas: {
              include: {
                eletricista: {
                  select: {
                    id: true,
                    nome: true,
                    matricula: true,
                  },
                },
              },
            },
          },
        }),
        this.db.getPrisma().turno.count({ where }),
      ]);

      // Construção dos metadados de paginação
      const meta = buildPaginationMeta(total, page, limit);

      this.logger.log(
        `Listagem de turnos retornou ${data.length} registros de ${total} total`
      );

      return {
        data: data.map(turno => this.formatarTurnoResponse(turno)),
        meta,
        search: params.search,
        timestamp: new Date(),
      };
    } catch (error) {
      handleCrudError(error, this.logger, 'list', 'turnos');
    }
  }

  /**
   * Lista todos os turnos para sincronização mobile
   *
   * @param allowedContracts - Contratos permitidos para o usuário
   * @returns Lista completa de turnos
   */
  async findAllForSync(
    allowedContracts: ContractPermission[]
  ): Promise<TurnoSyncDto[]> {
    this.logger.log('Sincronizando turnos - retorno completo');

    try {
      // Construção da cláusula WHERE
      const where = this.buildWhereClause(
        { page: 1, limit: 1000 },
        allowedContracts
      );

      const data = await withSyncTimeout(
        this.db.getPrisma().turno.findMany({
          where,
          orderBy: ORDER_CONFIG.SYNC_ORDER,
          include: {
            veiculo: {
              select: {
                id: true,
                placa: true,
                modelo: true,
              },
            },
            equipe: {
              select: {
                id: true,
                nome: true,
              },
            },
            TurnoEletricistas: {
              include: {
                eletricista: {
                  select: {
                    id: true,
                    nome: true,
                    matricula: true,
                  },
                },
              },
            },
          },
        })
      );

      this.logger.log(
        `Sincronização de turnos retornou ${data.length} registros`
      );
      return data.map(turno => this.formatarTurnoSync(turno));
    } catch (error) {
      handleCrudError(error, this.logger, 'sync', 'turnos');
    }
  }

  /**
   * Busca um turno por ID
   *
   * @param id - ID do turno
   * @param allowedContracts - Contratos permitidos para o usuário
   * @returns Turno encontrado
   */
  async findOne(
    id: number,
    allowedContracts: ContractPermission[]
  ): Promise<TurnoResponseDto> {
    this.logger.log(`Buscando turno com ID: ${id}`);

    try {
      // Validação do ID
      validateId(id, 'ID do turno');

      // Construção da cláusula WHERE
      const where = this.buildWhereClause(
        { page: 1, limit: 1000 },
        allowedContracts,
        id
      );

      const turno = await this.db.getPrisma().turno.findFirst({
        where,
        include: {
          veiculo: {
            select: {
              id: true,
              placa: true,
              modelo: true,
            },
          },
          equipe: {
            select: {
              id: true,
              nome: true,
            },
          },
          TurnoEletricistas: {
            include: {
              eletricista: {
                select: {
                  id: true,
                  nome: true,
                  matricula: true,
                },
              },
            },
          },
        },
      });

      if (!turno) {
        throw new NotFoundException(TURNO_ERRORS.TURNO_NOT_FOUND);
      }

      this.logger.log(`Turno encontrado: ${turno.id}`);
      return this.formatarTurnoResponse(turno);
    } catch (error) {
      handleCrudError(error, this.logger, 'find', 'turno');
    }
  }

  /**
   * Remove um turno (soft delete)
   *
   * @param id - ID do turno
   * @param allowedContracts - Contratos permitidos para o usuário
   * @returns Turno removido
   */
  async remove(
    id: number,
    allowedContracts: ContractPermission[]
  ): Promise<TurnoResponseDto> {
    this.logger.log(`Removendo turno com ID: ${id}`);

    try {
      // Validação do ID
      validateId(id, 'ID do turno');

      // Verificação de existência
      await this.findOne(id, allowedContracts);

      // Contexto do usuário
      const userContext = getDefaultUserContext();

      // Dados de auditoria para exclusão
      const auditData = deleteAuditData(userContext);

      // Soft delete do turno
      const turnoRemovido = await this.db.getPrisma().turno.update({
        where: { id },
        data: auditData,
        include: {
          veiculo: {
            select: {
              id: true,
              placa: true,
              modelo: true,
            },
          },
          equipe: {
            select: {
              id: true,
              nome: true,
            },
          },
          TurnoEletricistas: {
            include: {
              eletricista: {
                select: {
                  id: true,
                  nome: true,
                  matricula: true,
                },
              },
            },
          },
        },
      });

      this.logger.log(`Turno removido com sucesso: ${turnoRemovido.id}`);
      return this.formatarTurnoResponse(turnoRemovido);
    } catch (error) {
      handleCrudError(error, this.logger, 'delete', 'turno');
    }
  }

  /**
   * Conta o total de turnos
   *
   * @param allowedContracts - Contratos permitidos para o usuário
   * @returns Total de turnos
   */
  async count(allowedContracts: ContractPermission[]): Promise<number> {
    this.logger.log('Contando turnos');

    try {
      const where = this.buildWhereClause(
        { page: 1, limit: 1000 },
        allowedContracts
      );
      return await this.db.getPrisma().turno.count({ where });
    } catch (error) {
      handleCrudError(error, this.logger, 'count', 'turnos');
    }
  }

  /**
   * Valida se as entidades existem
   */
  private async validateEntidadesExistem(
    abrirDto: AbrirTurnoDto
  ): Promise<void> {
    // ✅ Validar que arrays não estão vazios antes de usar
    if (!abrirDto.eletricistas || abrirDto.eletricistas.length === 0) {
      throw new BadRequestException(
        'Pelo menos um eletricista é obrigatório para abrir um turno'
      );
    }

    const prisma = this.db.getPrisma();

    // ✅ Paralelizar validações de existência usando helpers centralizados
    await Promise.all([
      // Validação do veículo
      ensureEntityExists(
        prisma,
        'veiculo',
        abrirDto.veiculoId,
        TURNO_ERRORS.VEICULO_NOT_FOUND
      ),
      // Validação da equipe
      ensureEntityExists(
        prisma,
        'equipe',
        abrirDto.equipeId,
        TURNO_ERRORS.EQUIPE_NOT_FOUND
      ),
      // Validação dos eletricistas (paralelizada)
      ...abrirDto.eletricistas.map(eletricistaDto =>
        ensureEntityExists(
          prisma,
          'eletricista',
          eletricistaDto.eletricistaId,
          TURNO_ERRORS.ELETRICISTA_NOT_FOUND
        )
      ),
    ]);
  }

  /**
   * Valida dados de abertura
   */
  private validateDadosAbertura(abrirDto: AbrirTurnoDto): void {
    const dataInicio = parseMobileDate(abrirDto.dataInicio);
    const agora = new Date();

    // Validação de data de início (não pode ser muito no futuro)
    const diferencaHoras =
      (dataInicio.getTime() - agora.getTime()) / (1000 * 60 * 60);
    if (diferencaHoras > 24) {
      throw new BadRequestException(
        'Data de início não pode ser mais de 24 horas no futuro'
      );
    }

    // Validação de data de início (não pode ser muito no passado)
    if (diferencaHoras < -24) {
      throw new BadRequestException(
        'Data de início não pode ser mais de 24 horas no passado'
      );
    }
  }

  /**
   * Valida se o turno pode ser fechado
   */
  private validatePodeFecharTurno(turno: any, fecharDto: FecharTurnoDto): void {
    // Verifica se o turno já está fechado
    if (turno.dataFim) {
      throw new ConflictException(TURNO_ERRORS.TURNO_JA_FECHADO);
    }

    // Validação de quilometragem
    if (fecharDto.kmFim <= turno.kmInicio) {
      throw new BadRequestException(
        'Quilometragem de fechamento deve ser maior que a de abertura'
      );
    }

    // Validação de data de fechamento
    const dataFim = parseMobileDate(fecharDto.dataFim);
    const dataInicio = parseMobileDate(turno.dataInicio.toISOString());

    if (dataFim <= dataInicio) {
      throw new BadRequestException(
        'Data de fechamento deve ser posterior à data de abertura'
      );
    }

    // Validação de data de fechamento (não pode ser muito no futuro)
    const agora = new Date();
    const diferencaHoras =
      (dataFim.getTime() - agora.getTime()) / (1000 * 60 * 60);
    if (diferencaHoras > 1) {
      throw new BadRequestException(
        'Data de fechamento não pode ser mais de 1 hora no futuro'
      );
    }
  }

  /**
   * Busca turno completo com relacionamentos
   */
  private async buscarTurnoCompleto(id: number): Promise<any> {
    return this.db.getPrisma().turno.findUnique({
      where: { id },
      include: {
        veiculo: {
          select: {
            id: true,
            placa: true,
            modelo: true,
          },
        },
        equipe: {
          select: {
            id: true,
            nome: true,
          },
        },
        TurnoEletricistas: {
          include: {
            eletricista: {
              select: {
                id: true,
                nome: true,
                matricula: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Formata turno para resposta
   */
  private formatarTurnoResponse(turno: any): TurnoResponseDto {
    return {
      id: turno.id,
      dataSolicitacao: turno.dataSolicitacao,
      dataInicio: turno.dataInicio,
      dataFim: turno.dataFim,
      veiculoId: turno.veiculoId,
      veiculoPlaca: turno.veiculo.placa,
      veiculoModelo: turno.veiculo.modelo,
      equipeId: turno.equipeId,
      equipeNome: turno.equipe.nome,
      dispositivo: turno.dispositivo,
      kmInicio: turno.kmInicio,
      kmFim: turno.KmFim,
      status: turno.dataFim ? TURNO_STATUS.FECHADO : TURNO_STATUS.ABERTO,
      eletricistas: turno.TurnoEletricistas.map((te: any) => ({
        id: te.eletricista.id,
        nome: te.eletricista.nome,
        matricula: te.eletricista.matricula,
      })),
      createdAt: turno.createdAt,
      createdBy: turno.createdBy,
      updatedAt: turno.updatedAt,
      updatedBy: turno.updatedBy,
      deletedAt: turno.deletedAt,
      deletedBy: turno.deletedBy,
    };
  }

  /**
   * Formata turno para sincronização
   */
  private formatarTurnoSync(turno: any): TurnoSyncDto {
    return {
      id: turno.id,
      dataSolicitacao: turno.dataSolicitacao,
      dataInicio: turno.dataInicio,
      dataFim: turno.dataFim,
      veiculoId: turno.veiculoId,
      veiculoPlaca: turno.veiculo.placa,
      veiculoModelo: turno.veiculo.modelo,
      equipeId: turno.equipeId,
      equipeNome: turno.equipe.nome,
      dispositivo: turno.dispositivo,
      kmInicio: turno.kmInicio,
      kmFim: turno.KmFim,
      status: turno.dataFim ? TURNO_STATUS.FECHADO : TURNO_STATUS.ABERTO,
      eletricistas: turno.TurnoEletricistas.map((te: any) => ({
        id: te.eletricista.id,
        nome: te.eletricista.nome,
        matricula: te.eletricista.matricula,
        createdAt: te.createdAt,
        createdBy: te.createdBy,
        updatedAt: te.updatedAt,
        updatedBy: te.updatedBy,
        deletedAt: te.deletedAt,
        deletedBy: te.deletedBy,
      })),
      createdAt: turno.createdAt,
      createdBy: turno.createdBy,
      updatedAt: turno.updatedAt,
      updatedBy: turno.updatedBy,
      deletedAt: turno.deletedAt,
      deletedBy: turno.deletedBy,
    };
  }

  /**
   * Constrói a cláusula WHERE para consultas
   */
  private buildWhereClause(
    params: FindAllParams,
    allowedContracts: ContractPermission[],
    id?: number
  ) {
    this.logger.debug(
      `[buildWhereClause] Parâmetros recebidos: ${JSON.stringify(params)}`
    );

    const where: any = {
      deletedAt: null,
    };

    // Filtro por ID específico
    if (id) {
      where.id = id;
    }

    // Filtro por busca
    if (params.search) {
      where.OR = [
        {
          veiculo: { placa: { contains: params.search, mode: 'insensitive' } },
        },
        { equipe: { nome: { contains: params.search, mode: 'insensitive' } } },
        { dispositivo: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    // Filtro por veículo
    if (params.veiculoId) {
      where.veiculoId = params.veiculoId;
    }

    // Filtro por equipe
    if (params.equipeId) {
      where.equipeId = params.equipeId;
    }

    // Filtro por eletricista
    if (params.eletricistaId) {
      where.TurnoEletricistas = {
        some: {
          eletricistaId: params.eletricistaId,
          deletedAt: null,
        },
      };
    }

    // Filtro por status
    if (params.status) {
      this.logger.debug(`[buildWhereClause] Status: ${params.status}`);
      if (params.status === TURNO_STATUS.ABERTO) {
        where.dataFim = null;
        this.logger.debug(
          '[buildWhereClause] Aplicando filtro: dataFim = null'
        );
      } else if (params.status === TURNO_STATUS.FECHADO) {
        where.dataFim = { not: null };
        this.logger.debug(
          '[buildWhereClause] Aplicando filtro: dataFim != null'
        );
      }
    }

    // Filtro por data de início
    if (params.dataInicio) {
      where.dataInicio = {
        gte: new Date(params.dataInicio),
      };
      this.logger.debug(
        `[buildWhereClause] Filtro dataInicio >= ${params.dataInicio}`
      );
    }

    // Filtro por data de fim
    if (params.dataFim) {
      where.dataInicio = {
        ...where.dataInicio,
        lte: new Date(params.dataFim),
      };
      this.logger.debug(
        `[buildWhereClause] Filtro dataInicio <= ${params.dataFim}`
      );
    }

    // Filtro por contratos permitidos (placeholder - turnos não têm contrato direto)
    const allowedContractIds = extractAllowedContractIds(allowedContracts);
    if (allowedContractIds && allowedContractIds.length > 0) {
      // Por enquanto, não aplicamos filtro de contrato
      // where.contratoId = { in: allowedContractIds };
    }

    this.logger.debug(
      `[buildWhereClause] WHERE final: ${JSON.stringify(where)}`
    );

    return where;
  }
}
