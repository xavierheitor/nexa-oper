/**
 * DTO para atualização de tipos de equipe
 */

import { PartialType } from '@nestjs/swagger';

import { CreateTipoEquipeDto } from './create-tipo-equipe.dto';

export class UpdateTipoEquipeDto extends PartialType(CreateTipoEquipeDto) {}
