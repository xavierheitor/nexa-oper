/**
 * DTO para abertura de turno via app móvel
 *
 * Este DTO define a estrutura específica dos dados enviados
 * pelo aplicativo móvel para abertura de turno.
 */

import { IsNotEmpty, IsString, IsInt, IsArray, IsOptional, IsNumber, IsObject, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ChecklistRespostaDto } from './checklist-resposta.dto';

/**
 * DTO para dados do turno enviado pelo mobile
 */
export class TurnoMobileDto {
  @ApiProperty({ description: 'ID local do turno' })
  @IsOptional()
  @IsInt()
  idLocal?: number;

  @ApiProperty({ description: 'ID remoto do turno' })
  @IsOptional()
  remoteId?: number;

  @ApiProperty({ description: 'ID do veículo' })
  @IsNotEmpty()
  @IsInt()
  veiculoId: number;

  @ApiProperty({ description: 'ID da equipe' })
  @IsNotEmpty()
  @IsInt()
  equipeId: number;

  @ApiProperty({ description: 'Quilometragem inicial' })
  @IsNotEmpty()
  @IsNumber()
  kmInicial: number;

  @ApiProperty({ description: 'Quilometragem final' })
  @IsOptional()
  @IsNumber()
  kmFinal?: number;

  @ApiProperty({ description: 'Hora de início' })
  @IsNotEmpty()
  @IsString()
  horaInicio: string;

  @ApiProperty({ description: 'Hora de fim' })
  @IsOptional()
  @IsString()
  horaFim?: string;

  @ApiProperty({ description: 'Latitude' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ description: 'Longitude' })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

/**
 * DTO para dados do veículo enviado pelo mobile
 */
export class VeiculoMobileDto {
  @ApiProperty({ description: 'ID local do veículo' })
  @IsNotEmpty()
  @IsInt()
  idLocal: number;

  @ApiProperty({ description: 'ID remoto do veículo' })
  @IsNotEmpty()
  @IsInt()
  remoteId: number;

  @ApiProperty({ description: 'Placa do veículo' })
  @IsNotEmpty()
  @IsString()
  placa: string;

  @ApiProperty({ description: 'ID do tipo de veículo' })
  @IsNotEmpty()
  @IsInt()
  tipoVeiculoId: number;

  @ApiProperty({ description: 'Se está sincronizado' })
  @IsNotEmpty()
  sincronizado: boolean;

  @ApiProperty({ description: 'Data de criação' })
  @IsNotEmpty()
  @IsString()
  createdAt: string;

  @ApiProperty({ description: 'Data de atualização' })
  @IsNotEmpty()
  @IsString()
  updatedAt: string;
}

/**
 * DTO para dados da equipe enviado pelo mobile
 */
export class EquipeMobileDto {
  @ApiProperty({ description: 'ID local da equipe' })
  @IsNotEmpty()
  @IsInt()
  idLocal: number;

  @ApiProperty({ description: 'ID remoto da equipe' })
  @IsNotEmpty()
  @IsInt()
  remoteId: number;

  @ApiProperty({ description: 'Nome da equipe' })
  @IsNotEmpty()
  @IsString()
  nome: string;

  @ApiProperty({ description: 'Descrição da equipe' })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({ description: 'ID do tipo de equipe' })
  @IsNotEmpty()
  @IsInt()
  tipoEquipeId: number;

  @ApiProperty({ description: 'Se está sincronizado' })
  @IsNotEmpty()
  sincronizado: boolean;

  @ApiProperty({ description: 'Data de criação' })
  @IsNotEmpty()
  @IsString()
  createdAt: string;

  @ApiProperty({ description: 'Data de atualização' })
  @IsNotEmpty()
  @IsString()
  updatedAt: string;
}

/**
 * DTO para eletricista enviado pelo mobile
 */
export class EletricistaMobileDto {
  @ApiProperty({ description: 'ID remoto do eletricista' })
  @IsNotEmpty()
  @IsInt()
  remoteId: number;

  @ApiProperty({ description: 'Nome do eletricista' })
  @IsNotEmpty()
  @IsString()
  nome: string;

  @ApiProperty({ description: 'Matrícula do eletricista' })
  @IsNotEmpty()
  @IsString()
  matricula: string;

  @ApiProperty({ description: 'Se é motorista' })
  @IsNotEmpty()
  motorista: boolean;
}

/**
 * DTO para checklist enviado pelo mobile
 */
export class ChecklistMobileDto {
  @ApiProperty({ description: 'ID local do checklist' })
  @IsNotEmpty()
  @IsInt()
  idLocal: number;

  @ApiProperty({ description: 'ID do modelo do checklist' })
  @IsNotEmpty()
  @IsInt()
  checklistModeloId: number;

  @ApiProperty({ description: 'Nome do checklist' })
  @IsNotEmpty()
  @IsString()
  checklistNome: string;

  @ApiProperty({ description: 'ID remoto do eletricista', required: false })
  @IsOptional()
  @IsInt({ message: 'eletricistaRemoteId deve ser um número inteiro' })
  eletricistaRemoteId?: number;

  @ApiProperty({ description: 'Latitude' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ description: 'Longitude' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ description: 'Data de preenchimento' })
  @IsNotEmpty()
  @IsString()
  dataPreenchimento: string;

  @ApiProperty({ description: 'Respostas do checklist' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistRespostaDto)
  respostas?: ChecklistRespostaDto[];
}

/**
 * DTO principal para abertura de turno via mobile
 */
export class MobileAbrirTurnoDto {
  @ApiProperty({ description: 'Dados do turno', type: TurnoMobileDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TurnoMobileDto)
  turno: TurnoMobileDto;

  @ApiProperty({ description: 'Dados do veículo', type: VeiculoMobileDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => VeiculoMobileDto)
  veiculo: VeiculoMobileDto;

  @ApiProperty({ description: 'Dados da equipe', type: EquipeMobileDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => EquipeMobileDto)
  equipe: EquipeMobileDto;

  @ApiProperty({ description: 'Lista de eletricistas', type: [EletricistaMobileDto] })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EletricistaMobileDto)
  eletricistas: EletricistaMobileDto[];

  @ApiProperty({ description: 'Lista de checklists', type: [ChecklistMobileDto] })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistMobileDto)
  checklists: ChecklistMobileDto[];
}
