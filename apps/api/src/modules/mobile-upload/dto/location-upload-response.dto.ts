/**
 * DTO de resposta para uploads de localização do aplicativo mobile.
 */

import { ApiProperty } from '@nestjs/swagger';

export class LocationUploadResponseDto {
  @ApiProperty({
    description: 'Status do processamento da localização enviada',
    example: 'ok',
  })
  status!: 'ok';

  @ApiProperty({
    description:
      'Indica se a localização já existia (idempotência) antes do processamento atual',
    example: false,
  })
  alreadyExisted!: boolean;
}
