/**
 * DTOs responsáveis por receber os dados necessários para criação de escalas
 * e de seus horários/slots. A documentação detalhada garante que o contrato
 * da API fique claro tanto para o time mobile quanto para integrações futuras.
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ESCALA_VALIDATION_CONFIG } from '../constants';
import { EscalaVeiculoTipo } from '@nexa-oper/db';

/**
 * Representa cada horário configurado na escala durante a criação.
 */
export class CreateEscalaHorarioDto {
  @ApiProperty({
    description: 'Índice do dia dentro do ciclo (0 baseado)',
    example: 0,
  })
  @IsInt({ message: 'Índice do ciclo deve ser numérico' })
  @Min(0, { message: 'Índice do ciclo não pode ser negativo' })
  indiceCiclo: number;

  @ApiProperty({
    description: 'Dia da semana (0=Domingo ... 6=Sábado)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Dia da semana deve ser numérico' })
  @Min(0, { message: 'Dia da semana deve estar entre 0 e 6' })
  @Max(6, { message: 'Dia da semana deve estar entre 0 e 6' })
  diaSemana?: number;

  @ApiProperty({
    description: 'Hora inicial (HH:mm)',
    example: '07:00',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Hora inicial deve ser uma string' })
  @MaxLength(5, { message: 'Hora inicial deve estar no formato HH:mm' })
  horaInicio?: string;

  @ApiProperty({
    description: 'Hora final (HH:mm)',
    example: '19:00',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Hora final deve ser uma string' })
  @MaxLength(5, { message: 'Hora final deve estar no formato HH:mm' })
  horaFim?: string;

  @ApiProperty({
    description: 'Quantidade de eletricistas necessários',
    example: 2,
  })
  @IsInt({ message: 'Quantidade de eletricistas deve ser numérica' })
  @Min(ESCALA_VALIDATION_CONFIG.MIN_ELETRICISTAS, {
    message: `Quantidade mínima de eletricistas por horário é ${ESCALA_VALIDATION_CONFIG.MIN_ELETRICISTAS}`,
  })
  @Max(ESCALA_VALIDATION_CONFIG.MAX_ELETRICISTAS, {
    message: `Quantidade máxima de eletricistas por horário é ${ESCALA_VALIDATION_CONFIG.MAX_ELETRICISTAS}`,
  })
  eletricistasNecessarios: number;

  @ApiProperty({
    description: 'Define se o dia é folga dentro da escala',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Folga deve ser verdadeiro ou falso' })
  folga?: boolean;

  @ApiProperty({
    description: 'Etiqueta opcional (diurno, noturno, reserva...)',
    required: false,
    example: 'Diurno',
  })
  @IsOptional()
  @IsString({ message: 'Etiqueta deve ser uma string' })
  @MaxLength(64, { message: 'Etiqueta deve ter no máximo 64 caracteres' })
  etiqueta?: string;

  @ApiProperty({
    description: 'Offset adicional para controlar a rotação automática',
    required: false,
    example: 0,
  })
  @IsOptional()
  @IsInt({ message: 'Offset de rotação deve ser numérico' })
  @Min(0, { message: 'Offset de rotação não pode ser negativo' })
  rotacaoOffset?: number;
}

/**
 * DTO principal utilizado na criação da escala.
 */
export class CreateEscalaDto {
  @ApiProperty({
    description: 'Nome da escala',
    example: 'Escala Espanhola',
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MinLength(ESCALA_VALIDATION_CONFIG.MIN_NOME_LENGTH, {
    message: `Nome deve ter ao menos ${ESCALA_VALIDATION_CONFIG.MIN_NOME_LENGTH} caracteres`,
  })
  @MaxLength(ESCALA_VALIDATION_CONFIG.MAX_NOME_LENGTH, {
    message: `Nome deve ter no máximo ${ESCALA_VALIDATION_CONFIG.MAX_NOME_LENGTH} caracteres`,
  })
  nome: string;

  @ApiProperty({
    description: 'Descrição opcional com observações de operação',
    example: 'Equipe em carros de passeio, folga domingo e alterna sábado.',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Descrição deve ser uma string' })
  descricao?: string;

  @ApiProperty({
    description: 'Identificador opcional para integrações externas',
    example: 'ESPANHOLA-01',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Código deve ser uma string' })
  @MaxLength(64, { message: 'Código deve ter no máximo 64 caracteres' })
  codigo?: string;

  @ApiProperty({ description: 'Contrato responsável pela escala', example: 5 })
  @IsInt({ message: 'Contrato deve ser um número inteiro' })
  @Min(1, { message: 'Contrato inválido' })
  contratoId: number;

  @ApiProperty({
    description: 'Tipo de veículo utilizado com mais frequência',
    enum: EscalaVeiculoTipo,
    required: false,
    example: EscalaVeiculoTipo.CARRO,
  })
  @IsOptional()
  @IsEnum(EscalaVeiculoTipo, {
    message: 'Tipo de veículo inválido',
  })
  tipoVeiculo?: EscalaVeiculoTipo;

  @ApiProperty({
    description: 'Quantidade de dias que compõem o ciclo completo',
    example: 14,
  })
  @IsInt({ message: 'Dias de ciclo deve ser numérico' })
  @Min(ESCALA_VALIDATION_CONFIG.MIN_DIAS_CICLO, {
    message: `Ciclo deve ter pelo menos ${ESCALA_VALIDATION_CONFIG.MIN_DIAS_CICLO} dia`,
  })
  @Max(ESCALA_VALIDATION_CONFIG.MAX_DIAS_CICLO, {
    message: `Ciclo deve ter no máximo ${ESCALA_VALIDATION_CONFIG.MAX_DIAS_CICLO} dias`,
  })
  diasCiclo: number;

  @ApiProperty({
    description: 'Mínimo de eletricistas para abrir turno seguindo esta escala',
    example: 2,
  })
  @IsInt({ message: 'Mínimo de eletricistas deve ser numérico' })
  @Min(ESCALA_VALIDATION_CONFIG.MIN_ELETRICISTAS, {
    message: `Quantidade mínima de eletricistas é ${ESCALA_VALIDATION_CONFIG.MIN_ELETRICISTAS}`,
  })
  minimoEletricistas: number;

  @ApiProperty({
    description: 'Limite máximo de eletricistas (opcional)',
    example: 7,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Máximo de eletricistas deve ser numérico' })
  @Min(ESCALA_VALIDATION_CONFIG.MIN_ELETRICISTAS, {
    message: 'Máximo deve ser pelo menos 1',
  })
  @Max(ESCALA_VALIDATION_CONFIG.MAX_ELETRICISTAS, {
    message: `Máximo permitido é ${ESCALA_VALIDATION_CONFIG.MAX_ELETRICISTAS}`,
  })
  maximoEletricistas?: number;

  @ApiProperty({
    description: 'Data que serve como marco inicial para o cálculo do ciclo',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDateString({}, { message: 'Início do ciclo deve ser uma data válida' })
  inicioCiclo: string;

  @ApiProperty({
    description: 'Lista de horários/slots que formam o ciclo',
    type: [CreateEscalaHorarioDto],
  })
  @IsArray({ message: 'Horários devem ser enviados em lista' })
  @ArrayMinSize(1, { message: 'Ao menos um horário é obrigatório' })
  @ValidateNested({ each: true })
  @Type(() => CreateEscalaHorarioDto)
  horarios: CreateEscalaHorarioDto[];
}
