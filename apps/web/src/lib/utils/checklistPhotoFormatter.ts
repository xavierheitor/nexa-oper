/**
 * Utilitário para formatação de fotos de checklist
 *
 * Centraliza a lógica de formatação de fotos do mobilePhoto
 * para o formato esperado pelo frontend, evitando duplicação.
 */

/**
 * Formata uma foto do mobilePhoto para o formato do frontend
 *
 * @param foto - Foto do mobilePhoto
 * @returns Foto formatada no formato ChecklistRespostaFoto
 */
export function formatChecklistPhoto(foto: {
  id: number;
  tipo: string;
  url: string | null;
  storagePath: string | null;
  fileSize: bigint | number;
  mimeType: string | null;
  capturedAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: foto.id,
    caminhoArquivo: foto.storagePath,
    urlPublica: foto.url,
    tamanhoBytes: Number(foto.fileSize), // Converte BigInt para Number
    mimeType: foto.mimeType,
    sincronizadoEm: foto.capturedAt?.toISOString() || foto.createdAt.toISOString(),
    createdAt: foto.createdAt.toISOString(),
  };
}

/**
 * Formata um array de fotos do mobilePhoto
 *
 * @param fotos - Array de fotos do mobilePhoto
 * @returns Array de fotos formatadas
 */
export function formatChecklistPhotos(
  fotos: Array<{
    id: number;
    tipo: string;
    url: string | null;
    storagePath: string | null;
    fileSize: bigint | number;
    mimeType: string | null;
    capturedAt: Date | null;
    createdAt: Date;
  }>
) {
  return fotos.map(formatChecklistPhoto);
}

