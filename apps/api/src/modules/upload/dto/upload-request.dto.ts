import { ApiProperty } from '@nestjs/swagger';
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

  /** Campos extras são repassados como metadata ao handler. Ex: turnoId, checklistPerguntaId, sequenciaAssinatura, etc. */
  [key: string]: string | number | undefined;
}
