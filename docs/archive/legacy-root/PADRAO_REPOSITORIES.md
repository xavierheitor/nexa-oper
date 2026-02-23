# Padrão de Repositories - Documentação Completa

## Visão Geral

Este documento descreve o padrão padronizado para repositories na aplicação, garantindo consistência, type safety e facilidade de manutenção.

## Princípios

1. **Type Safety**: Uso de tipos do Prisma ao invés de `any`
2. **Consistência**: Todos os repositories seguem o mesmo padrão
3. **Extensibilidade**: Fácil adicionar filtros customizados quando necessário
4. **Reutilização**: Lógica comum centralizada no `AbstractCrudRepository`

## Estrutura Base

### AbstractCrudRepository

Todos os repositories devem estender `AbstractCrudRepository<T, F>` onde:
- `T` é o tipo do modelo (ex: `Falta`, `HoraExtra`)
- `F` é o tipo do filtro que estende `PaginationParams`

### Métodos Abstratos (Obrigatórios)

```typescript
abstract create(data: unknown): Promise<T>;
abstract update(id: number | string, data: unknown): Promise<T>;
abstract delete(id: number | string, userId: string): Promise<T>;
abstract findById(id: number | string): Promise<T | null>;
protected abstract getSearchFields(): string[];
protected abstract findMany(
  where: GenericPrismaWhereInput,
  orderBy: GenericPrismaOrderByInput,
  skip: number,
  take: number,
  include?: GenericPrismaIncludeInput
): Promise<T[]>;
protected abstract count(where: GenericPrismaWhereInput): Promise<number>;
```

### Métodos Opcionais (Podem ser Sobrescritos)

```typescript
protected buildCustomFilters(
  params: F,
  baseWhere: GenericPrismaWhereInput
): GenericPrismaWhereInput;

protected getDefaultInclude(): GenericPrismaIncludeInput | undefined;

protected hasSoftDelete(): boolean; // Retorna true por padrão
```

## Exemplo Completo

### Repository Simples (sem filtros customizados)

```typescript
import { TipoAtividade, Prisma } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import type { PaginationParams } from '../../types/common';
import type {
  GenericPrismaWhereInput,
  GenericPrismaOrderByInput,
  GenericPrismaIncludeInput,
} from '../../types/prisma';

interface TipoAtividadeFilter extends PaginationParams {
  // Sem filtros customizados além dos padrões
}

export class TipoAtividadeRepository extends AbstractCrudRepository<
  TipoAtividade,
  TipoAtividadeFilter
> {
  protected getSearchFields(): string[] {
    return ['nome', 'descricao'];
  }

  protected async findMany(
    where: GenericPrismaWhereInput,
    orderBy: GenericPrismaOrderByInput,
    skip: number,
    take: number,
    include?: GenericPrismaIncludeInput
  ): Promise<TipoAtividade[]> {
    return prisma.tipoAtividade.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include || this.getDefaultInclude(),
    });
  }

  protected async count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.tipoAtividade.count({ where });
  }

  async create(data: Prisma.TipoAtividadeCreateInput): Promise<TipoAtividade> {
    return prisma.tipoAtividade.create({
      data: {
        ...data,
        createdAt: new Date(),
      },
      include: this.getDefaultInclude(),
    });
  }

  async update(
    id: number | string,
    data: Prisma.TipoAtividadeUpdateInput
  ): Promise<TipoAtividade> {
    return prisma.tipoAtividade.update({
      where: { id: Number(id) },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: this.getDefaultInclude(),
    });
  }

  async delete(id: number | string, userId: string): Promise<TipoAtividade> {
    return prisma.tipoAtividade.update({
      where: { id: Number(id) },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
      include: this.getDefaultInclude(),
    });
  }

  async findById(id: number | string): Promise<TipoAtividade | null> {
    return prisma.tipoAtividade.findUnique({
      where: { id: Number(id) },
      include: this.getDefaultInclude(),
    });
  }

  protected getDefaultInclude(): GenericPrismaIncludeInput {
    return undefined; // Sem includes padrão
  }
}
```

### Repository com Filtros Customizados

