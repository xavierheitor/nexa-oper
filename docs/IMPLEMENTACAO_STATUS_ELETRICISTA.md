# 🛠️ Implementação: Sistema de Status de Eletricistas

Este documento mostra a implementação prática do sistema de status de eletricistas.

## 📦 Modelos Prisma

### 1. Enum: StatusEletricista

**Arquivo:** `packages/db/prisma/models/eletricista-status.prisma`

```prisma
/**
 * Sistema de Status de Eletricistas
 *
 * Rastreia o status atual e histórico de eletricistas (funcionários),
 * permitindo saber se estão trabalhando, afastados, de férias, etc.
 */

enum StatusEletricista {
  ATIVO              // Trabalhando normalmente
  FERIAS             // Em período de férias
  LICENCA_MEDICA     // Licença médica
  LICENCA_MATERNIDADE // Licença maternidade
  LICENCA_PATERNIDADE // Licença paternidade
  SUSPENSAO          // Suspensão disciplinar
  TREINAMENTO        // Em treinamento/capacitação
  AFastADO           // Afastado por outros motivos
  DESLIGADO          // Desligado da empresa
  APOSENTADO         // Aposentado
}

/**
 * Status atual do eletricista (tabela otimizada para consulta rápida)
 *
 * Mantém apenas o status atual para performance.
 * Histórico completo fica em EletricistaStatusHistorico.
 */
model EletricistaStatus {
  id              Int               @id @default(autoincrement())
  eletricistaId   Int               @unique
  eletricista     Eletricista       @relation(fields: [eletricistaId], references: [id], onDelete: Cascade)

  status          StatusEletricista @default(ATIVO)

  // Período do status atual (se aplicável)
  dataInicio      DateTime          @default(now())
  dataFim          DateTime?        // null = status atual indefinido

  // Motivo e detalhes
  motivo          String?           @db.VarChar(500)
  observacoes     String?           @db.VarChar(1000)

  // Documentos/atestados relacionados (opcional)
  documentoPath   String?           @db.VarChar(1000)

  // Auditoria
  createdAt       DateTime          @default(now())
  createdBy       String            @db.VarChar(255)
  updatedAt       DateTime?         @updatedAt
  updatedBy       String?           @db.VarChar(255)

  // Relacionamento com histórico
  Historico       EletricistaStatusHistorico[]

  @@index([status])
  @@index([dataInicio])
  @@index([eletricistaId, status])
  @@index([eletricistaId])
}

/**
 * Histórico completo de mudanças de status do eletricista
 *
 * Registra todas as mudanças de status ao longo do tempo,
 * permitindo auditoria e relatórios históricos.
 */
model EletricistaStatusHistorico {
  id              Int               @id @default(autoincrement())
  eletricistaId   Int
  eletricista     Eletricista       @relation(fields: [eletricistaId], references: [id], onDelete: Cascade)

  status          StatusEletricista
  statusAnterior  StatusEletricista? // Para rastrear transições

  // Período do status
  dataInicio      DateTime
  dataFim          DateTime?         // null = ainda ativo neste status

  // Motivo e detalhes
  motivo          String?           @db.VarChar(500)
  observacoes     String?           @db.VarChar(1000)

  // Documentos relacionados
  documentoPath   String?           @db.VarChar(1000)

  // Quem registrou e quando
  registradoPor   String            @db.VarChar(255)
  registradoEm    DateTime          @default(now())

  // Auditoria
  createdAt       DateTime          @default(now())
  createdBy       String            @db.VarChar(255)
  updatedAt       DateTime?         @updatedAt
  updatedBy       String?           @db.VarChar(255)

  @@index([eletricistaId])
  @@index([status])
  @@index([dataInicio])
  @@index([dataFim])
  @@index([eletricistaId, dataInicio])
  @@index([eletricistaId, status])
  @@index([eletricistaId, dataInicio, dataFim])
}
```

### 2. Atualizar Modelo Eletricista

**Arquivo:** `packages/db/prisma/models/eletricista.prisma`

```prisma
model Eletricista {
  // ... campos existentes ...

  // Novo relacionamento
  Status          EletricistaStatus?
  StatusHistorico EletricistaStatusHistorico[]
}
```

