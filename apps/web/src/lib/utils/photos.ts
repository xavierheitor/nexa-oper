/**
 * Utilitários para Manipulação de URLs de Fotos
 *
 * Este módulo fornece funções helper para construir URLs completas
 * para fotos enviadas pelo aplicativo mobile, permitindo configuração
 * de URL base através de variáveis de ambiente.
 *
 * FUNCIONALIDADES:
 * - Monta URLs completas de fotos com base configurável
 * - Suporta paths relativos vindos do servidor
 * - Configurável via variável de ambiente NEXT_PUBLIC_PHOTOS_BASE_URL
 * - Fallback automático para path relativo se não configurado
 *
 * COMO FUNCIONA:
 * 1. Lê variável de ambiente NEXT_PUBLIC_PHOTOS_BASE_URL
 * 2. Se configurada, concatena com o path da foto
 * 3. Normaliza slashes para evitar duplicações
 * 4. Retorna URL completa ou path relativo
 *
 * CONFIGURAÇÃO:
 * No arquivo .env.local:
 * NEXT_PUBLIC_PHOTOS_BASE_URL=http://localhost:3001
 * ou
 * NEXT_PUBLIC_PHOTOS_BASE_URL=https://storage.nexaoper.com.br
 *
 * SEGURANÇA:
 * - Usa variáveis de ambiente públicas (NEXT_PUBLIC_*)
 * - Não expõe informações sensíveis
 * - Suporta HTTPS/HTTP
 */

/**
 * Constrói a URL completa para uma foto mobile
 *
 * Esta função monta a URL completa para uma foto, usando a URL base
 * configurada na variável de ambiente NEXT_PUBLIC_PHOTOS_BASE_URL se
 * disponível. Caso contrário, retorna o path relativo.
 *
 * @param photoPath - Path da foto (relativo ou absoluto)
 * @param fallbackPath - Path alternativo caso photoPath seja inválido
 * @returns URL completa da foto ou path relativo
 *
 * @example
 * ```typescript
 * // Com URL base configurada:
 * buildPhotoUrl('/mobile/photos/123/photo.jpg')
 * // => 'https://storage.nexaoper.com.br/mobile/photos/123/photo.jpg'
 *
 * // Sem URL base:
 * buildPhotoUrl('/mobile/photos/123/photo.jpg')
 * // => '/mobile/photos/123/photo.jpg'
 *
 * // Com fallback:
 * buildPhotoUrl('', '/mobile/photos/default.jpg')
 * // => 'https://storage.nexaoper.com.br/mobile/photos/default.jpg'
 * ```
 */
export function buildPhotoUrl(photoPath?: string | null, fallbackPath?: string): string {
  // Determinar qual path usar (photoPath ou fallback)
  const path = photoPath || fallbackPath || '';

  if (!path || path.trim() === '') {
    return '';
  }

  // Obter URL base da variável de ambiente
  const baseUrl = process.env.NEXT_PUBLIC_PHOTOS_BASE_URL;

  // Se não houver URL base configurada, retornar path relativo
  if (!baseUrl || baseUrl.trim() === '') {
    return path;
  }

  // Normalizar URL base (remover trailing slash se existir)
  const normalizedBaseUrl = baseUrl.endsWith('/')
    ? baseUrl.slice(0, -1)
    : baseUrl;

  // Normalizar path (garantir que começa com /)
  const normalizedPath = path.startsWith('/')
    ? path
    : `/${path}`;

  // Construir e retornar URL completa
  return `${normalizedBaseUrl}${normalizedPath}`;
}

/**
 * Type guard para verificar se uma foto tem URL válida
 *
 * @param photoPath - Path da foto a ser validado
 * @returns true se o path é válido e não vazio
 */
export function isValidPhotoPath(photoPath?: string | null): boolean {
  return Boolean(photoPath && photoPath.trim() !== '');
}
