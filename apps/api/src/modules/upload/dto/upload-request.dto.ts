import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * DTO base para upload. Valida apenas type e entityId.
 * Metadados adicionais (turnoId, checklistPerguntaId, etc.) são validados pelo handler.
 * Use GET /upload/types para listar tipos e seus MetadataSpec.
 */
export class UploadRequestDto {
  @ApiProperty({
    example: 'checklist-reprova',
    description:
      'Tipo de evidência. Tipos disponíveis: checklist-reprova, checklist-assinatura, atividade-turno, apr-evidence, medidor.',
  })
  @IsString()
  @IsNotEmpty()
  type!: string;

  @ApiProperty({
    example: 'checklistPreenchido',
    description:
      'Tipo da entidade vinculada (opcional, default depende do type)',
  })
  @IsString()
  @IsOptional()
  entityType?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID ou UUID da entidade principal. Formato depende do type.',
  })
  @IsString()
  @IsNotEmpty()
  entityId!: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Versão do contrato de metadados canônicos enviado pelo app.',
  })
  @IsOptional()
  syncSchemaVersion?: number | string;

  @ApiPropertyOptional({
    example: 'mobile',
    description: 'Origem do upload (ex: mobile).',
  })
  @IsString()
  @IsOptional()
  syncOrigin?: string;

  @ApiPropertyOptional({
    example: 91234,
    description: 'Identificador local da foto no dispositivo.',
  })
  @IsOptional()
  clientPhotoId?: number | string;

  @ApiPropertyOptional({
    example: 'MEDIDOR_INSTALADO',
    description: 'Categoria de negócio da foto para rastreabilidade.',
  })
  @IsString()
  @IsOptional()
  photoCategory?: string;

  @ApiPropertyOptional({
    example: 'atividade',
    description: 'Tipo canônico do dono da foto (checklist, atividade, apr).',
  })
  @IsString()
  @IsOptional()
  ownerType?: string;

  @ApiPropertyOptional({
    example: '8d2f2b2b-d7a8-40ea-96be-6cbd6e0726c2',
    description: 'Referência da entidade dona da foto (UUID/ID lógico).',
  })
  @IsString()
  @IsOptional()
  ownerRef?: string;

  /** Campos extras são repassados como metadata ao handler. Ex: turnoId, checklistPerguntaId, sequenciaAssinatura, etc. */
  [key: string]: string | number | boolean | undefined;
}