```typescript
import { Falta, Prisma } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import type { PaginationParams } from '../../types/common';
import type {
  GenericPrismaWhereInput,
  GenericPrismaOrderByInput,
  GenericPrismaIncludeInput,
} from '../../types/prisma';

interface FaltaFilter extends PaginationParams {
  eletricistaId?: number;
  equipeId?: number;
  dataInicio?: Date;
  dataFim?: Date;
  status?: string;
}

export class FaltaRepository extends AbstractCrudRepository<
  Falta,
  FaltaFilter
> {
  protected getSearchFields(): string[] {
    return ['motivoSistema'];
  }

  protected async findMany(
    where: GenericPrismaWhereInput,
    orderBy: GenericPrismaOrderByInput,
    skip: number,
    take: number,
    include?: GenericPrismaIncludeInput
  ): Promise<Falta[]> {
    return prisma.falta.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include || this.getDefaultInclude(),
    });
  }

  protected async count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.falta.count({ where });
  }

  // Filtros customizados
  protected buildCustomFilters(
    params: FaltaFilter,
    baseWhere: GenericPrismaWhereInput
  ): GenericPrismaWhereInput {
    const where: Prisma.FaltaWhereInput = {
      ...(baseWhere as Prisma.FaltaWhereInput),
    };

    if (params.eletricistaId) {
      where.eletricistaId = params.eletricistaId;
    }

    if (params.equipeId) {
      where.equipeId = params.equipeId;
    }

    if (params.dataInicio || params.dataFim) {
      where.dataReferencia = {};
      if (params.dataInicio) {
        where.dataReferencia.gte = params.dataInicio;
      }
      if (params.dataFim) {
        where.dataReferencia.lte = params.dataFim;
      }
    }

    if (params.status) {
      where.status = params.status;
    }

    return where;
  }

  // Sem soft delete
  protected hasSoftDelete(): boolean {
    return false;
  }

  // Includes padrão
  protected getDefaultInclude(): GenericPrismaIncludeInput {
    return {
      eletricista: {
        select: {
          id: true,
          nome: true,
          matricula: true,
        },
      },
      equipe: {
        select: {
          id: true,
          nome: true,
        },
      },
    };
  }

  // ... métodos CRUD (create, update, delete, findById)
}
```

## Tipos Importantes

### GenericPrismaWhereInput
Tipo genérico para condições WHERE do Prisma. Use `Prisma.ModelNameWhereInput` quando possível para type safety completo.

### GenericPrismaOrderByInput
Tipo genérico para ordenação do Prisma. Use `Prisma.ModelNameOrderByWithRelationInput` quando possível.

### GenericPrismaIncludeInput
Tipo genérico para includes do Prisma. Use `Prisma.ModelNameInclude` quando possível.

## Padrões de Filtros Customizados

### Filtro por ID de Relacionamento

```typescript
if (params.eletricistaId) {
  where.eletricistaId = params.eletricistaId;
}
```

### Filtro por Range de Datas

```typescript
if (params.dataInicio || params.dataFim) {
  where.dataReferencia = {};
  if (params.dataInicio) {
    where.dataReferencia.gte = params.dataInicio;
  }
  if (params.dataFim) {
    where.dataReferencia.lte = params.dataFim;
  }
}
```

### Filtro por Relacionamento Aninhado

```typescript
if (params.equipeId) {
  where.turnoRealizadoEletricista = {
    turnoRealizado: {
      equipeId: params.equipeId,
    },
  };
}
```

## Checklist de Refatoração

Ao refatorar um repository, verifique:

- [ ] Estende `AbstractCrudRepository<T, F>`
- [ ] Implementa todos os métodos abstratos
- [ ] Usa `GenericPrismaWhereInput`, `GenericPrismaOrderByInput`, `GenericPrismaIncludeInput` ao invés de `any`
- [ ] Remove método `list()` customizado (se existir) e usa `buildCustomFilters()` ao invés
- [ ] `getDefaultInclude()` é `protected` (não `private`)
- [ ] `hasSoftDelete()` retorna `false` se o modelo não tem soft delete
- [ ] Todos os métodos CRUD usam `this.getDefaultInclude()` para includes
- [ ] Não há uso de `any` no código

## Benefícios

1. **Type Safety**: TypeScript valida tipos em tempo de compilação
2. **Consistência**: Todos os repositories seguem o mesmo padrão
3. **Manutenibilidade**: Mudanças no padrão afetam todos os repositories automaticamente
4. **Produtividade**: Desenvolvedores sabem exatamente o que implementar
5. **Testabilidade**: Estrutura padronizada facilita testes

## Migração

Para migrar um repository existente:

1. Remova método `list()` customizado (se existir)
2. Adicione `buildCustomFilters()` com a lógica de filtros
3. Mude `private getDefaultInclude()` para `protected getDefaultInclude()`
4. Substitua `any` por tipos do Prisma
5. Adicione `hasSoftDelete()` se necessário
6. Teste todas as funcionalidades