---

## 🔧 Serviço: EletricistaStatusService

**Arquivo:** `apps/api/src/modules/eletricista/services/eletricista-status.service.ts`

```typescript
import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient, StatusEletricista } from '@nexa-oper/db';
import { DatabaseService } from '@database/database.service';

interface RegistrarStatusDto {
  eletricistaId: number;
  status: StatusEletricista;
  dataInicio?: Date;
  dataFim?: Date;
  motivo?: string;
  observacoes?: string;
  documentoPath?: string;
  registradoPor: string;
}

interface GetStatusAtualResult {
  status: StatusEletricista;
  dataInicio: Date;
  dataFim?: Date;
  motivo?: string;
  observacoes?: string;
}

@Injectable()
export class EletricistaStatusService {
  private readonly logger = new Logger(EletricistaStatusService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Obtém o status atual do eletricista
   * Retorna ATIVO se não houver registro
   */
  async getStatusAtual(eletricistaId: number): Promise<GetStatusAtualResult> {
    const status = await this.databaseService
      .getPrisma()
      .eletricistaStatus.findUnique({
        where: { eletricistaId },
      });

    if (!status) {
      // Se não existe registro, assume ATIVO (compatibilidade)
      return {
        status: StatusEletricista.ATIVO,
        dataInicio: new Date(),
      };
    }

    return {
      status: status.status,
      dataInicio: status.dataInicio,
      dataFim: status.dataFim ?? undefined,
      motivo: status.motivo ?? undefined,
      observacoes: status.observacoes ?? undefined,
    };
  }

  /**
   * Registra uma mudança de status
   */
  async registrarStatus(dto: RegistrarStatusDto): Promise<void> {
    const prisma = this.databaseService.getPrisma();

    // Validar eletricista existe
    const eletricista = await prisma.eletricista.findUnique({
      where: { id: dto.eletricistaId },
    });

    if (!eletricista) {
      throw new NotFoundException(`Eletricista ${dto.eletricistaId} não encontrado`);
    }

    // Validar transição de status
    await this.validarTransicaoStatus(dto.eletricistaId, dto.status);

    // Obter status atual
    const statusAtual = await prisma.eletricistaStatus.findUnique({
      where: { eletricistaId: dto.eletricistaId },
    });

    const statusAnterior = statusAtual?.status ?? StatusEletricista.ATIVO;

    // Fechar registro anterior no histórico (se existir)
    if (statusAtual) {
      await prisma.eletricistaStatusHistorico.updateMany({
        where: {
          eletricistaId: dto.eletricistaId,
          dataFim: null,
        },
        data: {
          dataFim: dto.dataInicio ?? new Date(),
        },
      });
    }

    // Criar novo registro no histórico
    await prisma.eletricistaStatusHistorico.create({
      data: {
        eletricistaId: dto.eletricistaId,
        status: dto.status,
        statusAnterior,
        dataInicio: dto.dataInicio ?? new Date(),
        dataFim: dto.dataFim ?? null,
        motivo: dto.motivo ?? null,
        observacoes: dto.observacoes ?? null,
        documentoPath: dto.documentoPath ?? null,
        registradoPor: dto.registradoPor,
        createdBy: dto.registradoPor,
      },
    });

    // Atualizar ou criar status atual
    await prisma.eletricistaStatus.upsert({
      where: { eletricistaId: dto.eletricistaId },
      create: {
        eletricistaId: dto.eletricistaId,
        status: dto.status,
        dataInicio: dto.dataInicio ?? new Date(),
        dataFim: dto.dataFim ?? null,
        motivo: dto.motivo ?? null,
        observacoes: dto.observacoes ?? null,
        documentoPath: dto.documentoPath ?? null,
        createdBy: dto.registradoPor,
      },
      update: {
        status: dto.status,
        dataInicio: dto.dataInicio ?? new Date(),
        dataFim: dto.dataFim ?? null,
        motivo: dto.motivo ?? null,
        observacoes: dto.observacoes ?? null,
        documentoPath: dto.documentoPath ?? null,
        updatedBy: dto.registradoPor,
      },
    });

    this.logger.log(
      `Status do eletricista ${dto.eletricistaId} alterado de ${statusAnterior} para ${dto.status}`
    );
  }

  /**
   * Obtém histórico de status de um eletricista
   */
  async getHistorico(
    eletricistaId: number,
    dataInicio?: Date,
    dataFim?: Date
  ) {
    const prisma = this.databaseService.getPrisma();

    return await prisma.eletricistaStatusHistorico.findMany({
      where: {
        eletricistaId,
        ...(dataInicio && { dataInicio: { gte: dataInicio } }),
        ...(dataFim && {
          OR: [{ dataFim: { lte: dataFim } }, { dataFim: null }],
        }),
      },
      orderBy: { dataInicio: 'desc' },
    });
  }

  /**
   * Verifica se eletricista pode ser escalado
   */
  async podeSerEscalado(eletricistaId: number): Promise<boolean> {
    const status = await this.getStatusAtual(eletricistaId);
    return status.status === StatusEletricista.ATIVO;
  }

  /**
   * Lista eletricistas por status
   */
  async listarPorStatus(status: StatusEletricista) {
    return await this.databaseService
      .getPrisma()
      .eletricistaStatus.findMany({
        where: { status },
        include: {
          eletricista: {
            include: {
              cargo: true,
              contrato: true,
            },
          },
        },
      });
  }

  /**
   * Lista eletricistas em férias/afastados em um período
   */
  async listarAfastadosNoPeriodo(dataInicio: Date, dataFim: Date) {
    const statusAfastados = [
      StatusEletricista.FERIAS,
      StatusEletricista.LICENCA_MEDICA,
      StatusEletricista.LICENCA_MATERNIDADE,
      StatusEletricista.LICENCA_PATERNIDADE,
      StatusEletricista.SUSPENSAO,
      StatusEletricista.AFastADO,
    ];

    return await this.databaseService
      .getPrisma()
      .eletricistaStatus.findMany({
        where: {
          status: { in: statusAfastados },
          dataInicio: { lte: dataFim },
          OR: [
            { dataFim: { gte: dataInicio } },
            { dataFim: null },
          ],
        },
        include: {
          eletricista: {
            include: {
              cargo: true,
            },
          },
        },
      });
  }

  /**
   * Valida se a transição de status é permitida
   */
  private async validarTransicaoStatus(
    eletricistaId: number,
    novoStatus: StatusEletricista
  ): Promise<void> {
    const statusAtual = await this.getStatusAtual(eletricistaId);

    // Status finais não permitem transição
    if (
      statusAtual.status === StatusEletricista.DESLIGADO ||
      statusAtual.status === StatusEletricista.APOSENTADO
    ) {
      throw new BadRequestException(
        `Não é possível alterar status de ${statusAtual.status}`
      );
    }

    // Validações específicas podem ser adicionadas aqui
    // Ex: não permitir férias sobrepostas, etc.
  }

  /**
   * Cria status inicial ao criar eletricista
   */
  async criarStatusInicial(
    eletricistaId: number,
    createdBy: string
  ): Promise<void> {
    await this.registrarStatus({
      eletricistaId,
      status: StatusEletricista.ATIVO,
      registradoPor: createdBy,
      motivo: 'Eletricista criado',
    });
  }
}
```

