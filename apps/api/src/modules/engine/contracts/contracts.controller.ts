/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Controlador de Contratos
 *
 * Este controlador demonstra o uso prático do sistema de permissões de contrato
 * implementado, mostrando diferentes cenários de verificação de permissões.
 *
 * ENDPOINTS DISPONÍVEIS:
 * - GET /contracts/meus-contratos - Lista contratos permitidos para o usuário
 * - GET /contracts/:id - Obtém dados de um contrato específico (com verificação)
 * - POST /contracts/multiplos - Obtém dados de múltiplos contratos (verificação any)
 * - GET /contracts/verificar/:id - Verifica se tem permissão para um contrato
 *
 * PADRÕES DEMONSTRADOS:
 * - Verificação simples com @RequireContractPermission
 * - Verificação múltipla com @RequireAnyContractPermission
 * - Listagem de contratos com @GetUserContracts
 * - Verificação opcional com @OptionalContractPermission
 *
 * @example
 * ```bash
 * # Listar contratos do usuário
 * GET /contracts/meus-contratos
 * Authorization: Bearer <token>
 *
 * # Acessar contrato específico
 * GET /contracts/123
 * Authorization: Bearer <token>
 * ```
 */

import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import {
  RequireContractPermission,
  RequireAnyContractPermission,
  OptionalContractPermission,
} from '../auth/decorator/contract-permission.decorator';
import { GetUsuarioMobileId } from '../auth/decorator/get-user-id-decorator';
import { ContractPermissionsService } from '../auth/service/contract-permissions.service';

@ApiTags('contracts')
@ApiBearerAuth()
@Controller('contracts')
@UseGuards(JwtAuthGuard)
export class ContractsController {
  constructor(
    private readonly contractPermissionsService: ContractPermissionsService
  ) {}

  /**
   * Lista todos os contratos permitidos para o usuário autenticado
   *
   * Este endpoint demonstra o uso do decorator @GetUserContracts
   * que injeta automaticamente os contratos do usuário.
   */
  @Get('meus-contratos')
  @ApiOperation({
    summary: 'Listar contratos do usuário',
    description:
      'Retorna todos os contratos que o usuário tem permissão para acessar',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de contratos retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'number' },
        contracts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              contratoId: { type: 'number' },
              contrato: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  nome: { type: 'string' },
                  numero: { type: 'string' },
                },
              },
            },
          },
        },
        total: { type: 'number' },
      },
    },
  })
  async getMyContracts(@GetUsuarioMobileId() userId: number) {
    const contractsInfo =
      await this.contractPermissionsService.getUserContracts(userId);

    return {
      message: 'Contratos do usuário obtidos com sucesso',
      data: contractsInfo,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Obtém dados de um contrato específico
   *
   * Este endpoint demonstra o uso do decorator @RequireContractPermission
   * que verifica se o usuário tem permissão para acessar o contrato.
   */
  @Get(':id')
  @RequireContractPermission('id')
  @ApiOperation({
    summary: 'Obter contrato por ID',
    description:
      'Retorna dados de um contrato específico (com verificação de permissão)',
  })
  @ApiResponse({
    status: 200,
    description: 'Contrato encontrado e usuário tem permissão',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            nome: { type: 'string' },
            numero: { type: 'string' },
            // ... outros campos do contrato
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não tem permissão para acessar este contrato',
  })
  getContractById(
    @Param('id') contratoId: number,
    @GetUsuarioMobileId() userId: number
  ) {
    // Simular busca de dados do contrato
    const contractData = {
      id: contratoId,
      nome: `Contrato ${contratoId}`,
      numero: `CTR-${contratoId.toString().padStart(4, '0')}`,
      descricao: `Descrição do contrato ${contratoId}`,
      status: 'ativo',
      dataInicio: '2024-01-01',
      dataFim: '2024-12-31',
    };

    return {
      message: 'Contrato obtido com sucesso',
      data: contractData,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Obtém dados de múltiplos contratos
   *
   * Este endpoint demonstra o uso do decorator @RequireAnyContractPermission
   * que verifica se o usuário tem permissão para acessar pelo menos um dos contratos.
   */
  @Post('multiplos')
  @RequireAnyContractPermission('contratoIds')
  @ApiOperation({
    summary: 'Obter múltiplos contratos',
    description:
      'Retorna dados de múltiplos contratos (verificação de permissão para qualquer um)',
  })
  @ApiResponse({
    status: 200,
    description: 'Contratos obtidos com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              nome: { type: 'string' },
              numero: { type: 'string' },
            },
          },
        },
      },
    },
  })
  getMultipleContracts(
    @Body() body: { contratoIds: number[] },
    @GetUsuarioMobileId() userId: number
  ) {
    // Simular busca de dados dos contratos
    const contractsData = body.contratoIds.map(id => ({
      id,
      nome: `Contrato ${id}`,
      numero: `CTR-${id.toString().padStart(4, '0')}`,
      descricao: `Descrição do contrato ${id}`,
      status: 'ativo',
    }));

    return {
      message: 'Contratos obtidos com sucesso',
      data: contractsData,
      total: contractsData.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Verifica se o usuário tem permissão para acessar um contrato
   *
   * Este endpoint demonstra verificação manual de permissões.
   */
  @Get('verificar/:id')
  @ApiOperation({
    summary: 'Verificar permissão de contrato',
    description:
      'Verifica se o usuário tem permissão para acessar um contrato específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Verificação realizada com sucesso',
    schema: {
      type: 'object',
      properties: {
        hasPermission: { type: 'boolean' },
        contratoId: { type: 'number' },
        userId: { type: 'number' },
      },
    },
  })
  async checkContractPermission(
    @Param('id') contratoId: number,
    @GetUsuarioMobileId() userId: number
  ) {
    const hasPermission =
      await this.contractPermissionsService.hasContractPermission(
        userId,
        contratoId
      );

    return {
      hasPermission,
      contratoId,
      userId,
      message: hasPermission
        ? 'Usuário tem permissão para este contrato'
        : 'Usuário não tem permissão para este contrato',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Endpoint com verificação opcional de contrato
   *
   * Este endpoint demonstra o uso do decorator @OptionalContractPermission
   * que não falha se o parâmetro não for fornecido.
   */
  @Get('opcional/:id')
  @OptionalContractPermission('id')
  @ApiOperation({
    summary: 'Endpoint com verificação opcional',
    description: 'Endpoint que funciona com ou sem verificação de contrato',
  })
  getOptionalContract(
    @GetUsuarioMobileId() userId: number,
    @Param('id') contratoId: number
  ) {
    if (contratoId) {
      return {
        message: 'Contrato específico solicitado',
        contratoId,
        userId,
        hasPermission: true, // Se chegou aqui, tem permissão
      };
    }

    return {
      message: 'Nenhum contrato específico solicitado',
      userId,
      note: 'Este endpoint funciona sem especificar um contrato',
    };
  }
}
