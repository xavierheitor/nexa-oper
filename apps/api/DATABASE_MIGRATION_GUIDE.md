# Guia de Migração do DatabaseService

## Problema Resolvido

O `DatabaseService` estava usando um padrão singleton manual que:
- Bypassava o sistema de injeção de dependências do NestJS
- Criava instâncias não gerenciadas pelo NestJS
- Causava problemas de timezone (divergências de horário)
- Dificultava testes e mocks

## Solução Implementada

### 1. Remoção do Singleton Manual
- Removido `getDatabaseService()` e `db` proxy
- Mantido apenas injeção de dependência via NestJS
- Timezone configurado automaticamente no `onModuleInit()`

### 2. Configuração de Timezone
```typescript
// Configuração automática para GMT-3 (Brasília)
await this.prisma.$executeRaw`SET time_zone = '-03:00'`;
```

### 3. Verificação de Timezone
```typescript
// Verifica se o timezone foi configurado corretamente
const timezoneResult = await this.prisma.$queryRaw`SELECT @@session.time_zone as timezone`;
```

## Como Usar Agora

### ✅ Forma Recomendada (Injeção de Dependência)
```typescript
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@database/database.service';

@Injectable()
export class MeuService {
  constructor(private readonly databaseService: DatabaseService) {}

  async buscarUsuarios() {
    // Timezone já configurado automaticamente
    return await this.databaseService.getPrisma().user.findMany();
  }
}
```

### ✅ Alternativa (PrismaClient Direto)
```typescript
import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@nexa-oper/db';

@Injectable()
export class MeuService {
  constructor(@Inject(PrismaClient) private readonly prisma: PrismaClient) {}

  async buscarUsuarios() {
    // Timezone já configurado automaticamente
    return await this.prisma.user.findMany();
  }
}
```

### ❌ Forma Antiga (Removida)
```typescript
// NÃO FAÇA MAIS ISSO
import { db } from '@database/database.service';
const users = await db.user.findMany();
```

## Benefícios da Migração

1. **Timezone Consistente**: Todas as operações usam GMT-3 automaticamente
2. **Testabilidade**: Fácil de mockar via injeção de dependência
3. **Ciclo de Vida**: Gerenciado pelo NestJS (onModuleInit/onModuleDestroy)
4. **Padrões**: Segue as melhores práticas do NestJS
5. **Debugging**: Logs de timezone para verificação

## Arquivos Atualizados

- `apps/api/src/database/database.service.ts` - Removido singleton, melhorado timezone
- `apps/api/src/database/database.module.ts` - Adicionado PrismaClient provider
- `apps/api/src/modules/engine/auth/services/contract-permissions.service.ts` - Migrado para injeção de dependência

## Verificação de Timezone

O serviço agora verifica e loga o timezone configurado:
```
🌐 Timezone configurado: [{"timezone":"-03:00"}]
```

Isso garante que todas as operações de data/hora sejam consistentes com o horário de Brasília.
