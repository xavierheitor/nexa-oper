/**
 * Constantes compartilhadas para o módulo de uploads mobile.
 */

import { join } from 'path';

/**
 * Diretório base (absoluto) onde as fotos enviadas pelo mobile serão armazenadas.
 * Configurável via variável de ambiente UPLOAD_ROOT
 */
export const MOBILE_PHOTO_UPLOAD_ROOT = process.env.UPLOAD_ROOT
  ? join(process.env.UPLOAD_ROOT, 'mobile', 'photos')
  : join(process.cwd(), 'uploads', 'mobile', 'photos');

/**
 * URL base pública para acesso às fotos.
 * Se UPLOAD_BASE_URL estiver configurada, será usada como base (ex: https://storage.nexaoper.com.br).
 * Caso contrário, usa path relativo para servir via API (ex: /uploads/mobile/photos).
 */
export const MOBILE_PHOTO_UPLOAD_PUBLIC_PREFIX = process.env.UPLOAD_BASE_URL
  ? process.env.UPLOAD_BASE_URL
  : '/uploads/mobile/photos';

/**
 * Tamanho máximo aceito para arquivos de foto (15MB).
 */
export const MAX_MOBILE_PHOTO_FILE_SIZE = 15 * 1024 * 1024;

/**
 * Tipos MIME aceitos para upload de fotos.
 */
export const ALLOWED_MOBILE_PHOTO_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

/**
 * Tipos de foto esperados pelo aplicativo mobile.
 * Mantém-se como lista extensível para acomodar novos valores sem quebrar validações.
 */
export const SUPPORTED_MOBILE_PHOTO_TYPES = [
  'checklistReprova',
  'assinatura',
  'servico',
  'pendencia',
  'vistoria',
  'documento',
  'outro',
] as const;

export type MobilePhotoType = (typeof SUPPORTED_MOBILE_PHOTO_TYPES)[number];
