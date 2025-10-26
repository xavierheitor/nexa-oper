/**
 * DTO de resposta para upload de fotos mobile.
 */

import { ApiProperty } from '@nestjs/swagger';

export class PhotoUploadResponseDto {
  @ApiProperty({
    description: 'Status do processamento da foto',
    example: 'stored',
  })
  status!: 'stored' | 'duplicate';

  @ApiProperty({
    description: 'URL pública para acessar a foto armazenada',
    example: '/uploads/mobile/photos/123/20250101120000-foto.jpg',
  })
  url!: string;

  @ApiProperty({
    description:
      'Checksum SHA-256 utilizado para identificar a foto e garantir idempotência',
    example: 'd2f1b1a6c3e4f5...',
  })
  checksum!: string;
}
