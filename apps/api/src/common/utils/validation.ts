/**
 * Utilitários de Validação Compartilhados
 *
 * Centraliza validações comuns para evitar duplicação
 * entre diferentes módulos da aplicação.
 */

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VALIDATION_ERRORS, ERROR_MESSAGES } from '../constants/errors';
import { PrismaClient } from '@nexa-oper/db';
import { PrismaTransactionClient } from '@common/types/prisma';

/**
 * Valida se um ID é válido (número inteiro positivo)
 */
export function validateId(id: number, fieldName = 'ID'): void {
  if (!id || !Number.isInteger(id) || id <= 0) {
    throw new BadRequestException(
      `${fieldName} deve ser um número inteiro positivo`
    );
  }
}

/**
 * Valida se um ID opcional é válido quando fornecido
 */
export function validateOptionalId(
  id: number | undefined,
  fieldName = 'ID'
): void {
  if (id !== undefined && (!Number.isInteger(id) || id <= 0)) {
    throw new BadRequestException(
      `${fieldName} deve ser um número inteiro positivo`
    );
  }
}

/**
 * Valida se uma string não está vazia após trim
 */
export function validateRequiredString(
  value: string | undefined,
  fieldName: string
): void {
  if (!value || value.trim().length === 0) {
    throw new BadRequestException(`${fieldName} é obrigatório`);
  }
}

/**
 * Valida tamanho de string
 */
export function validateStringLength(
  value: string,
  fieldName: string,
  minLength: number,
  maxLength: number
): void {
  if (value.length < minLength) {
    throw new BadRequestException(
      `${fieldName} deve ter pelo menos ${minLength} caracteres`
    );
  }

  if (value.length > maxLength) {
    throw new BadRequestException(
      `${fieldName} deve ter no máximo ${maxLength} caracteres`
    );
  }
}

/**
 * Valida formato de placa de veículo (ABC1234 ou ABC1D23)
 */
export function validatePlacaFormat(placa: string): void {
  const placaRegex = /^[A-Z]{3}\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/;
  if (!placaRegex.test(placa)) {
    throw new BadRequestException(VALIDATION_ERRORS.PLACA_INVALID_FORMAT);
  }
}

/**
 * Valida formato de telefone ((XX) XXXXX-XXXX)
 */
export function validateTelefoneFormat(telefone: string): void {
  const telefoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
  if (!telefoneRegex.test(telefone)) {
    throw new BadRequestException(VALIDATION_ERRORS.TELEFONE_INVALID_FORMAT);
  }
}

/**
 * Valida formato de estado (2 letras maiúsculas)
 */
export function validateEstadoFormat(estado: string): void {
  const estadoRegex = /^[A-Z]{2}$/;
  if (!estadoRegex.test(estado)) {
    throw new BadRequestException(VALIDATION_ERRORS.ESTADO_INVALID_FORMAT);
  }
}

/**
 * Valida ano (entre 1900 e ano atual + 1)
 */
export function validateAno(ano: number): void {
  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(ano) || ano < 1900 || ano > currentYear + 1) {
    throw new BadRequestException(
      `Ano deve estar entre 1900 e ${currentYear + 1}`
    );
  }
}

/**
 * Valida se um valor está em uma lista de opções válidas
 */
export function validateEnumValue<T>(
  value: T,
  validValues: readonly T[],
  fieldName: string
): void {
  if (!validValues.includes(value)) {
    throw new BadRequestException(
      `${fieldName} deve ser um dos seguintes valores: ${validValues.join(', ')}`
    );
  }
}

/**
 * Valida se uma entidade existe no banco de dados
 *
 * Helper genérico para validar existência de entidades com soft delete.
 * Usa o PrismaClient ou PrismaTransactionClient para fazer a consulta.
 *
 * @param prisma - Cliente Prisma (pode ser transação ou cliente normal)
 * @param modelName - Nome do modelo Prisma (ex: 'contrato', 'tipoVeiculo')
 * @param id - ID da entidade a validar
 * @param errorMessage - Mensagem de erro a lançar se não encontrado
 * @returns Promise que resolve se a entidade existe
 * @throws NotFoundException se a entidade não for encontrada
 *
 * @example
 * ```typescript
 * // Validar contrato
 * await ensureEntityExists(
 *   this.db.getPrisma(),
 *   'contrato',
 *   contratoId,
 *   ERROR_MESSAGES.CONTRATO_NOT_FOUND
 * );
 *
 * // Validar dentro de transação
 * await prisma.$transaction(async tx => {
 *   await ensureEntityExists(
 *     tx,
 *     'tipoVeiculo',
 *     tipoVeiculoId,
 *     ERROR_MESSAGES.TIPO_VEICULO_NOT_FOUND
 *   );
 * });
 * ```
 */
export async function ensureEntityExists(
  prisma: PrismaClient | PrismaTransactionClient,
  modelName: 'contrato' | 'tipoVeiculo' | 'tipoEquipe' | 'veiculo' | 'equipe' | 'eletricista',
  id: number,
  errorMessage: string
): Promise<void> {
  const entity = await (prisma as any)[modelName].findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!entity) {
    throw new NotFoundException(errorMessage);
  }
}

/**
 * Valida se um contrato existe
 *
 * Helper específico para validação de contratos.
 * Usa o helper genérico ensureEntityExists internamente.
 *
 * @param prisma - Cliente Prisma (pode ser transação ou cliente normal)
 * @param contratoId - ID do contrato a validar
 * @throws NotFoundException se o contrato não for encontrado
 *
 * @example
 * ```typescript
 * await ensureContratoExists(this.db.getPrisma(), contratoId);
 * ```
 */
export async function ensureContratoExists(
  prisma: PrismaClient | PrismaTransactionClient,
  contratoId: number
): Promise<void> {
  await ensureEntityExists(
    prisma,
    'contrato',
    contratoId,
    ERROR_MESSAGES.CONTRATO_NOT_FOUND
  );
}

/**
 * Valida se um tipo de veículo existe
 *
 * Helper específico para validação de tipos de veículo.
 *
 * @param prisma - Cliente Prisma (pode ser transação ou cliente normal)
 * @param tipoVeiculoId - ID do tipo de veículo a validar
 * @throws NotFoundException se o tipo de veículo não for encontrado
 *
 * @example
 * ```typescript
 * await ensureTipoVeiculoExists(this.db.getPrisma(), tipoVeiculoId);
 * ```
 */
export async function ensureTipoVeiculoExists(
  prisma: PrismaClient | PrismaTransactionClient,
  tipoVeiculoId: number
): Promise<void> {
  await ensureEntityExists(
    prisma,
    'tipoVeiculo',
    tipoVeiculoId,
    ERROR_MESSAGES.TIPO_VEICULO_NOT_FOUND
  );
}

/**
 * Valida se um tipo de equipe existe
 *
 * Helper específico para validação de tipos de equipe.
 *
 * @param prisma - Cliente Prisma (pode ser transação ou cliente normal)
 * @param tipoEquipeId - ID do tipo de equipe a validar
 * @throws NotFoundException se o tipo de equipe não for encontrado
 *
 * @example
 * ```typescript
 * await ensureTipoEquipeExists(this.db.getPrisma(), tipoEquipeId);
 * ```
 */
export async function ensureTipoEquipeExists(
  prisma: PrismaClient | PrismaTransactionClient,
  tipoEquipeId: number
): Promise<void> {
  await ensureEntityExists(
    prisma,
    'tipoEquipe',
    tipoEquipeId,
    ERROR_MESSAGES.TIPO_EQUIPE_NOT_FOUND
  );
}