---

## 📡 Controller: EletricistaStatusController

**Arquivo:** `apps/api/src/modules/eletricista/controllers/eletricista-status.controller.ts`

```typescript
import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/engine/auth/guards/jwt-auth.guard';
import { GetUserId } from '@modules/engine/auth/decorators/get-user-id.decorator';
import { EletricistaStatusService } from '../services/eletricista-status.service';
import { StatusEletricista } from '@nexa-oper/db';

@ApiTags('eletricista-status')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('eletricista-status')
export class EletricistaStatusController {
  constructor(
    private readonly statusService: EletricistaStatusService
  ) {}

  @Get(':eletricistaId/atual')
  @ApiOperation({ summary: 'Obter status atual do eletricista' })
  async getStatusAtual(@Param('eletricistaId') eletricistaId: number) {
    return await this.statusService.getStatusAtual(eletricistaId);
  }

  @Post(':eletricistaId/registrar')
  @ApiOperation({ summary: 'Registrar mudança de status' })
  async registrarStatus(
    @Param('eletricistaId') eletricistaId: number,
    @Body() dto: any, // Criar DTO específico
    @GetUserId() userId: number
  ) {
    await this.statusService.registrarStatus({
      ...dto,
      eletricistaId,
      registradoPor: userId.toString(),
    });
    return { success: true };
  }

  @Get(':eletricistaId/historico')
  @ApiOperation({ summary: 'Obter histórico de status' })
  async getHistorico(
    @Param('eletricistaId') eletricistaId: number,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string
  ) {
    return await this.statusService.getHistorico(
      eletricistaId,
      dataInicio ? new Date(dataInicio) : undefined,
      dataFim ? new Date(dataFim) : undefined
    );
  }

  @Get('por-status/:status')
  @ApiOperation({ summary: 'Listar eletricistas por status' })
  async listarPorStatus(@Param('status') status: StatusEletricista) {
    return await this.statusService.listarPorStatus(status);
  }

  @Get('afastados')
  @ApiOperation({ summary: 'Listar eletricistas afastados no período' })
  async listarAfastados(
    @Query('dataInicio') dataInicio: string,
    @Query('dataFim') dataFim: string
  ) {
    return await this.statusService.listarAfastadosNoPeriodo(
      new Date(dataInicio),
      new Date(dataFim)
    );
  }
}
```

