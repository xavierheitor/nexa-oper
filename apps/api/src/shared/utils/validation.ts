/**
 * Utilitários de Validação Compartilhados
 *
 * Centraliza validações comuns para evitar duplicação
 * entre diferentes módulos da aplicação.
 */

import { BadRequestException } from '@nestjs/common';
import { VALIDATION_ERRORS } from '../constants/errors';

/**
 * Valida se um ID é válido (número inteiro positivo)
 */
export function validateId(id: number, fieldName = 'ID'): void {
  if (!id || !Number.isInteger(id) || id <= 0) {
    throw new BadRequestException(`${fieldName} deve ser um número inteiro positivo`);
  }
}

/**
 * Valida se um ID opcional é válido quando fornecido
 */
export function validateOptionalId(id: number | undefined, fieldName = 'ID'): void {
  if (id !== undefined && (!Number.isInteger(id) || id <= 0)) {
    throw new BadRequestException(`${fieldName} deve ser um número inteiro positivo`);
  }
}

/**
 * Valida se uma string não está vazia após trim
 */
export function validateRequiredString(value: string | undefined, fieldName: string): void {
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
    throw new BadRequestException(`${fieldName} deve ter pelo menos ${minLength} caracteres`);
  }

  if (value.length > maxLength) {
    throw new BadRequestException(`${fieldName} deve ter no máximo ${maxLength} caracteres`);
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
    throw new BadRequestException(`Ano deve estar entre 1900 e ${currentYear + 1}`);
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
