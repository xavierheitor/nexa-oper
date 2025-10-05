/**
 * DTO para atualização de tipos de equipe
 *
 * Define a estrutura de dados necessária para atualizar
 * um tipo de equipe existente no sistema.
 */

import { PartialType } from '@nestjs/swagger';
import { CreateTipoEquipeDto } from './create-tipo-equipe.dto';

/**
 * DTO para atualização de tipos de equipe
 *
 * Herda todas as propriedades de CreateTipoEquipeDto
 * mas torna todas opcionais para permitir atualizações parciais
 */
export class UpdateTipoEquipeDto extends PartialType(CreateTipoEquipeDto) {}
