/**
 * Constantes compartilhadas para upload de fotos de checklist.
 */

import { join } from 'path';

/**
 * Diretório base (absoluto) onde as fotos de checklist serão armazenadas.
 * Configurável via variável de ambiente UPLOAD_ROOT
 */
export const CHECKLIST_UPLOAD_ROOT = process.env.UPLOAD_ROOT
  ? join(process.env.UPLOAD_ROOT, 'checklists')
  : join(process.cwd(), 'uploads', 'checklists');

/**
 * URL base pública para acesso às fotos de checklist.
 * Se UPLOAD_BASE_URL estiver configurada, será usada como base (ex: https://storage.nexaoper.com.br).
 * Caso contrário, usa path relativo para servir via API (ex: /uploads/checklists).
 */
export const CHECKLIST_UPLOAD_PUBLIC_PREFIX = process.env.UPLOAD_BASE_URL
  ? `${process.env.UPLOAD_BASE_URL.replace(/\/$/, '')}/checklists`
  : '/uploads/checklists';
