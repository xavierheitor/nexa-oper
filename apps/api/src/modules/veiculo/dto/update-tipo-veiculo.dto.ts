/**
 * DTO para atualização de tipos de veículo
 */

import { PartialType } from '@nestjs/swagger';
import { CreateTipoVeiculoDto } from './create-tipo-veiculo.dto';

export class UpdateTipoVeiculoDto extends PartialType(CreateTipoVeiculoDto) {}
