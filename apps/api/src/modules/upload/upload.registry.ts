import { Injectable } from '@nestjs/common';
import { AppError } from '../../core/errors/app-error';
import type {
  EvidenceHandler,
  MetadataSpec,
} from './evidence/evidence.handler';

/**
 * Registro central de handlers de upload.
 *
 * Permite registrar implementações de `EvidenceHandler` e recuperá-las
 * pelo tipo (string id).
 */
@Injectable()
export class UploadRegistry {
  private handlers = new Map<string, EvidenceHandler>();

  /**
   * Registra um novo handler.
   *
   * @param handler - Instância do handler a ser registrado.
   */
  register(handler: EvidenceHandler) {
    this.handlers.set(handler.type, handler);
  }

  /**
   * Obtém um handler pelo tipo.
   *
   * @param type - Identificador do tipo (ex: 'checklist-reprova').
   * @returns O handler correspondente.
   * @throws {AppError} Se o tipo não estiver registrado.
   */
  get(type: string): EvidenceHandler {
    const handler = this.handlers.get(type);
    if (!handler) {
      throw AppError.validation(`Tipo de upload não suportado: ${type}`);
    }
    return handler;
  }

  /**
   * Lista todos os tipos de upload registrados.
   *
   * @returns Array de strings com os tipos.
   */
  listTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Obtém a especificação de metadados para um tipo.
   *
   * @param type - Tipo de upload.
   * @returns A especificação de metadados ou undefined.
   */
  getMetadataSpec(type: string): MetadataSpec | undefined {
    return this.handlers.get(type)?.metadataSpec;
  }
}
