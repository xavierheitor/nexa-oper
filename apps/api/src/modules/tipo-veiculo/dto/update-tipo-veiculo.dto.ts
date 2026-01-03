/**
 * DTO para atualização de tipos de veículo
 *
 * Define a estrutura de dados necessária para atualizar
 * um tipo de veículo existente no sistema.
 */

import { PartialType } from '@nestjs/swagger';

import { CreateTipoVeiculoDto } from './create-tipo-veiculo.dto';

/**
 * DTO para atualização de tipos de veículo
 *
 * Herda todas as propriedades de CreateTipoVeiculoDto
 * mas torna todas opcionais para permitir atualizações parciais
 */
export class UpdateTipoVeiculoDto extends PartialType(CreateTipoVeiculoDto) {}
