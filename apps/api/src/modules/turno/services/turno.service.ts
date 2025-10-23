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
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '@database/database.service';
import { ContractPermission } from '@modules/engine/auth/services/contract-permissions.service';
import { extractAllowedContractIds } from '@modules/engine/auth/utils/contract-helpers';
import {
  buildPaginationMeta,
  validatePaginationParams,
  normalizePaginationParams,
} from '@common/utils/pagination';
import { validateId } from '@common/utils/validation';
import {
  getDefaultUserContext,
  createAuditData,
  updateAuditData,
  deleteAuditData,
} from '@common/utils/audit';
import { parseMobileDate } from '@common/utils/date-timezone';
import {
  ORDER_CONFIG,
  ERROR_MESSAGES as TURNO_ERRORS,
  TURNO_STATUS,
} from '../constants/turno.constants';
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
 * Interface para contexto de usuário (placeholder)
 */
interface UserContext {
  userId: string;
  userName: string;
  roles: string[];
}

/**
 * Serviço responsável pelas operações de turnos
 */
@Injectable()
export class TurnoService {
  private readonly logger = new Logger(TurnoService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly checklistPreenchidoService: ChecklistPreenchidoService
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
    allowedContracts: ContractPermission[]
  ): Promise<TurnoResponseDto> {
    this.logger.log(
      `Abrindo turno - Veículo: ${abrirDto.veiculoId}, Equipe: ${abrirDto.equipeId}`
    );

    try {
      // Validação de permissões de contrato
      const allowedContractIds = extractAllowedContractIds(allowedContracts);
      // Por enquanto, turnos não têm restrição de contrato direta
      // mas mantemos a estrutura para futuras implementações

      // Validações de existência
      await this.validateEntidadesExistem(abrirDto);

      // Validações de conflito
      await this.validateNaoHaConflitos(abrirDto);

      // Validações de negócio
      this.validateDadosAbertura(abrirDto);

      // Contexto do usuário
      const userContext = getDefaultUserContext();

      // Dados de auditoria para criação
      const auditData = createAuditData(userContext);

      // Usar transação para garantir atomicidade
      const resultado = await this.db
        .getPrisma()
        .$transaction(async transaction => {
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
              ...auditData,
            })),
          });

          // Salvar checklists se fornecidos
          let checklistsResult = null;
          if (abrirDto.checklists && abrirDto.checklists.length > 0) {
            checklistsResult =
              await this.checklistPreenchidoService.salvarChecklistsDoTurno(
                turno.id,
                abrirDto.checklists,
                transaction
              );
          }

          return { turno, checklistsResult };
        });

      // Busca o turno completo com relacionamentos
      const turnoCompleto = await this.buscarTurnoCompleto(resultado.turno.id);

      this.logger.log(`Turno aberto com sucesso - ID: ${resultado.turno.id}`);

      // Adicionar informações de checklists na resposta se disponíveis
      const response = this.formatarTurnoResponse(turnoCompleto);
      if (resultado.checklistsResult) {
        (response as any).checklistsSalvos =
          resultado.checklistsResult.checklistsSalvos;
        (response as any).pendenciasGeradas =
          resultado.checklistsResult.pendenciasGeradas;
        (response as any).respostasAguardandoFoto =
          resultado.checklistsResult.respostasAguardandoFoto;
      }

      return response;
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error('Erro ao abrir turno:', error);
      throw new BadRequestException('Erro ao abrir turno');
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
    allowedContracts: ContractPermission[]
  ): Promise<TurnoResponseDto> {
    this.logger.log(`Fechando turno - ID: ${fecharDto.turnoId}`);

    try {
      // Validação de permissões de contrato
      const allowedContractIds = extractAllowedContractIds(allowedContracts);

      // Validação do ID
      validateId(fecharDto.turnoId, 'ID do turno');

      // Busca o turno
      const turno = await this.buscarTurnoCompleto(fecharDto.turnoId);
      if (!turno) {
        throw new NotFoundException(TURNO_ERRORS.TURNO_NOT_FOUND);
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
      return this.formatarTurnoResponse(turnoFechado);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error('Erro ao fechar turno:', error);
      throw new BadRequestException('Erro ao fechar turno');
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
      const meta = buildPaginationMeta(page, limit, total);

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
      this.logger.error('Erro ao listar turnos:', error);
      throw new BadRequestException('Erro ao listar turnos');
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

      const data = await this.db.getPrisma().turno.findMany({
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
      });

      this.logger.log(
        `Sincronização de turnos retornou ${data.length} registros`
      );
      return data.map(turno => this.formatarTurnoSync(turno));
    } catch (error) {
      this.logger.error('Erro ao sincronizar turnos:', error);
      throw new BadRequestException('Erro ao sincronizar turnos');
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
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Erro ao buscar turno:', error);
      throw new BadRequestException('Erro ao buscar turno');
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
      const turno = await this.findOne(id, allowedContracts);

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
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Erro ao remover turno:', error);
      throw new BadRequestException('Erro ao remover turno');
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
      this.logger.error('Erro ao contar turnos:', error);
      throw new BadRequestException('Erro ao contar turnos');
    }
  }

  /**
   * Valida se as entidades existem
   */
  private async validateEntidadesExistem(
    abrirDto: AbrirTurnoDto
  ): Promise<void> {
    // Validação do veículo
    const veiculo = await this.db.getPrisma().veiculo.findFirst({
      where: { id: abrirDto.veiculoId, deletedAt: null },
    });
    if (!veiculo) {
      throw new NotFoundException(TURNO_ERRORS.VEICULO_NOT_FOUND);
    }

    // Validação da equipe
    const equipe = await this.db.getPrisma().equipe.findFirst({
      where: { id: abrirDto.equipeId, deletedAt: null },
    });
    if (!equipe) {
      throw new NotFoundException(TURNO_ERRORS.EQUIPE_NOT_FOUND);
    }

    // Validação dos eletricistas
    for (const eletricistaDto of abrirDto.eletricistas) {
      const eletricista = await this.db.getPrisma().eletricista.findFirst({
        where: { id: eletricistaDto.eletricistaId, deletedAt: null },
      });
      if (!eletricista) {
        throw new NotFoundException(TURNO_ERRORS.ELETRICISTA_NOT_FOUND);
      }
    }
  }

  /**
   * Valida se não há conflitos de turno aberto
   */
  private async validateNaoHaConflitos(abrirDto: AbrirTurnoDto): Promise<void> {
    // Verifica se já existe turno aberto para o veículo
    const turnoVeiculo = await this.db.getPrisma().turno.findFirst({
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
    const turnoEquipe = await this.db.getPrisma().turno.findFirst({
      where: {
        equipeId: abrirDto.equipeId,
        dataFim: null,
        deletedAt: null,
      },
    });
    if (turnoEquipe) {
      throw new ConflictException(TURNO_ERRORS.TURNO_JA_ABERTO_EQUIPE);
    }

    // Verifica se já existe turno aberto para algum eletricista
    for (const eletricistaDto of abrirDto.eletricistas) {
      const turnoEletricista = await this.db.getPrisma().turno.findFirst({
        where: {
          TurnoEletricistas: {
            some: {
              eletricistaId: eletricistaDto.eletricistaId,
              deletedAt: null,
            },
          },
          dataFim: null,
          deletedAt: null,
        },
      });
      if (turnoEletricista) {
        throw new ConflictException(TURNO_ERRORS.TURNO_JA_ABERTO_ELETRICISTA);
      }
    }
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
      if (params.status === TURNO_STATUS.ABERTO) {
        where.dataFim = null;
      } else if (params.status === TURNO_STATUS.FECHADO) {
        where.dataFim = { not: null };
      }
    }

    // Filtro por data de início
    if (params.dataInicio) {
      where.dataInicio = {
        gte: new Date(params.dataInicio),
      };
    }

    // Filtro por data de fim
    if (params.dataFim) {
      where.dataInicio = {
        ...where.dataInicio,
        lte: new Date(params.dataFim),
      };
    }

    // Filtro por contratos permitidos (placeholder - turnos não têm contrato direto)
    const allowedContractIds = extractAllowedContractIds(allowedContracts);
    if (allowedContractIds && allowedContractIds.length > 0) {
      // Por enquanto, não aplicamos filtro de contrato
      // where.contratoId = { in: allowedContractIds };
    }

    return where;
  }
}
