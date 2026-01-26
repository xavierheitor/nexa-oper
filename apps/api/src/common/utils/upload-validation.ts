/**
 * Helper para validação de arquivos de upload.
 */

import { BadRequestException } from '@nestjs/common';

/**
 * Valida um arquivo de upload e lança exceções se não atender aos critérios.
 *
 * @param params - Parâmetros de validação
 * @param params.file - Arquivo a ser validado
 * @param params.maxSize - Tamanho máximo permitido em bytes
 * @param params.allowedMimeTypes - Array de tipos MIME permitidos
 * @param params.invalidTypeMessage - Mensagem de erro quando o tipo MIME não é permitido
 * @param params.sizeExceededMessage - Mensagem de erro quando o tamanho excede o máximo
 * @throws {BadRequestException} Se o tipo MIME não for permitido
 * @throws {BadRequestException} Se o tamanho exceder o máximo permitido
 */
export function validateFileOrThrow(params: {
  file: Express.Multer.File;
  maxSize: number;
  allowedMimeTypes: readonly string[];
  invalidTypeMessage: string;
  sizeExceededMessage: string;
}): void {
  const { file, maxSize, allowedMimeTypes, invalidTypeMessage, sizeExceededMessage } = params;

  // Validar tipo de arquivo
  if (
    !allowedMimeTypes.includes(
      file.mimetype as (typeof allowedMimeTypes)[number]
    )
  ) {
    throw new BadRequestException(invalidTypeMessage);
  }

  // Validar tamanho
  if (file.size > maxSize) {
    throw new BadRequestException(sizeExceededMessage);
  }
}
