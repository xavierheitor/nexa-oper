/**
 * Serviço para Tipos de Justificativa
 *
 * Implementa lógica de negócio para CRUD de tipos de justificativa
 */

import { TipoJustificativa } from '@nexa-oper/db';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import { TipoJustificativaRepository } from '../../repositories/justificativas/TipoJustificativaRepository';
import {
  criarTipoJustificativaSchema,
  atualizarTipoJustificativaSchema,
  listarTiposJustificativaSchema,
  type CriarTipoJustificativaInput,
  type AtualizarTipoJustificativaInput,
  type ListarTiposJustificativaInput,
} from '../../schemas/tipoJustificativaSchema';

export class TipoJustificativaService extends AbstractCrudService<
  CriarTipoJustificativaInput,
  AtualizarTipoJustificativaInput,
  ListarTiposJustificativaInput,
  TipoJustificativa
> {
  private tipoRepo: TipoJustificativaRepository;

  constructor() {
    const repo = new TipoJustificativaRepository();
    super(repo);
    this.tipoRepo = repo;
  }

  /**
   * Cria um novo tipo de justificativa
   * Valida se já existe tipo com o mesmo nome
   */
  async create(raw: any, userId: string): Promise<TipoJustificativa> {
    const { createdBy, createdAt, ...businessData } = raw;
    const data = criarTipoJustificativaSchema.parse(businessData);

    // Validar se já existe tipo com o mesmo nome
    const existente = await this.tipoRepo.findByNome(data.nome);
    if (existente) {
      throw new Error('Já existe um tipo de justificativa com este nome');
    }

    return this.tipoRepo.create({
      nome: data.nome,
      descricao: data.descricao,
      ativo: data.ativo,
      geraFalta: data.geraFalta,
      createdBy: userId,
    });
  }

  /**
   * Atualiza um tipo de justificativa existente
   * Valida se o novo nome não está em uso por outro tipo
   */
  async update(raw: any, userId: string): Promise<TipoJustificativa> {
    const { updatedBy, updatedAt, ...businessData } = raw;
    const data = atualizarTipoJustificativaSchema.parse(businessData);

    // Validar se novo nome não está em uso
    if (data.nome) {
      const existente = await this.tipoRepo.findByNome(data.nome);
      if (existente && existente.id !== data.id) {
        throw new Error('Já existe um tipo de justificativa com este nome');
      }
    }

    const { id, ...updateData } = data;
    return this.tipoRepo.update(id, updateData);
  }

  /**
   * Lista todos os tipos (sem paginação) - útil para selects/dropdowns
   */
  async listAll(ativo?: boolean) {
    return this.tipoRepo.listAll(ativo);
  }
}

