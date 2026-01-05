/**
 * DTOs para sincronização de fotos de checklist
 *
 * Este arquivo define os DTOs para validação e transferência de dados
 * relacionados ao upload e sincronização de fotos de checklists.
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsInt,
  IsString,
  IsOptional,
  IsObject,
} from 'class-validator';

/**
 * DTO para sincronizar uma foto individual
 */
export class SincronizarFotoDto {
  @ApiProperty({
    description: 'ID da resposta do checklist que gerou a pendência',
    example: 45,
  })
  @IsNotEmpty()
  @IsInt()
  checklistRespostaId: number;

  @ApiProperty({
    description: 'ID do turno (para validação)',
    example: 16,
    required: false,
  })
  @IsOptional()
  @IsInt()
  turnoId?: number;

  @ApiProperty({
    description: 'Metadados da foto (EXIF, geolocalização, etc)',
    example: {
      latitude: -23.5505,
      longitude: -46.6333,
      timestamp: '2025-10-22T20:15:00Z',
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadados?: any;
}

/**
 * DTO para resposta de foto sincronizada
 */
export class FotoResponseDto {
  @ApiProperty({ description: 'ID da foto' })
  id: number;

  @ApiProperty({ description: 'ID da resposta do checklist' })
  checklistRespostaId: number;

  @ApiProperty({ description: 'ID da pendência (se aplicável)' })
  checklistPendenciaId?: number | null;

  @ApiProperty({ description: 'URL pública da foto' })
  urlPublica: string | null;

  @ApiProperty({ description: 'Caminho do arquivo no storage' })
  caminhoArquivo: string;

  @ApiProperty({ description: 'Tamanho do arquivo em bytes' })
  tamanhoBytes: number;

  @ApiProperty({ description: 'Tipo MIME do arquivo' })
  mimeType: string;

  @ApiProperty({ description: 'Data de sincronização' })
  sincronizadoEm: Date;

  @ApiProperty({ description: 'Metadados da foto' })
  metadados?: any;
}

/**
 * DTO para sincronização em lote
 */
export class SincronizarFotoLoteDto {
  @ApiProperty({
    description: 'Lista de fotos para sincronizar',
    type: [SincronizarFotoDto],
  })
  @IsNotEmpty()
  fotos: SincronizarFotoDto[];
}

/**
 * DTO para resposta de sincronização em lote
 */
export class FotoLoteResponseDto {
  @ApiProperty({ description: 'Total de fotos processadas' })
  totalProcessadas: number;

  @ApiProperty({ description: 'Total de sucessos' })
  sucessos: number;

  @ApiProperty({ description: 'Total de erros' })
  erros: number;

  @ApiProperty({ description: 'Lista de resultados' })
  resultados: {
    checklistRespostaId: number;
    sucesso: boolean;
    foto?: FotoResponseDto;
    erro?: string;
  }[];
}

/**
 * DTO para listar fotos de uma resposta
 */
export class ListarFotosRespostaDto {
  @ApiProperty({ description: 'ID da resposta' })
  checklistRespostaId: number;

  @ApiProperty({ description: 'Lista de fotos' })
  fotos: FotoResponseDto[];

  @ApiProperty({ description: 'Total de fotos' })
  totalFotos: number;

  @ApiProperty({ description: 'Se ainda aguarda mais fotos' })
  aguardandoMaisFotos: boolean;
}

/**
 * DTO para listar fotos de uma pendência
 */
export class ListarFotosPendenciaDto {
  @ApiProperty({ description: 'ID da pendência' })
  checklistPendenciaId: number;

  @ApiProperty({ description: 'Lista de fotos relacionadas' })
  fotos: FotoResponseDto[];

  @ApiProperty({ description: 'Total de fotos' })
  totalFotos: number;
}
