# Documentação Completa da API - Nexa Oper

> **Documentação técnica avançada para desenvolvedores** Última atualização: 2024

---

## 📋 Índice

1. [Introdução e Visão Geral](#introdução-e-visão-geral)
2. [Guia para Desenvolvedores Novos](#guia-para-desenvolvedores-novos)
3. [Arquitetura Detalhada](#arquitetura-detalhada)
4. [Padrões de Código](#padrões-de-código)
5. [Estrutura de Módulos](#estrutura-de-módulos)
6. [Sistema de Autenticação e Autorização](#sistema-de-autenticação-e-autorização)
7. [Logging e Tratamento de Erros](#logging-e-tratamento-de-erros)
8. [Configurações e Ambiente](#configurações-e-ambiente)
9. [Fluxos Principais de Negócio](#fluxos-principais-de-negócio)
10. [Jobs e Processamento Assíncrono](#jobs-e-processamento-assíncrono)
11. [Análise Avançada](#análise-avançada)
12. [Boas Práticas e Convenções](#boas-práticas-e-convenções)****

---

## Introdução e Visão Geral

### O que é a API Nexa Oper?

A API Nexa Oper é uma aplicação backend robusta construída com **NestJS** e **TypeScript**,
projetada para gerenciar operações de campo relacionadas a turnos, checklists, APR (Análise
Preliminar de Risco), veículos, equipes e eletricistas. A API serve tanto aplicações web quanto
mobile, fornecendo endpoints CRUD completos e sincronização otimizada.

### Stack Tecnológico

- **Framework**: NestJS 11.x
- **Linguagem**: TypeScript 5.7+
- **Banco de Dados**: MySQL via Prisma ORM
- **Autenticação**: JWT (Passport.js)
- **Validação**: class-validator + class-transformer
- **Documentação**: Swagger/OpenAPI
- **Agendamento**: @nestjs/schedule (Cron jobs)
- **Métricas**: Prometheus (prom-client)
- **Logging**: Sistema customizado com persistência em arquivos

### Características Principais

- ✅ **Arquitetura Modular**: Separação clara por domínios de negócio
- ✅ **Type Safety**: TypeScript em 100% do código
- ✅ **Validação Robusta**: DTOs com validação automática
- ✅ **Logging Estruturado**: Sistema completo de logs com sanitização
- ✅ **Tratamento de Erros**: Filtros globais padronizados
- ✅ **Permissões Granulares**: Sistema de permissões por contrato
- ✅ **Sincronização Otimizada**: Endpoints específicos para mobile
- ✅ **Jobs Agendados**: Processamento assíncrono e reconciliação automática
- ✅ **Observabilidade**: Health checks e métricas

---

## Guia para Desenvolvedores Novos

### 🚀 Primeiros Passos

#### 1. Pré-requisitos

```bash
# Node.js 18+ e npm/yarn instalados
node --version  # v18.0.0 ou superior
npm --version   # 9.0.0 ou superior
```

#### 2. Configuração do Ambiente

```bash
# 1. Clone o repositório (se ainda não fez)
cd /Users/xavier/projetos/nexa/nexa-oper

# 2. Instale as dependências
npm install

# 3. Configure o arquivo .env na pasta apps/api/
cd apps/api
cp .env.example .env  # Se existir, ou crie manualmente
```

#### 3. Variáveis de Ambiente Essenciais

Crie o arquivo `.env` em `apps/api/` com:

```env
# Ambiente
NODE_ENV=development
PORT=3001

# Banco de Dados (obrigatório)
DATABASE_URL="mysql://usuario:senha@localhost:3306/nexa_oper"

# Segurança (obrigatório - mínimo 32 caracteres)
JWT_SECRET="seu_jwt_secret_muito_longo_e_seguro_deve_ter_32_caracteres_minimo"

# CORS (opcional - padrão permite tudo em dev)
CORS_ORIGINS=http://localhost:3000

# Rate Limiting (opcional)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_PER_IP=20
RATE_LIMIT_MAX_PER_USER=5

# Uploads (opcional)
UPLOAD_ROOT=
UPLOAD_BASE_URL=
```

#### 4. Executar em Desenvolvimento

```bash
# Na pasta apps/api/
npm run dev

# A API estará disponível em:
# http://localhost:3001/api
# Swagger: http://localhost:3001/api/docs
```

### 📁 Estrutura de Pastas - Visão Geral

```bash
apps/api/src/
├── main.ts                 # Bootstrap da aplicação
├── app.module.ts           # Módulo raiz (orquestração)
├── app.controller.ts       # Rotas básicas (health, info)
├── app.service.ts          # Serviço principal
│
├── common/                 # Código compartilhado
│   ├── constants/          # Constantes globais
│   ├── decorators/         # Decorators customizados
│   ├── dto/                # DTOs compartilhados
│   ├── filters/            # Filtros de exceção
│   ├── interceptors/       # Interceptors globais
│   ├── middleware/         # Middlewares
│   ├── types/              # Tipos TypeScript
│   └── utils/              # Utilitários
│
├── config/                 # Configurações
│   ├── app.config.ts       # Config da aplicação
│   ├── cors.config.ts      # Config CORS
│   ├── security.config.ts  # Config segurança
│   ├── swagger.config.ts   # Config Swagger
│   └── validation.ts       # Schema de validação ENV
│
├── database/               # Módulo de banco
│   ├── database.module.ts  # Módulo Prisma
│   ├── database.service.ts # Serviço Prisma
│   └── database.controller.ts
│
├── health/                 # Health checks
├── metrics/                # Métricas Prometheus
│
├── modules/                # Módulos de negócio (domínio)
│   ├── apr/                # Análise Preliminar de Risco
│   ├── checklist/          # Checklists de segurança
│   ├── turno/              # Turnos de operação
│   ├── veiculo/            # Veículos
│   ├── equipe/             # Equipes
│   ├── eletricista/        # Eletricistas
│   ├── atividade/          # Tipos de atividade
│   ├── turno-realizado/    # Turnos realizados e reconciliação
│   ├── justificativas/     # Justificativas de faltas
│   └── mobile-upload/      # Uploads do mobile
│
├── core/                   # Infraestrutura transversal
│   ├── auth/               # Autenticação e permissões
│   ├── contracts/          # Contratos
│   ├── mobile-users/       # Usuários mobile
│   └── web-logs/           # Logs do web
│
└── internal/               # Processos internos/sistema
    └── reconciliacao/      # Reconciliação de turnos
```

### 🔑 Conceitos Fundamentais

#### 1. Módulos NestJS

Cada módulo de negócio segue uma estrutura padronizada:

```bash
modulo/
├── modulo.module.ts        # Declaração do módulo
├── controllers/             # Endpoints HTTP
│   ├── modulo.controller.ts      # CRUD (Web)
│   └── modulo-sync.controller.ts # Sincronização (Mobile)
├── services/               # Lógica de negócio
│   └── modulo.service.ts
├── dto/                     # Data Transfer Objects
│   ├── create-modulo.dto.ts
│   ├── update-modulo.dto.ts
│   ├── modulo-response.dto.ts
│   ├── modulo-list-response.dto.ts
│   ├── modulo-query.dto.ts
│   └── modulo-sync.dto.ts
├── constants/              # Constantes do módulo
│   └── modulo.constants.ts
└── README.md               # Documentação do módulo
```

#### 2. Fluxo de Requisição

```bash
1. Requisição HTTP
   ↓
2. Middleware (Logger, RateLimit)
   ↓
3. Guards (Auth, Permissions)
   ↓
4. Interceptors (ErrorLogging, OperationLogging)
   ↓
5. Controller (validação de DTOs)
   ↓
6. Service (lógica de negócio)
   ↓
7. Database (Prisma)
   ↓
8. Resposta HTTP
```

#### 3. Padrão de Nomenclatura

- **Controllers**: `*.controller.ts` (ex: `turno.controller.ts`)
- **Services**: `*.service.ts` (ex: `turno.service.ts`)
- **DTOs**: `*-*.dto.ts` (ex: `create-turno.dto.ts`)
- **Módulos**: `*.module.ts` (ex: `turno.module.ts`)
- **Constantes**: `*.constants.ts` (ex: `turno.constants.ts`)

#### 4. Path Aliases

O projeto usa aliases para imports:

```typescript
// ✅ Correto
import { StandardLogger } from '@common/utils/logger';
import { TurnoService } from '@modules/turno/services/turno.service';
import { DatabaseService } from '@database/database.service';

// ❌ Evitar caminhos relativos longos
import { StandardLogger } from '../../../common/utils/logger';
```

Aliases configurados em `tsconfig.json`:

- `@common/*` → `src/common/*`
- `@modules/*` → `src/modules/*`
- `@database/*` → `src/database/*`
- `@app/*` → `src/*`

### 🎯 Exemplo Prático: Criando um Endpoint

Vamos criar um endpoint simples para listar veículos:

#### 1. DTO de Query (se necessário)

```typescript
// modules/veiculo/dto/veiculo-query.dto.ts
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class VeiculoQueryDto {
  @ApiPropertyOptional({ description: 'Página' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Limite por página' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Busca por placa ou modelo' })
  @IsOptional()
  @IsString()
  search?: string;
}
```

#### 2. Service

```typescript
// modules/veiculo/services/veiculo.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@database/database.service';
import { VeiculoQueryDto } from '../dto/veiculo-query.dto';
import { buildPaginationMeta, normalizePaginationParams } from '@common/utils/pagination';

@Injectable()
export class VeiculoService {
  private readonly logger = new Logger(VeiculoService.name);

  constructor(private readonly db: DatabaseService) {}

  async findAll(query: VeiculoQueryDto) {
    const { page, limit, skip } = normalizePaginationParams(query.page, query.limit);

    const where: any = {};

    if (query.search) {
      where.OR = [{ placa: { contains: query.search } }, { modelo: { contains: query.search } }];
    }

    const [veiculos, total] = await Promise.all([
      this.db.getPrisma().veiculo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.getPrisma().veiculo.count({ where }),
    ]);

    return {
      data: veiculos,
      meta: buildPaginationMeta(page, limit, total),
    };
  }
}
```

#### 3. Controller

```typescript
// modules/veiculo/controllers/veiculo.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VeiculoService } from '../services/veiculo.service';
import { VeiculoQueryDto } from '../dto/veiculo-query.dto';

@ApiTags('veiculos')
@Controller('veiculos')
export class VeiculoController {
  constructor(private readonly veiculoService: VeiculoService) {}

  @Get()
  @ApiOperation({ summary: 'Lista veículos' })
  @ApiResponse({ status: 200, description: 'Lista paginada de veículos' })
  async findAll(@Query() query: VeiculoQueryDto) {
    return this.veiculoService.findAll(query);
  }
}
```

#### 4. Registrar no Módulo

```typescript
// modules/veiculo/veiculo.module.ts
import { Module } from '@nestjs/common';
import { VeiculoController } from './controllers/veiculo.controller';
import { VeiculoService } from './services/veiculo.service';
import { DatabaseModule } from '@database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [VeiculoController],
  providers: [VeiculoService],
  exports: [VeiculoService],
})
export class VeiculoModule {}
```

#### 5. Importar no AppModule

```typescript
// app.module.ts
import { VeiculoModule } from '@modules/veiculo/veiculo.module';

@Module({
  imports: [
    // ... outros módulos
    VeiculoModule,
  ],
})
export class AppModule {}
```

---

## Arquitetura Detalhada

### Visão Geral da Arquitetura

A API segue os princípios de **Arquitetura em Camadas** e **Domain-Driven Design (DDD)**:

```bash
┌─────────────────────────────────────────────────┐
│           Camada de Apresentação                │
│  (Controllers, DTOs, Guards, Interceptors)       │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│           Camada de Aplicação                    │
│  (Services, Use Cases, Business Logic)          │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│           Camada de Infraestrutura              │
│  (Database, External APIs, File System)         │
└─────────────────────────────────────────────────┘
```

### Camada de Apresentação

#### Controllers

Responsabilidades:

- Receber requisições HTTP
- Validar DTOs de entrada
- Chamar services apropriados
- Retornar respostas HTTP padronizadas
- Documentar endpoints no Swagger

**Padrão de Controller**:

```typescript
@ApiTags('modulo')
@Controller('modulo')
export class ModuloController {
  constructor(private readonly moduloService: ModuloService) {}

  @Get()
  @ApiOperation({ summary: 'Lista recursos' })
  @ApiResponse({ status: 200, type: ModuloListResponseDto })
  async findAll(@Query() query: ModuloQueryDto) {
    return this.moduloService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Cria recurso' })
  @ApiResponse({ status: 201, type: ModuloResponseDto })
  async create(@Body() dto: CreateModuloDto) {
    return this.moduloService.create(dto);
  }
}
```

#### DTOs (Data Transfer Objects)

Funções:

- Validação de entrada
- Documentação Swagger
- Type safety
- Transformação de dados

**Padrão de DTO**:

```typescript
export class CreateModuloDto {
  @ApiProperty({ description: 'Nome do recurso', example: 'Recurso 1' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  nome: string;

  @ApiProperty({ description: 'Descrição', required: false })
  @IsOptional()
  @IsString()
  descricao?: string;
}
```

### Camada de Aplicação

#### Services

Responsabilidades:

- Lógica de negócio
- Validações complexas
- Orquestração de operações
- Integração com banco de dados
- Tratamento de erros de negócio

**Padrão de Service**:

```typescript
@Injectable()
export class ModuloService {
  private readonly logger = new Logger(ModuloService.name);

  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreateModuloDto): Promise<ModuloResponseDto> {
    // 1. Validações de negócio
    await this.validateBusinessRules(dto);

    // 2. Transformação de dados
    const data = this.transformDtoToEntity(dto);

    // 3. Persistência
    const created = await this.db.getPrisma().modulo.create({ data });

    // 4. Logging
    this.logger.log(`Módulo criado: ${created.id}`);

    // 5. Transformação de resposta
    return this.transformEntityToDto(created);
  }
}
```

### Camada de Infraestrutura

#### Database Module

O módulo de banco de dados fornece acesso ao Prisma Client:

```typescript
// database/database.module.ts
@Module({
  providers: [
    DatabaseService,
    {
      provide: PrismaClient,
      useFactory: (databaseService: DatabaseService) => {
        return databaseService.getPrisma();
      },
      inject: [DatabaseService],
    },
  ],
  exports: [DatabaseService, PrismaClient],
})
export class DatabaseModule {}
```

**Uso em Services**:

```typescript
constructor(private readonly db: DatabaseService) {}

// Acesso ao Prisma
const prisma = this.db.getPrisma();
const veiculo = await prisma.veiculo.findUnique({ where: { id } });
```

### Cross-Cutting Concerns

#### Middlewares

**LoggerMiddleware** (Global):

- Logging de todas as requisições
- Medição de tempo de execução
- Registro de status HTTP

**RateLimitMiddleware** (Login):

- Limitação de tentativas por IP
- Limitação por usuário (matrícula)
- Configurável via ENV

#### Interceptors

**ErrorLoggingInterceptor** (Global):

- Captura erros não tratados
- Logging estruturado
- Contexto completo

**OperationLoggingInterceptor** (Global):

- Logging automático de operações
- Usa decorator `@LogOperation`
- Medição de performance

**SyncAuditRemoverInterceptor** (Sync endpoints):

- Remove campos de auditoria de respostas sync
- Reduz payload em ~40%
- Aplicado automaticamente em rotas `/sync`

#### Filters

**AllExceptionsFilter** (Global):

- Tratamento padronizado de exceções
- Respostas HTTP consistentes
- Logging diferenciado por severidade

### Inicialização da Aplicação

O arquivo `main.ts` é responsável pelo bootstrap:

```typescript
async function bootstrap() {
  // 1. Carregar variáveis de ambiente
  loadEnvironmentVariables();

  // 2. Criar aplicação NestJS
  const app = await NestFactory.create(AppModule);

  // 3. Configurar segurança (Helmet)
  configureSecurity(app);

  // 4. Configurar CORS
  configureCors(app);

  // 5. Configurar validação global
  configureValidationPipe(app);

  // 6. Configurar filtro global de exceções
  app.useGlobalFilters(new AllExceptionsFilter());

  // 7. Configurar Swagger (dev apenas)
  configureSwagger(app);

  // 8. Configurar prefixo global
  configureGlobalPrefix(app, 'api');

  // 9. Configurar graceful shutdown
  setupGracefulShutdown(app);

  // 10. Iniciar servidor
  await app.listen(3001);
}
```

---

## Padrões de Código

### Convenções de Nomenclatura

#### Classes e Interfaces

```typescript
// ✅ PascalCase para classes
export class TurnoService {}
export class VeiculoController {}

// ✅ PascalCase para interfaces
export interface CreateTurnoDto {}
export interface TurnoResponse {}
```

#### Variáveis e Funções

```typescript
// ✅ camelCase para variáveis e funções
const veiculoId = 123;
function calcularTotal() {}

// ✅ UPPER_SNAKE_CASE para constantes
const MAX_RETRIES = 3;
const DEFAULT_PAGE_SIZE = 10;
```

#### Arquivos

```typescript
// ✅ kebab-case para arquivos
turno.service.ts;
veiculo.controller.ts;
create - turno.dto.ts;
```

### Estrutura de Imports

```typescript
// 1. Imports do NestJS/core
import { Injectable, Logger, Get, Post } from '@nestjs/common';

// 2. Imports de bibliotecas externas
import { PrismaClient } from '@nexa-oper/db';

// 3. Imports internos (common primeiro)
import { StandardLogger } from '@common/utils/logger';
import { DatabaseService } from '@database/database.service';

// 4. Imports do próprio módulo
import { CreateTurnoDto } from '../dto/create-turno.dto';
import { TurnoService } from './turno.service';
```

### Padrão de Validação

#### DTOs com class-validator

```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVeiculoDto {
  @ApiProperty({ description: 'Placa do veículo', example: 'ABC-1234' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{3}-[0-9]{4}$/, { message: 'Placa inválida' })
  placa: string;

  @ApiPropertyOptional({ description: 'Ano do veículo' })
  @IsOptional()
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear())
  ano?: number;
}
```

### Padrão de Paginação

```typescript
import { buildPaginationMeta, normalizePaginationParams } from '@common/utils/pagination';

async findAll(query: QueryDto) {
  const { page, limit, skip } = normalizePaginationParams(query.page, query.limit);

  const [data, total] = await Promise.all([
    this.db.getPrisma().entity.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    this.db.getPrisma().entity.count(),
  ]);

  return {
    data,
    meta: buildPaginationMeta(page, limit, total),
  };
}
```

### Padrão de Tratamento de Erros

```typescript
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { handleCrudError } from '@common/utils/error-handler';

async findOne(id: number) {
  try {
    const entity = await this.db.getPrisma().entity.findUnique({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException('Entidade não encontrada');
    }

    return entity;
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw error;
    }
    throw handleCrudError(error, 'Erro ao buscar entidade');
  }
}
```

### Padrão de Logging

```typescript
import { StandardLogger } from '@common/utils/logger';

@Injectable()
export class ModuloService {
  private readonly logger = new StandardLogger(ModuloService.name);

  async create(dto: CreateDto) {
    this.logger.operationStart('Criar módulo', { nome: dto.nome });

    try {
      const created = await this.db.getPrisma().modulo.create({ data: dto });
      this.logger.operationEnd('Criar módulo', { id: created.id });
      return created;
    } catch (error) {
      this.logger.errorWithContext('Erro ao criar módulo', error);
      throw error;
    }
  }
}
```

### Padrão de Auditoria

```typescript
import { createAuditData, updateAuditData } from '@common/utils/audit';
import { getDefaultUserContext } from '@common/utils/audit';

async create(dto: CreateDto) {
  const userContext = getDefaultUserContext(); // Extrai do request

  const data = {
    ...dto,
    ...createAuditData(userContext), // Adiciona createdAt, createdBy
  };

  return await this.db.getPrisma().modulo.create({ data });
}

async update(id: number, dto: UpdateDto) {
  const userContext = getDefaultUserContext();

  return await this.db.getPrisma().modulo.update({
    where: { id },
    data: {
      ...dto,
      ...updateAuditData(userContext), // Adiciona updatedAt, updatedBy
    },
  });
}
```

### Padrão de Permissões de Contrato

```typescript
import { UseGuards } from '@nestjs/common';
import { ContractPermissionsGuard } from '@core/auth/guards/contract-permissions.guard';
import { RequireContractPermission } from '@core/auth/decorators/contract-permission.decorator';

@Controller('veiculos')
@UseGuards(ContractPermissionsGuard)
export class VeiculoController {
  @Get()
  @RequireContractPermission('contratoId') // Verifica permissão
  async findAll(@Query('contratoId') contratoId: number) {
    // Endpoint só executa se usuário tiver permissão no contrato
  }
}
```

---

## Estrutura de Módulos

### Organização Padrão de Módulos

Cada módulo de negócio segue esta estrutura:

```bash
modulo/
├── modulo.module.ts              # Declaração do módulo NestJS
├── constants/
│   ├── modulo.constants.ts       # Constantes específicas
│   └── index.ts                   # Barrel export
├── controllers/
│   ├── modulo.controller.ts       # CRUD para Web
│   ├── modulo-sync.controller.ts  # Sincronização Mobile
│   └── index.ts                   # Barrel export
├── services/
│   ├── modulo.service.ts          # Lógica de negócio
│   └── index.ts                   # Barrel export
├── dto/
│   ├── create-modulo.dto.ts       # DTO de criação
│   ├── update-modulo.dto.ts       # DTO de atualização
│   ├── modulo-response.dto.ts     # DTO de resposta individual
│   ├── modulo-list-response.dto.ts # DTO de resposta paginada
│   ├── modulo-query.dto.ts        # DTO de query params
│   ├── modulo-sync.dto.ts         # DTO de sincronização
│   └── index.ts                   # Barrel export
└── README.md                       # Documentação do módulo
```

### Módulos Principais

#### 1. Módulo de Turnos (`turno/`)

**Responsabilidades**:

- Abertura e fechamento de turnos
- Validações de conflito (veículo, equipe, eletricista)
- CRUD completo
- Sincronização mobile

**Endpoints Principais**:

- `POST /api/turnos/abrir` - Abre turno
- `POST /api/turnos/fechar` - Fecha turno
- `GET /api/turnos` - Lista turnos
- `GET /api/turnos/sync` - Sincronização mobile

**Validações de Negócio**:

- Não pode haver turno aberto para mesmo veículo
- Não pode haver turno aberto para mesma equipe
- Não pode haver turno aberto para mesmo eletricista
- Quilometragem final > quilometragem inicial
- Data de fechamento > data de abertura

#### 2. Módulo de Checklists (`checklist/`)

**Responsabilidades**:

- Gerenciamento de modelos de checklist
- Perguntas e opções de resposta
- Relações com tipos de veículo e equipe
- Sincronização mobile

**Estrutura de Dados**:

```bash
Checklist
  ├── Perguntas
  │   └── Opções de Resposta
  ├── Relação com TipoVeículo
  └── Relação com TipoEquipe
```

#### 3. Módulo de APR (`apr/`)

**Responsabilidades**:

- Análise Preliminar de Risco
- Perguntas e opções de resposta
- Relações com tipos de atividade
- Sincronização mobile

#### 4. Módulo de Veículos (`veiculo/`)

**Responsabilidades**:

- CRUD de veículos
- Integração com permissões de contrato
- Sincronização mobile

**Permissões**:

- Usuários só veem veículos de contratos permitidos
- Validação automática via `ContractPermissionsGuard`

#### 5. Módulo de Turnos Realizados (`turno-realizado/`)

**Responsabilidades**:

- Reconciliação automática de turnos vs. escala
- Criação de faltas e horas extras
- Job agendado diário (23h)
- Processamento assíncrono

**Fluxo de Reconciliação**:

1. Compara turnos abertos com escala planejada
2. Identifica faltas (turno esperado não aberto)
3. Identifica horas extras (turno aberto em folga)
4. Cria registros de `TurnoRealizado`

#### 6. Módulo de Autenticação (`core/auth/`)

**Responsabilidades**:

- Autenticação JWT
- Verificação de permissões de contrato
- Guards e decorators
- Cache de permissões

**Componentes**:

- `AuthService`: Login e geração de tokens
- `ContractPermissionsService`: Verificação de permissões
- `ContractPermissionsGuard`: Guard de proteção
- Decorators: `@RequireContractPermission`, etc.

### Padrão de Módulo Completo

Exemplo completo de um módulo seguindo os padrões:

```typescript
// modulo/modulo.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '@core/auth/auth.module';
import { ModuloController, ModuloSyncController } from './controllers';
import { ModuloService } from './services';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [ModuloController, ModuloSyncController],
  providers: [ModuloService],
  exports: [ModuloService],
})
export class ModuloModule {}
```

---

## Sistema de Autenticação e Autorização

### Visão Geral

A API utiliza **JWT (JSON Web Tokens)** para autenticação e um sistema granular de **permissões por
contrato** para autorização.

### Fluxo de Autenticação

```bash
1. Cliente envia credenciais → POST /api/auth/login
   ↓
2. AuthService valida credenciais
   ↓
3. Gera JWT token com payload:
   {
     sub: userId,
     matricula: matricula,
     nome: nome,
     iat: timestamp,
     exp: timestamp + 24h
   }
   ↓
4. Retorna token ao cliente
   ↓
5. Cliente inclui token em requisições:
   Authorization: Bearer <token>
   ↓
6. JwtAuthGuard valida token
   ↓
7. Extrai usuário do token
   ↓
8. Disponibiliza req.user para controllers
```

### Implementação

#### 1. AuthService

```typescript
// core/auth/services/auth.service.ts
@Injectable()
export class AuthService {
  async login(matricula: string, senha: string) {
    // 1. Validar credenciais
    const user = await this.validateCredentials(matricula, senha);

    // 2. Gerar token
    const payload = {
      sub: user.id,
      matricula: user.matricula,
      nome: user.nome,
    };

    const token = this.jwtService.sign(payload);

    return { token, user };
  }
}
```

#### 2. JwtStrategy

```typescript
// core/auth/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    return {
      id: payload.sub,
      matricula: payload.matricula,
      nome: payload.nome,
    };
  }
}
```

#### 3. JwtAuthGuard

```typescript
// Uso em controllers
@Controller('veiculos')
@UseGuards(JwtAuthGuard) // Protege todas as rotas
export class VeiculoController {
  @Get()
  async findAll(@Request() req) {
    // req.user contém dados do usuário autenticado
    const userId = req.user.id;
  }
}
```

### Sistema de Permissões de Contrato

#### Conceito

Usuários móveis têm permissões específicas para acessar recursos de contratos. Por exemplo:

- Usuário A pode acessar veículos do Contrato 1 e 2
- Usuário B pode acessar veículos apenas do Contrato 3

##### Implementação

**1. ContractPermissionsService**:

```typescript
@Injectable()
export class ContractPermissionsService {
  private permissionCache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  async hasContractPermission(userId: number, contractId: number): Promise<boolean> {
    // 1. Verifica cache
    const cacheKey = `permission:${userId}:${contractId}`;
    const cached = this.permissionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    // 2. Consulta banco
    const permission = await this.db.getPrisma().mobileContratoPermissao.findFirst({
      where: {
        mobileUserId: userId,
        contratoId: contractId,
        deletedAt: null,
      },
    });

    const hasPermission = !!permission;

    // 3. Armazena em cache
    this.permissionCache.set(cacheKey, {
      data: hasPermission,
      timestamp: Date.now(),
    });

    return hasPermission;
  }

  async getUserContracts(userId: number): Promise<ContractPermission[]> {
    // Retorna lista de contratos permitidos
  }
}
```

**2. ContractPermissionsGuard**:

```typescript
@Injectable()
export class ContractPermissionsGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const permissionConfig = this.reflector.get(CONTRACT_PERMISSION_KEY, context.getHandler());

    if (!permissionConfig) {
      return true; // Sem configuração, permite acesso
    }

    const contractId = this.extractContractId(request, permissionConfig);
    const hasPermission = await this.contractPermissionsService.hasContractPermission(
      user.id,
      contractId
    );

    if (!hasPermission) {
      throw new ForbiddenException('Você não tem permissão para acessar este contrato');
    }

    return true;
  }
}
```

**3. Decorators**:

```typescript
// Decorator simples
@RequireContractPermission('contratoId')
@Get(':id')
async findOne(@Param('id') id: number, @Param('contratoId') contratoId: number) {
  // Guard verifica permissão automaticamente
}

// Decorator com opções
@RequireAnyContractPermission('contratoIds', { bodyPath: 'data.contractIds' })
@Post('batch')
async batchOperation(@Body() body: any) {
  // Verifica permissão para qualquer um dos contratos
}
```

**4. Uso em Services**:

```typescript
async findAll(allowedContracts: ContractPermission[] | null) {
  const allowedContractIds = extractAllowedContractIds(allowedContracts);

  const where: any = {};

  if (allowedContractIds) {
    where.contratoId = { in: allowedContractIds };
  }

  return await this.db.getPrisma().veiculo.findMany({ where });
}
```

### Helpers de Permissão

```typescript
// core/auth/utils/contract-helpers.ts

// Extrai IDs de contratos permitidos
export function extractAllowedContractIds(
  allowedContracts?: ContractPermission[]
): number[] | null {
  if (!allowedContracts || allowedContracts.length === 0) {
    return null; // Sem restrição
  }
  return allowedContracts.map(c => c.contratoId);
}

// Valida se contrato está na lista permitida
export function ensureContractPermission(
  contratoId: number,
  allowedContractIds: number[] | null,
  message = 'Você não tem permissão para acessar este contrato.'
): void {
  if (allowedContractIds && !allowedContractIds.includes(contratoId)) {
    throw new ForbiddenException(message);
  }
}
```

---

## Logging e Tratamento de Erros

### Sistema de Logging

#### StandardLogger

O projeto utiliza um logger customizado que estende o Logger do NestJS:

```typescript
import { StandardLogger } from '@common/utils/logger';

@Injectable()
export class ModuloService {
  private readonly logger = new StandardLogger(ModuloService.name);

  async create(dto: CreateDto) {
    // Logs básicos
    this.logger.log('Criando módulo');
    this.logger.debug('Dados recebidos', JSON.stringify(dto));
    this.logger.warn('Atenção: operação pode demorar');
    this.logger.error('Erro ao criar', error);

    // Logs especializados
    this.logger.operation('Operação de criação');
    this.logger.validation('Validação de dados');
    this.logger.database('Query executada');
    this.logger.auth('Verificação de permissão');
    this.logger.sync('Sincronização iniciada');

    // Logs com contexto
    this.logger.operationStart('Criar módulo', { nome: dto.nome });
    this.logger.operationEnd('Criar módulo', { id: created.id });
    this.logger.errorWithContext('Erro ao criar módulo', error, 'ModuloService');
  }
}
```

#### Persistência de Logs

Os logs são escritos em arquivos:

- **`logs/app.log`**: Todos os logs (info, log, warn, error)
- **`logs/error.log`**: Apenas erros (duplicado para facilitar análise)

**Configuração**:

```typescript
// Variável de ambiente (opcional)
LOG_PATH=./logs  // Padrão: ./logs
```

#### Sanitização de Dados Sensíveis

O logger sanitiza automaticamente dados sensíveis:

```typescript
// Headers sanitizados
authorization: '****'
cookie: '****'
x-api-key: '****'

// Campos do body sanitizados
password: '****'
senha: '****'
token: '****'
```

**Campos Sensíveis**:

- Headers: `authorization`, `cookie`, `x-api-key`, etc.
- Body: `password`, `senha`, `token`, `secret`, etc.

### Tratamento de Erros

#### AllExceptionsFilter

Filtro global que captura todas as exceções:

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    // Determina status HTTP
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    // Extrai mensagem
    const message =
      exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    // Log diferenciado por severidade
    if (status >= 500) {
      this.logger.error(`[500] ${request.method} ${request.url}`, error);
    } else if (status >= 400) {
      this.logger.warn(`[${status}] ${request.method} ${request.url}`, message);
    }

    // Resposta padronizada
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
```

#### Padrão de Erros HTTP

```typescript
// Erros de cliente (4xx)
throw new BadRequestException('Dados inválidos');
throw new UnauthorizedException('Não autenticado');
throw new ForbiddenException('Sem permissão');
throw new NotFoundException('Recurso não encontrado');
throw new ConflictException('Conflito de dados');

// Erros de servidor (5xx)
throw new InternalServerErrorException('Erro interno');
```

#### Utilitários de Erro

```typescript
import { handleCrudError } from '@common/utils/error-handler';

try {
  await this.db.getPrisma().modulo.create({ data });
} catch (error) {
  // Converte erros do Prisma em HttpExceptions apropriadas
  throw handleCrudError(error, 'Erro ao criar módulo');
}
```

### Níveis de Log

```typescript
enum LogLevel {
  ERROR = 'error', // Erros críticos
  WARN = 'warn', // Avisos
  LOG = 'log', // Informações gerais
  DEBUG = 'debug', // Debug (apenas dev)
  VERBOSE = 'verbose', // Verbose (apenas dev)
}
```

**Comportamento por Ambiente**:

- **Produção**: ERROR, WARN, LOG
- **Desenvolvimento**: Todos os níveis

---

## Configurações e Ambiente

### Variáveis de Ambiente

#### Validação de Variáveis

O projeto valida variáveis de ambiente usando **Joi**:

```typescript
// config/validation.ts
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3001),
  JWT_SECRET: Joi.string().min(32).required(),
  DATABASE_URL: Joi.string().uri().required(),
  // ...
});
```

#### Carregamento de Variáveis

```typescript
// config/env-loader.ts
export function loadEnvironmentVariables(): void {
  // Carrega .env antes de qualquer importação
  dotenv.config({ path: process.env.ENV_FILE_PATH || '.env' });
}
```

### Configurações por Módulo

#### App Config

```typescript
// config/app.config.ts
export function getAppConfig() {
  return {
    port: parseInt(process.env.PORT || '3001', 10),
    globalPrefix: 'api',
    requestTimeout: 30000, // 30s
    jsonLimit: '50mb',
    urlencodedLimit: '50mb',
    trustProxy: process.env.TRUST_PROXY === 'true',
  };
}
```

#### CORS Config

```typescript
// config/cors.config.ts
export function configureCors(app: INestApplication) {
  const origins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3000'];

  app.enableCors({
    origin: origins,
    credentials: true,
  });
}
```

#### Security Config

```typescript
// config/security.config.ts
export function configureSecurity(app: INestApplication) {
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false,
    })
  );
}
```

#### Swagger Config

```typescript
// config/swagger.config.ts
export function configureSwagger(app: INestApplication) {
  if (process.env.NODE_ENV === 'production') {
    return; // Swagger desabilitado em produção
  }

  const config = new DocumentBuilder()
    .setTitle('Nexa Oper API')
    .setDescription('API para gestão de operações de campo')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
}
```

### Configuração de Uploads

```env
# UPLOAD_ROOT: Caminho absoluto para pasta de uploads
# Padrão: ./uploads (relativo ao diretório de execução)
UPLOAD_ROOT=/var/www/nexa-oper/storage

# UPLOAD_BASE_URL: URL pública para acesso aos uploads
# Padrão: paths relativos servidos pela própria API
UPLOAD_BASE_URL=https://storage.nexaoper.com.br
```

**Estrutura de Pastas**:

```
{UPLOAD_ROOT}/
├── mobile/
│   └── photos/          # Fotos do mobile
├── checklists/
│   └── photos/          # Fotos de checklists
└── justificativas/
    └── anexos/          # Anexos de justificativas
```

---

## Fluxos Principais de Negócio

### Fluxo de Abertura de Turno

```
1. Cliente (Web/Mobile) → POST /api/turnos/abrir
   Payload: { veiculoId, equipeId, eletricistaIds, kmInicial, ... }
   ↓
2. TurnoController.abrir() valida DTO
   ↓
3. TurnoService.abrirTurno() executa:
   a. Valida existência de veículo, equipe, eletricistas
   b. Verifica conflitos:
      - Turno aberto para mesmo veículo?
      - Turno aberto para mesma equipe?
      - Turno aberto para mesmo eletricista?
   c. Valida permissões de contrato
   d. Cria registro de Turno no banco
   e. Retorna TurnoResponseDto
   ↓
4. Resposta HTTP 201 com dados do turno criado
```

**Validações de Negócio**:

- Veículo não pode ter turno aberto simultâneo
- Equipe não pode ter turno aberto simultâneo
- Eletricista não pode ter turno aberto simultâneo
- Usuário deve ter permissão no contrato do veículo

### Fluxo de Fechamento de Turno

```
1. Cliente → POST /api/turnos/fechar
   Payload: { turnoId, kmFinal, observacoes, ... }
   ↓
2. TurnoController.fechar() valida DTO
   ↓
3. TurnoService.fecharTurno() executa:
   a. Busca turno por ID
   b. Valida que turno está aberto
   c. Valida kmFinal > kmInicial
   d. Valida dataFechamento > dataAbertura
   e. Atualiza turno com dados de fechamento
   f. Dispara reconciliação assíncrona (se configurado)
   g. Retorna TurnoResponseDto
   ↓
4. Resposta HTTP 200 com turno fechado
```

### Fluxo de Sincronização Mobile

```
1. App Mobile → GET /api/turnos/sync?lastSync=2024-01-01T00:00:00Z
   ↓
2. TurnoSyncController.sync() valida query params
   ↓
3. TurnoService.sync() executa:
   a. Busca turnos modificados desde lastSync
   b. Aplica filtros de permissão de contrato
   c. Remove campos de auditoria (via interceptor)
   d. Retorna lista otimizada
   ↓
4. SyncAuditRemoverInterceptor remove:
   - createdAt, updatedAt, deletedAt
   - createdBy, updatedBy, deletedBy
   ↓
5. Resposta HTTP 200 com payload reduzido (~40% menor)
```

### Fluxo de Reconciliação de Turnos

```
1. Job agendado executa diariamente às 23h
   ↓
2. TurnoReconciliacaoSchedulerService.executarReconciliacaoDiaria()
   ↓
3. Para cada equipe com escala ativa:
   a. Busca slots de escala do dia
   b. Compara com turnos abertos
   c. Identifica:
      - Faltas: slot TRABALHO sem turno aberto (após margem de 30min)
      - Horas extras: turno aberto em slot FOLGA
      - Divergências: turno aberto fora do horário previsto
   d. Cria registros de TurnoRealizado
   ↓
4. Log de execução com estatísticas
```

**Regras de Reconciliação**:

- Margem de 30 minutos após `inicioPrevisto` antes de marcar falta
- Processa últimos 30 dias (configurável via ENV)
- Processa apenas dias não reconciliados após 23h

---

## Jobs e Processamento Assíncrono

### Sistema de Agendamento

O projeto utiliza `@nestjs/schedule` para jobs agendados:

```typescript
// app.module.ts
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    // ...
  ],
})
export class AppModule {}
```

### Job de Reconciliação Diária

```typescript
// modules/turno-realizado/turno-reconciliacao-scheduler.service.ts
@Injectable()
export class TurnoReconciliacaoSchedulerService {
  @Cron('0 23 * * *', {
    name: 'reconciliacao-turnos-diaria',
    timeZone: 'America/Sao_Paulo',
  })
  async executarReconciliacaoDiaria(): Promise<void> {
    this.logger.log('Iniciando reconciliação diária de turnos...');

    // 1. Calcular período (últimos 30 dias)
    const dataFim = new Date();
    dataFim.setHours(23, 59, 59, 999);
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - 30);
    dataInicio.setHours(0, 0, 0, 0);

    // 2. Buscar equipes com escala ativa
    const equipesComEscala = await this.db.getPrisma().escalaEquipePeriodo.findMany({
      where: {
        periodoInicio: { lte: dataFim },
        periodoFim: { gte: dataInicio },
        status: 'PUBLICADA',
      },
    });

    // 3. Processar cada equipe
    for (const escalaEquipe of equipesComEscala) {
      await this.processarEquipe(escalaEquipe.equipeId, dataInicio, dataFim);
    }

    this.logger.log('Reconciliação diária concluída');
  }
}
```

### Expressões Cron

```typescript
// Exemplos de expressões cron
'0 23 * * *'; // Diário às 23h
'0 */6 * * *'; // A cada 6 horas
'0 0 * * 1'; // Segunda-feira à meia-noite
'0 0 1 * *'; // Primeiro dia do mês à meia-noite
'*/30 * * * *'; // A cada 30 minutos
```

### Processamento Assíncrono

Para operações que não bloqueiam a resposta:

```typescript
// Exemplo: Reconciliação após fechamento de turno
async fecharTurno(dto: FecharTurnoDto) {
  // 1. Fecha turno (síncrono)
  const turnoFechado = await this.db.getPrisma().turno.update({
    where: { id: dto.turnoId },
    data: { /* ... */ },
  });

  // 2. Dispara reconciliação (assíncrono - não bloqueia)
  this.reconciliarTurnoAsync(turnoFechado.id).catch(error => {
    this.logger.error('Erro na reconciliação assíncrona', error);
  });

  // 3. Retorna resposta imediatamente
  return turnoFechado;
}

private async reconciliarTurnoAsync(turnoId: number): Promise<void> {
  // Processamento em background
  await this.turnoReconciliacaoService.reconciliarTurno(turnoId);
}
```

---

## Análise Avançada

### Performance e Otimizações

#### 1. Cache de Permissões

O sistema de permissões utiliza cache em memória:

```typescript
// Cache com TTL de 5 minutos
private permissionCache = new Map<string, CacheEntry>();
private readonly CACHE_TTL = 5 * 60 * 1000;

// Reduz consultas ao banco em ~80%
```

#### 2. Queries Otimizadas

```typescript
// ✅ Uso de select específico (não traz campos desnecessários)
const veiculo = await prisma.veiculo.findUnique({
  where: { id },
  select: {
    id: true,
    placa: true,
    modelo: true,
    // Apenas campos necessários
  },
});

// ✅ Uso de Promise.all para paralelização
const [veiculos, total] = await Promise.all([
  prisma.veiculo.findMany({ skip, take: limit }),
  prisma.veiculo.count(),
]);
```

#### 3. Redução de Payload em Sync

O `SyncAuditRemoverInterceptor` remove campos de auditoria:

```typescript
// Antes: ~100KB
{
  id: 1,
  nome: "Veículo",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  createdBy: 123,
  updatedBy: 123,
}

// Depois: ~60KB (redução de ~40%)
{
  id: 1,
  nome: "Veículo",
}
```

### Segurança

#### 1. Sanitização de Dados

```typescript
// Headers e body são sanitizados antes de logging
const sanitizedHeaders = sanitizeHeaders(request.headers);
const sanitizedBody = sanitizeData(request.body);
```

#### 2. Validação Rigorosa

```typescript
// DTOs com validação automática via class-validator
@IsString()
@IsNotEmpty()
@MinLength(3)
@MaxLength(100)
nome: string;
```

#### 3. Rate Limiting

```typescript
// Limitação de tentativas de login
@UseGuards(RateLimitMiddleware)
@Post('auth/login')
async login() {
  // Máximo 5 tentativas por usuário em 60 segundos
}
```

### Escalabilidade

#### 1. Arquitetura Modular

- Módulos independentes facilitam escalabilidade horizontal
- Services podem ser extraídos para microsserviços se necessário

#### 2. Processamento Assíncrono

- Jobs agendados não bloqueiam requisições HTTP
- Reconciliação executa em background

#### 3. Banco de Dados

- Prisma facilita migrações e versionamento
- Queries otimizadas com índices apropriados

### Observabilidade

#### 1. Logging Estruturado

```typescript
// Logs com contexto completo
this.logger.log('Operação executada', {
  userId: 123,
  operation: 'create',
  module: 'TurnoService',
  metadata: { turnoId: 456 },
});
```

#### 2. Health Checks

```typescript
// GET /api/health
{
  status: "ok",
  timestamp: "2024-01-01T00:00:00Z",
  uptime: 3600,
  database: "connected"
}
```

#### 3. Métricas Prometheus

```typescript
// GET /api/metrics
// Expõe métricas no formato Prometheus
```

---

## Boas Práticas e Convenções

### Princípios SOLID

#### 1. Single Responsibility Principle (SRP)

```typescript
// ✅ Cada service tem uma responsabilidade clara
@Injectable()
export class TurnoService {
  // Apenas lógica de turnos
}

@Injectable()
export class ChecklistService {
  // Apenas lógica de checklists
}
```

#### 2. Dependency Inversion Principle (DIP)

```typescript
// ✅ Depende de abstrações (interfaces), não implementações
constructor(
  private readonly db: DatabaseService, // Abstração
) {}
```

### Convenções de Código

#### 1. Comentários e Documentação

````typescript
/**
 * Serviço de Turnos
 *
 * Este serviço implementa toda a lógica de negócio relacionada
 * aos turnos da operação.
 *
 * @example
 * ```typescript
 * const turno = await turnoService.abrirTurno(dto);
 * ```
 */
@Injectable()
export class TurnoService {}
````

#### 2. Tratamento de Erros

```typescript
// ✅ Sempre trate erros específicos
try {
  await operation();
} catch (error) {
  if (error instanceof NotFoundException) {
    throw error; // Re-throw erros HTTP conhecidos
  }
  throw handleCrudError(error, 'Mensagem amigável');
}
```

#### 3. Validações

```typescript
// ✅ Valide entrada no controller (DTOs)
// ✅ Valide regras de negócio no service
async create(dto: CreateDto) {
  // Validação de negócio
  await this.validateBusinessRules(dto);

  // Persistência
  return await this.db.getPrisma().modulo.create({ data: dto });
}
```

### Testes

#### Estrutura de Testes

```typescript
// modulo.service.spec.ts
describe('ModuloService', () => {
  let service: ModuloService;
  let db: DatabaseService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ModuloService, DatabaseService],
    }).compile();

    service = module.get<ModuloService>(ModuloService);
    db = module.get<DatabaseService>(DatabaseService);
  });

  it('deve criar módulo', async () => {
    const dto = { nome: 'Teste' };
    const created = await service.create(dto);
    expect(created.nome).toBe('Teste');
  });
});
```

### Git e Versionamento

#### Commits

```bash
# Formato: tipo(escopo): descrição
feat(turno): adiciona validação de conflito
fix(auth): corrige verificação de permissão
docs(api): atualiza documentação de endpoints
refactor(common): simplifica utilitário de paginação
```

#### Branches

```bash
# Padrão: tipo/descrição
feature/nova-funcionalidade
bugfix/correcao-erro
hotfix/correcao-critica
```

---

## Conclusão

Esta documentação cobre os aspectos fundamentais e avançados da API Nexa Oper. Para informações
específicas sobre módulos individuais, consulte os arquivos `README.md` em cada módulo.

### Recursos Adicionais

- **Swagger**: `http://localhost:3001/api/docs` (desenvolvimento)
- **Health Check**: `http://localhost:3001/api/health`
- **Métricas**: `http://localhost:3001/api/metrics`

### Suporte

Para dúvidas ou problemas:

1. Consulte a documentação do módulo específico
2. Revise os exemplos de código nesta documentação
3. Analise o código-fonte dos módulos existentes

---

**Última atualização**: 2024 **Versão da API**: 1.0.0 **Framework**: NestJS 11.x
