/**
 * Serviço para Contratos
 *
 * Este serviço implementa a lógica de negócio para operações
 * relacionadas a contratos, incluindo validação, transformação
 * de dados e integração com o repositório.
 *
 * FUNCIONALIDADES:
 * - Validação de dados com Zod
 * - Lógica de negócio centralizada
 * - Integração com repositório
 * - Tratamento de erros
 * - Auditoria automática
 *
 * COMO USAR:
 * ```typescript
 * const service = new ContratoService();
 * const contrato = await service.create(data, userId);
 * const contratos = await service.list(filterParams);
 * ```
 */

import { ContratoRepository } from '@/lib/repositories/catalogo/ContratoRepository';
import {
  contratoCreateSchema,
  contratoFilterSchema,
  contratoUpdateSchema,
} from '@/lib/schemas/contratoSchema';
import { Contrato } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';

// Tipos derivados dos schemas
type ContratoCreate = z.infer<typeof contratoCreateSchema>;
type ContratoUpdate = z.infer<typeof contratoUpdateSchema>;
type ContratoFilter = z.infer<typeof contratoFilterSchema>;

export class ContratoService extends AbstractCrudService<
  ContratoCreate,
  ContratoUpdate,
  ContratoFilter,
  Contrato
> {
  /**
   * Construtor do serviço
   *
   * Inicializa o repositório e registra o serviço no container
   */
  constructor() {
    super(new ContratoRepository());
  }

  /**
   * Cria um novo contrato
   *
   * @param raw - Dados brutos do contrato
   * @param userId - ID do usuário que está criando
   * @returns Contrato criado
   */
  async create(raw: any, _userId: string): Promise<Contrato> {
    // Extrai campos de auditoria adicionados pelo handleServerAction
    const { createdBy, createdAt, ...businessData } = raw;

    // Valida os dados de negócio
    const data = contratoCreateSchema.parse(businessData);

    // Reconstrói com auditoria
    return this.repo.create({
      ...data,
      ...(createdBy && { createdBy }),
      ...(createdAt && { createdAt }),
    } as any);
  }

  /**
   * Atualiza um contrato existente
   *
   * @param raw - Dados brutos do contrato
   * @param userId - ID do usuário que está atualizando
   * @returns Contrato atualizado
   */
  async update(raw: any, _userId: string): Promise<Contrato> {
    // Extrai campos de auditoria adicionados pelo handleServerAction
    const { updatedBy, updatedAt, ...businessData } = raw;

    // Valida os dados de negócio
    const data = contratoUpdateSchema.parse(businessData);
    const { id, ...rest } = data;

    // Reconstrói com auditoria
    return this.repo.update(id, {
      ...rest,
      ...(updatedBy && { updatedBy }),
      ...(updatedAt && { updatedAt }),
    } as any);
  }

}