---

## 🔗 Integração com Escalas

**Arquivo:** `apps/api/src/modules/escala/services/escala-validacao.service.ts`

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { EletricistaStatusService } from '@modules/eletricista/services/eletricista-status.service';

@Injectable()
export class EscalaValidacaoService {
  constructor(
    private readonly statusService: EletricistaStatusService
  ) {}

  /**
   * Valida se eletricista pode ser escalado
   */
  async validarEscalacao(eletricistaId: number): Promise<void> {
    const podeEscalar = await this.statusService.podeSerEscalado(eletricistaId);

    if (!podeEscalar) {
      const status = await this.statusService.getStatusAtual(eletricistaId);
      throw new BadRequestException(
        `Eletricista não pode ser escalado. Status atual: ${status.status}`
      );
    }
  }

  /**
   * Valida múltiplos eletricistas
   */
  async validarEscalacoes(eletricistaIds: number[]): Promise<void> {
    for (const id of eletricistaIds) {
      await this.validarEscalacao(id);
    }
  }
}
```

---

## 📝 Exemplos de Uso

### Registrar Férias
```typescript
await statusService.registrarStatus({
  eletricistaId: 123,
  status: StatusEletricista.FERIAS,
  dataInicio: new Date('2025-01-15'),
  dataFim: new Date('2025-02-15'),
  motivo: 'Férias anuais',
  observacoes: 'Férias programadas',
  registradoPor: 'admin@nexa.com'
});
```

### Verificar Status Antes de Escalar
```typescript
const podeEscalar = await statusService.podeSerEscalado(eletricistaId);
if (!podeEscalar) {
  // Não escalar e mostrar alerta
}
```

### Relatório de Afastados
```typescript
const afastados = await statusService.listarAfastadosNoPeriodo(
  new Date('2025-01-01'),
  new Date('2025-01-31')
);
```

---

## ✅ Checklist de Implementação

- [ ] Criar enum `StatusEletricista` no Prisma
- [ ] Criar modelos `EletricistaStatus` e `EletricistaStatusHistorico`
- [ ] Atualizar modelo `Eletricista`
- [ ] Criar migration do banco
- [ ] Criar `EletricistaStatusService`
- [ ] Criar `EletricistaStatusController`
- [ ] Criar DTOs de validação
- [ ] Integrar com criação de eletricista
- [ ] Integrar com módulo de escalas
- [ ] Criar endpoints da API
- [ ] Criar schemas Zod no frontend
- [ ] Criar componentes de UI
- [ ] Testes unitários
- [ ] Testes de integração

---

**Próximo passo:** Revisar e aprovar design, depois iniciar implementação.

