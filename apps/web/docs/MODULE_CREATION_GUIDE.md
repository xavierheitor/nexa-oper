# 📦 Guia de Criação de Módulos - Nexa Oper

## 🎯 Visão Geral

Este guia ensina como criar novos módulos no sistema Nexa Oper seguindo a arquitetura estabelecida.
Usaremos como exemplo a criação do módulo **"Pergunta APR"** (Análise Preliminar de Risco).

## 🏗️ Arquitetura de Módulos

### **Estrutura Padrão de um Módulo**

```bash
PerguntaApr/
├── 1. Schema (Zod)           # Validação de dados
├── 2. Repository             # Acesso a dados
├── 3. Service                # Lógica de negócio
├── 4. Actions                # Server Actions
├── 5. Form                   # Formulário React
├── 6. Page                   # Página principal
└── 7. Registro               # Container de serviços
```

### **Fluxo de Criação**

```bash
1. Modelo Prisma → 2. Schema Zod → 3. Repository →
4. Service → 5. Actions → 6. Form → 7. Page → 8. Registro
```

---

## 📋 Passo a Passo Completo

### **Passo 1: Modelo Prisma (Banco de Dados)**

#### **Localização**: `packages/db/prisma/models/`

Primeiro, crie o modelo no Prisma:

```prisma
// packages/db/prisma/models/pergunta_apr.prisma

model PerguntaApr {
  id          Int      @id @default(autoincrement())
  titulo      String   @db.VarChar(255)
  descricao   String?  @db.Text
  categoria   String   @db.VarChar(100)
  obrigatoria Boolean  @default(false)
  ativa       Boolean  @default(true)
  ordem       Int      @default(0)

  // Campos de auditoria
  createdAt DateTime  @default(now())
  createdBy String    @db.VarChar(255)
  updatedAt DateTime  @updatedAt
  updatedBy String?   @db.VarChar(255)
  deletedAt DateTime?
  deletedBy String?   @db.VarChar(255)

  @@map("perguntas_apr")
}
```

#### ***Adicionar ao schema principal***

```prisma
// packages/db/prisma/schema.prisma
// Adicione a linha:
include "models/pergunta_apr.prisma"
```

#### **Executar migração**

```bash
cd packages/db
npx prisma migrate dev --name add_pergunta_apr
npx prisma generate
```

---

### **Passo 2: Schema Zod (Validação)**

#### **Localização**: `apps/web/src/lib/schemas/perguntaAprSchema.ts`

```typescript
/**
 * Schemas de Validação para Pergunta APR
 *
 * Define os schemas Zod para validação de dados de entrada
 * em operações CRUD de perguntas APR.
 */

import { z } from 'zod';

// Schema para criação de pergunta APR
export const perguntaAprCreateSchema = z.object({
  titulo: z
    .string()
    .min(1, 'Título é obrigatório')
    .max(255, 'Título deve ter no máximo 255 caracteres'),

  descricao: z.string().max(1000, 'Descrição deve ter no máximo 1000 caracteres').optional(),

  categoria: z
    .string()
    .min(1, 'Categoria é obrigatória')
    .max(100, 'Categoria deve ter no máximo 100 caracteres'),

  obrigatoria: z.boolean().default(false),

  ativa: z.boolean().default(true),

  ordem: z
    .number()
    .int('Ordem deve ser um número inteiro')
    .min(0, 'Ordem deve ser maior ou igual a 0')
    .default(0),
});

// Schema para atualização (inclui ID)
export const perguntaAprUpdateSchema = perguntaAprCreateSchema.extend({
  id: z.number().int().positive('ID deve ser um número inteiro positivo'),
});

// Schema para filtros e listagem
export const perguntaAprFilterSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(10),
  orderBy: z.string().default('ordem'),
  orderDir: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().optional(),
  categoria: z.string().optional(),
  obrigatoria: z.boolean().optional(),
  ativa: z.boolean().optional(),
  include: z.any().optional(), // Para includes dinâmicos
});

// Tipos derivados dos schemas
export type PerguntaAprCreate = z.infer<typeof perguntaAprCreateSchema>;
export type PerguntaAprUpdate = z.infer<typeof perguntaAprUpdateSchema>;
export type PerguntaAprFilter = z.infer<typeof perguntaAprFilterSchema>;
```

---

### **Passo 3: Repository (Acesso a Dados)**

#### **Localização**: `apps/web/src/lib/repositories/PerguntaAprRepository.ts`

````typescript
/**
 * Repositório para Perguntas APR
 *
 * Este repositório implementa operações de acesso a dados
 * para a entidade PerguntaApr, utilizando o padrão Repository
 * e estendendo a classe abstrata AbstractCrudRepository.
 *
 * FUNCIONALIDADES:
 * - Operações CRUD completas
 * - Paginação automática
 * - Busca por título e categoria
 * - Soft delete com auditoria
 * - Filtros por categoria, obrigatoriedade e status
 * - Integração com Prisma ORM
 *
 * COMO USAR:
 * ```typescript
 * const repository = new PerguntaAprRepository();
 * const perguntas = await repository.list({
 *   page: 1,
 *   pageSize: 10,
 *   categoria: 'Segurança',
 *   ativa: true
 * });
 * const pergunta = await repository.findById(1);
 * ```
 */

import { Prisma, PerguntaApr } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../abstracts/AbstractCrudRepository';
import { prisma } from '../db/db.service';
import type { PaginationParams } from '../types/common';

// Interface para filtros de pergunta APR
interface PerguntaAprFilter extends PaginationParams {
  categoria?: string;
  obrigatoria?: boolean;
  ativa?: boolean;
}

export class PerguntaAprRepository extends AbstractCrudRepository<PerguntaApr, PerguntaAprFilter> {
  /**
   * Cria uma nova pergunta APR
   *
   * @param data - Dados da pergunta APR
   * @param userId - ID do usuário que está criando
   * @returns Pergunta APR criada
   */
  create(data: Prisma.PerguntaAprCreateInput, userId?: string): Promise<PerguntaApr> {
    return prisma.perguntaApr.create({
      data: {
        ...data,
        createdBy: userId || '',
        createdAt: new Date(),
      },
    });
  }

  /**
   * Atualiza uma pergunta APR existente
   *
   * @param id - ID da pergunta APR
   * @param data - Dados para atualização
   * @param userId - ID do usuário que está atualizando
   * @returns Pergunta APR atualizada
   */
  update(id: number, data: Prisma.PerguntaAprUpdateInput, userId?: string): Promise<PerguntaApr> {
    return prisma.perguntaApr.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId || '',
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Exclui uma pergunta APR (soft delete)
   *
   * @param id - ID da pergunta APR
   * @param userId - ID do usuário que está excluindo
   * @returns Pergunta APR excluída
   */
  delete(id: number, userId: string): Promise<PerguntaApr> {
    return prisma.perguntaApr.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }

  /**
   * Busca uma pergunta APR por ID
   *
   * @param id - ID da pergunta APR
   * @returns Pergunta APR encontrada ou null
   */
  findById(id: number): Promise<PerguntaApr | null> {
    return prisma.perguntaApr.findUnique({
      where: { id, deletedAt: null },
    });
  }

  /**
   * Define os campos que podem ser utilizados para busca
   *
   * @returns Array com os nomes dos campos de busca
   */
  protected getSearchFields(): string[] {
    return ['titulo', 'categoria', 'descricao'];
  }

  /**
   * Executa a consulta findMany no Prisma
   *
   * @param where - Condições de filtro
   * @param orderBy - Ordenação
   * @param skip - Registros a pular
   * @param take - Registros a retornar
   * @param include - Relacionamentos a incluir (opcional)
   * @returns Array de perguntas APR
   */
  protected findMany(
    where: Prisma.PerguntaAprWhereInput,
    orderBy: Prisma.PerguntaAprOrderByWithRelationInput,
    skip: number,
    take: number,
    include?: any
  ): Promise<PerguntaApr[]> {
    return prisma.perguntaApr.findMany({
      where,
      orderBy,
      skip,
      take,
      ...(include && { include }),
    });
  }

  /**
   * Executa a consulta count no Prisma
   *
   * @param where - Condições de filtro
   * @returns Número total de perguntas APR
   */
  protected count(where: Prisma.PerguntaAprWhereInput): Promise<number> {
    return prisma.perguntaApr.count({ where });
  }

  /**
   * Busca perguntas por categoria
   *
   * @param categoria - Categoria das perguntas
   * @param ativa - Se deve buscar apenas perguntas ativas
   * @returns Array de perguntas da categoria
   */
  async findByCategoria(categoria: string, ativa: boolean = true): Promise<PerguntaApr[]> {
    return prisma.perguntaApr.findMany({
      where: {
        categoria,
        ativa,
        deletedAt: null,
      },
      orderBy: { ordem: 'asc' },
    });
  }

  /**
   * Busca perguntas obrigatórias
   *
   * @returns Array de perguntas obrigatórias ativas
   */
  async findObrigatorias(): Promise<PerguntaApr[]> {
    return prisma.perguntaApr.findMany({
      where: {
        obrigatoria: true,
        ativa: true,
        deletedAt: null,
      },
      orderBy: { ordem: 'asc' },
    });
  }
}
````

---

### **Passo 4: Service (Lógica de Negócio)**

#### **Localização**: `apps/web/src/lib/services/PerguntaAprService.ts`

````typescript
/**
 * Serviço para Perguntas APR
 *
 * Este serviço implementa a lógica de negócio para operações
 * relacionadas a perguntas APR, incluindo validação, transformação
 * de dados e integração com o repositório.
 *
 * FUNCIONALIDADES:
 * - Validação de dados com Zod
 * - Lógica de negócio centralizada
 * - Integração com repositório
 * - Tratamento de erros
 * - Auditoria automática
 * - Regras de negócio específicas
 *
 * COMO USAR:
 * ```typescript
 * const service = new PerguntaAprService();
 * const pergunta = await service.create(data, userId);
 * const perguntas = await service.list(filterParams);
 * const obrigatorias = await service.getObrigatorias();
 * ```
 */

import { PerguntaApr } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../abstracts/AbstractCrudService';
import { PerguntaAprRepository } from '../repositories/PerguntaAprRepository';
import {
  perguntaAprCreateSchema,
  perguntaAprFilterSchema,
  perguntaAprUpdateSchema,
  PerguntaAprCreate,
  PerguntaAprUpdate,
  PerguntaAprFilter,
} from '../schemas/perguntaAprSchema';
import { PaginatedResult } from '../types/common';

export class PerguntaAprService extends AbstractCrudService<
  PerguntaAprCreate,
  PerguntaAprUpdate,
  PerguntaAprFilter,
  PerguntaApr
> {
  private perguntaAprRepo: PerguntaAprRepository;

  /**
   * Construtor do serviço
   *
   * Inicializa o repositório e registra o serviço no container
   */
  constructor() {
    const repo = new PerguntaAprRepository();
    super(repo);
    this.perguntaAprRepo = repo;
  }

  /**
   * Cria uma nova pergunta APR
   *
   * @param raw - Dados brutos da pergunta APR
   * @param userId - ID do usuário que está criando
   * @returns Pergunta APR criada
   */
  async create(raw: unknown, userId: string): Promise<PerguntaApr> {
    // Valida os dados de entrada
    const data = perguntaAprCreateSchema.parse(raw);

    // Regra de negócio: definir ordem automática se não fornecida
    if (data.ordem === 0) {
      const ultimaOrdem = await this.getProximaOrdem(data.categoria);
      data.ordem = ultimaOrdem;
    }

    // Adiciona campos de auditoria
    const perguntaData = {
      ...data,
      createdBy: userId,
      createdAt: new Date(),
    };

    return this.perguntaAprRepo.create(perguntaData as any);
  }

  /**
   * Atualiza uma pergunta APR existente
   *
   * @param raw - Dados brutos da pergunta APR
   * @param userId - ID do usuário que está atualizando
   * @returns Pergunta APR atualizada
   */
  async update(raw: unknown, userId: string): Promise<PerguntaApr> {
    // Valida os dados de entrada
    const data = perguntaAprUpdateSchema.parse(raw);
    const { id, ...rest } = data;

    // Adiciona campos de auditoria
    const updateData = {
      ...rest,
      updatedBy: userId,
      updatedAt: new Date(),
    };

    return this.perguntaAprRepo.update(id, updateData as any);
  }

  /**
   * Exclui uma pergunta APR existente
   *
   * @param id - ID da pergunta APR
   * @param userId - ID do usuário que está excluindo
   * @returns Pergunta APR excluída
   */
  async delete(id: number, userId: string): Promise<PerguntaApr> {
    return this.perguntaAprRepo.delete(id, userId);
  }

  /**
   * Busca uma pergunta APR por ID
   *
   * @param id - ID da pergunta APR
   * @returns Pergunta APR encontrada ou null
   */
  async getById(id: number): Promise<PerguntaApr | null> {
    return this.perguntaAprRepo.findById(id);
  }

  /**
   * Lista perguntas APR com paginação
   *
   * @param params - Parâmetros de paginação e filtro
   * @returns Resultado paginado
   */
  async list(params: PerguntaAprFilter): Promise<PaginatedResult<PerguntaApr>> {
    const { items, total } = await this.perguntaAprRepo.list(params);
    const totalPages = Math.ceil(total / params.pageSize);

    return {
      data: items,
      total,
      totalPages,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  /**
   * Busca perguntas por categoria
   *
   * @param categoria - Categoria das perguntas
   * @param ativa - Se deve buscar apenas perguntas ativas
   * @returns Array de perguntas da categoria
   */
  async getPorCategoria(categoria: string, ativa: boolean = true): Promise<PerguntaApr[]> {
    return this.perguntaAprRepo.findByCategoria(categoria, ativa);
  }

  /**
   * Busca perguntas obrigatórias
   *
   * @returns Array de perguntas obrigatórias ativas
   */
  async getObrigatorias(): Promise<PerguntaApr[]> {
    return this.perguntaAprRepo.findObrigatorias();
  }

  /**
   * Obtém a próxima ordem disponível para uma categoria
   *
   * @param categoria - Categoria para calcular a ordem
   * @returns Próximo número de ordem
   */
  private async getProximaOrdem(categoria: string): Promise<number> {
    const perguntas = await this.perguntaAprRepo.findByCategoria(categoria, false);
    const maxOrdem = Math.max(...perguntas.map(p => p.ordem), 0);
    return maxOrdem + 1;
  }

  /**
   * Define os campos que podem ser utilizados para busca
   *
   * @returns Array com os nomes dos campos de busca
   */
  protected getSearchFields(): string[] {
    return ['titulo', 'categoria', 'descricao'];
  }
}
````

---

### **Passo 5: Actions (Server Actions)**

#### **Diretório**: `apps/web/src/lib/actions/perguntaApr/`

Crie o diretório e os arquivos:

```bash
mkdir -p apps/web/src/lib/actions/perguntaApr
```

#### **5.1. Create Action**

````typescript
// apps/web/src/lib/actions/perguntaApr/create.ts

/**
 * Server Action para Criação de Perguntas APR
 *
 * Esta action implementa a criação de perguntas APR através
 * de Server Actions do Next.js, incluindo validação,
 * autenticação e auditoria automática.
 *
 * FUNCIONALIDADES:
 * - Validação de dados com Zod
 * - Autenticação obrigatória
 * - Auditoria automática (createdBy, createdAt)
 * - Tratamento de erros
 * - Logging de operações
 * - Definição automática de ordem
 *
 * COMO USAR:
 * ```typescript
 * const result = await createPerguntaApr({
 *   titulo: 'Verificar EPI',
 *   categoria: 'Segurança',
 *   obrigatoria: true,
 *   ativa: true
 * });
 * ```
 */

'use server';

import type { PerguntaAprService } from '@/lib/services/PerguntaAprService';
import { container } from '@/lib/services/common/registerServices';
import { perguntaAprCreateSchema } from '../../schemas/perguntaAprSchema';
import { handleServerAction } from '../common/actionHandler';

/**
 * Cria uma nova pergunta APR
 *
 * @param rawData - Dados brutos da pergunta APR
 * @returns Resultado da operação com a pergunta criada
 */
export const createPerguntaApr = async (rawData: unknown) =>
  handleServerAction(
    perguntaAprCreateSchema,
    async (data, session) => {
      // Obtém o serviço do container
      const service = container.get<PerguntaAprService>('perguntaAprService');

      // Cria a pergunta com auditoria automática
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'PerguntaApr', actionType: 'create' }
  );
````

#### **5.2. List Action**

```typescript
// apps/web/src/lib/actions/perguntaApr/list.ts

/**
 * Server Action para Listagem de Perguntas APR
 *
 * Esta action implementa a listagem paginada de perguntas APR
 * com suporte a filtros, ordenação, busca e includes dinâmicos.
 */

'use server';

import type { PerguntaAprService } from '@/lib/services/PerguntaAprService';
import { container } from '@/lib/services/common/registerServices';
import { perguntaAprFilterSchema } from '../../schemas/perguntaAprSchema';
import { handleServerAction } from '../common/actionHandler';

export const listPerguntasApr = async (rawData: unknown) =>
  handleServerAction(
    perguntaAprFilterSchema,
    async data => {
      const service = container.get<PerguntaAprService>('perguntaAprService');
      return service.list(data);
    },
    rawData,
    { entityName: 'PerguntaApr', actionType: 'list' }
  );
```

#### **5.3. Update Action**

```typescript
// apps/web/src/lib/actions/perguntaApr/update.ts

'use server';

import type { PerguntaAprService } from '@/lib/services/PerguntaAprService';
import { container } from '@/lib/services/common/registerServices';
import { perguntaAprUpdateSchema } from '../../schemas/perguntaAprSchema';
import { handleServerAction } from '../common/actionHandler';

export const updatePerguntaApr = async (rawData: unknown) =>
  handleServerAction(
    perguntaAprUpdateSchema,
    async (data, session) => {
      const service = container.get<PerguntaAprService>('perguntaAprService');
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'PerguntaApr', actionType: 'update' }
  );
```

#### **5.4. Delete Action**

```typescript
// apps/web/src/lib/actions/perguntaApr/delete.ts

'use server';

import type { PerguntaAprService } from '@/lib/services/PerguntaAprService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

const deletePerguntaAprSchema = z.object({
  id: z.number().int().positive(),
});

export const deletePerguntaApr = async (rawData: unknown) =>
  handleServerAction(
    deletePerguntaAprSchema,
    async (data, session) => {
      const service = container.get<PerguntaAprService>('perguntaAprService');
      return service.delete(data.id, session.user.id);
    },
    rawData,
    { entityName: 'PerguntaApr', actionType: 'delete' }
  );
```

#### **5.5. Get Action**

```typescript
// apps/web/src/lib/actions/perguntaApr/get.ts

'use server';

import type { PerguntaAprService } from '@/lib/services/PerguntaAprService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

const getPerguntaAprSchema = z.object({
  id: z.number().int().positive(),
});

export const getPerguntaApr = async (rawData: unknown) =>
  handleServerAction(
    getPerguntaAprSchema,
    async data => {
      const service = container.get<PerguntaAprService>('perguntaAprService');
      return service.getById(data.id);
    },
    rawData,
    { entityName: 'PerguntaApr', actionType: 'get' }
  );
```

---

### **Passo 6: Formulário React**

#### **Diretório**: `apps/web/src/app/dashboard/pergunta-apr/`

```bash
mkdir -p apps/web/src/app/dashboard/pergunta-apr
```

#### **6.1. Form Component**

```typescript
// apps/web/src/app/dashboard/pergunta-apr/form.tsx

'use client';

import { Button, Form, Input, Select, Switch, InputNumber, Spin } from 'antd';
import { useEffect } from 'react';

const { TextArea } = Input;

// Interface para dados do formulário
export interface PerguntaAprFormData {
  titulo: string;
  descricao?: string;
  categoria: string;
  obrigatoria: boolean;
  ativa: boolean;
  ordem: number;
}

// Props do componente
interface PerguntaAprFormProps {
  onSubmit: (values: PerguntaAprFormData) => void;
  initialValues?: Partial<PerguntaAprFormData>;
  loading?: boolean;
}

// Opções de categoria
const CATEGORIAS = [
  { value: 'Segurança', label: 'Segurança' },
  { value: 'Meio Ambiente', label: 'Meio Ambiente' },
  { value: 'Qualidade', label: 'Qualidade' },
  { value: 'Operacional', label: 'Operacional' },
  { value: 'Equipamentos', label: 'Equipamentos' },
  { value: 'Pessoas', label: 'Pessoas' },
];

export default function PerguntaAprForm({
  onSubmit,
  initialValues,
  loading = false,
}: PerguntaAprFormProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
      // Valores padrão
      form.setFieldsValue({
        obrigatoria: false,
        ativa: true,
        ordem: 0,
      });
    }
  }, [initialValues, form]);

  if (loading) return <Spin spinning />;

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onSubmit}
      initialValues={{
        obrigatoria: false,
        ativa: true,
        ordem: 0,
      }}
    >
      {/* Título */}
      <Form.Item
        name="titulo"
        label="Título da Pergunta"
        rules={[
          { required: true, message: 'Título é obrigatório' },
          { min: 1, max: 255, message: 'Título deve ter entre 1 e 255 caracteres' }
        ]}
      >
        <Input
          autoFocus
          placeholder="Ex: Verificar uso de EPI adequado"
        />
      </Form.Item>

      {/* Descrição */}
      <Form.Item
        name="descricao"
        label="Descrição (Opcional)"
        rules={[
          { max: 1000, message: 'Descrição deve ter no máximo 1000 caracteres' }
        ]}
      >
        <TextArea
          rows={3}
          placeholder="Descrição detalhada da pergunta..."
        />
      </Form.Item>

      {/* Categoria */}
      <Form.Item
        name="categoria"
        label="Categoria"
        rules={[
          { required: true, message: 'Categoria é obrigatória' }
        ]}
      >
        <Select
          placeholder="Selecione a categoria"
          options={CATEGORIAS}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
      </Form.Item>

      {/* Ordem */}
      <Form.Item
        name="ordem"
        label="Ordem de Exibição"
        rules={[
          { required: true, message: 'Ordem é obrigatória' },
          { type: 'number', min: 0, message: 'Ordem deve ser maior ou igual a 0' }
        ]}
      >
        <InputNumber
          style={{ width: '100%' }}
          placeholder="0 = ordem automática"
          min={0}
        />
      </Form.Item>

      {/* Switches */}
      <div style={{ display: 'flex', gap: '24px' }}>
        <Form.Item
          name="obrigatoria"
          label="Pergunta Obrigatória"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="ativa"
          label="Pergunta Ativa"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </div>

      {/* Botão Submit */}
      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          block
          loading={loading}
        >
          Salvar
        </Button>
      </Form.Item>
    </Form>
  );
}
```

---

### **Passo 7: Página Principal**

#### **7.1. Page Component**

```typescript
// apps/web/src/app/dashboard/pergunta-apr/page.tsx

'use client';

import { createPerguntaApr } from '@/lib/actions/perguntaApr/create';
import { deletePerguntaApr } from '@/lib/actions/perguntaApr/delete';
import { listPerguntasApr } from '@/lib/actions/perguntaApr/list';
import { updatePerguntaApr } from '@/lib/actions/perguntaApr/update';

import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';

import { ActionResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';

import { PerguntaApr } from '@nexa-oper/db';
import { Button, Card, Modal, Table, Tag, Switch } from 'antd';

import PerguntaAprForm, { PerguntaAprFormData } from './form';

export default function PerguntaAprPage() {
  // Controller CRUD
  const controller = useCrudController<PerguntaApr>('perguntas-apr');

  // Dados da tabela
  const perguntasApr = useEntityData<PerguntaApr>({
    key: 'perguntas-apr',
    fetcher: unwrapFetcher(listPerguntasApr),
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'ordem',
      orderDir: 'asc',
    },
  });

  // Configuração das colunas
  const columns = useTableColumnsWithActions<PerguntaApr>(
    [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        sorter: true,
        width: 80,
      },
      {
        title: 'Título',
        dataIndex: 'titulo',
        key: 'titulo',
        sorter: true,
        ...getTextFilter<PerguntaApr>('titulo', 'título da pergunta'),
      },
      {
        title: 'Categoria',
        dataIndex: 'categoria',
        key: 'categoria',
        sorter: true,
        render: (categoria: string) => (
          <Tag color="blue">{categoria}</Tag>
        ),
        width: 130,
      },
      {
        title: 'Ordem',
        dataIndex: 'ordem',
        key: 'ordem',
        sorter: true,
        width: 80,
        align: 'center',
      },
      {
        title: 'Obrigatória',
        dataIndex: 'obrigatoria',
        key: 'obrigatoria',
        render: (obrigatoria: boolean) => (
          <Tag color={obrigatoria ? 'red' : 'default'}>
            {obrigatoria ? 'Sim' : 'Não'}
          </Tag>
        ),
        width: 100,
        align: 'center',
      },
      {
        title: 'Status',
        dataIndex: 'ativa',
        key: 'ativa',
        render: (ativa: boolean) => (
          <Tag color={ativa ? 'green' : 'default'}>
            {ativa ? 'Ativa' : 'Inativa'}
          </Tag>
        ),
        width: 100,
        align: 'center',
      },
      {
        title: 'Criado em',
        dataIndex: 'createdAt',
        key: 'createdAt',
        sorter: true,
        render: (date: Date) => new Date(date).toLocaleDateString('pt-BR'),
        width: 120,
      },
    ],
    {
      onEdit: controller.open,
      onDelete: (item) =>
        controller
          .exec(
            () => deletePerguntaApr({ id: item.id }),
            'Pergunta APR excluída com sucesso!'
          )
          .finally(() => {
            perguntasApr.mutate();
          }),
    },
  );

  // Submit do formulário
  const handleSubmit = async (values: PerguntaAprFormData) => {
    const action = async (): Promise<ActionResult<PerguntaApr>> => {
      const pergunta = controller.editingItem?.id
        ? await updatePerguntaApr({
          ...values,
          id: controller.editingItem.id,
        })
        : await createPerguntaApr(values);

      return { success: true, data: pergunta.data };
    };

    controller.exec(action, 'Pergunta APR salva com sucesso!').finally(() => {
      perguntasApr.mutate();
    });
  };

  if (perguntasApr.error) {
    return <p style={{ color: 'red' }}>Erro ao carregar perguntas APR.</p>;
  }

  return (
    <>
      <Card
        title="Perguntas APR"
        extra={
          <Button type="primary" onClick={() => controller.open()}>
            Adicionar
          </Button>
        }
      >
        <Table<PerguntaApr>
          columns={columns}
          dataSource={perguntasApr.data}
          loading={perguntasApr.isLoading}
          rowKey="id"
          pagination={perguntasApr.pagination}
          onChange={perguntasApr.handleTableChange}
        />
      </Card>

      <Modal
        title={controller.editingItem ? 'Editar Pergunta APR' : 'Nova Pergunta APR'}
        open={controller.isOpen}
        onCancel={controller.close}
        footer={null}
        destroyOnHidden
        width={600}
      >
        <PerguntaAprForm
          initialValues={controller.editingItem ? {
            titulo: controller.editingItem.titulo,
            descricao: controller.editingItem.descricao || '',
            categoria: controller.editingItem.categoria,
            obrigatoria: controller.editingItem.obrigatoria,
            ativa: controller.editingItem.ativa,
            ordem: controller.editingItem.ordem,
          } : undefined}
          onSubmit={handleSubmit}
          loading={controller.loading}
        />
      </Modal>
    </>
  );
}
```

---

### **Passo 8: Registro no Container**

#### **Localização**: `apps/web/src/lib/services/common/registerServices.ts`

```typescript
// Adicione as importações
import { PerguntaAprService } from '../PerguntaAprService';

// Adicione no método registerServices():
export function registerServices(): void {
  // ... outros serviços
  container.register('perguntaAprService', () => new PerguntaAprService());
}
```

---

## 🧪 Testando o Módulo

### **1. Executar Migração**

```bash
cd packages/db
npx prisma migrate dev
npx prisma generate
```

### **2. Iniciar Aplicação**

```bash
npm run dev
```

### **3. Acessar Interface**

```url
http://localhost:3000/dashboard/pergunta-apr
```

### **4. Testes Funcionais**

- ✅ Criar nova pergunta
- ✅ Listar perguntas com paginação
- ✅ Editar pergunta existente
- ✅ Excluir pergunta (soft delete)
- ✅ Filtros e busca
- ✅ Ordenação por campos

---

## 📋 Checklist de Criação

### **Backend**

- [ ] Modelo Prisma criado
- [ ] Migração executada
- [ ] Schema Zod implementado
- [ ] Repository implementado
- [ ] Service implementado
- [ ] Actions implementadas (create, list, update, delete, get)
- [ ] Serviço registrado no container

### **Frontend**

- [ ] Formulário React criado
- [ ] Página principal implementada
- [ ] Validações funcionando
- [ ] Tabela com ações implementada
- [ ] Modal de criação/edição funcionando

### **Qualidade**

- [ ] Documentação JSDoc completa
- [ ] Tipos TypeScript corretos
- [ ] ESLint sem erros
- [ ] Testes funcionais passando

---

## 🎯 Próximos Passos

1. **Customizar conforme necessário** - Adapte campos e validações
2. **Adicionar relacionamentos** - Se necessário, crie relacionamentos com outras entidades
3. **Implementar regras de negócio** - Adicione lógicas específicas no Service
4. **Criar testes unitários** - Implemente testes para Repository e Service
5. **Documentar APIs** - Crie documentação específica do módulo

---

**🎉 Módulo criado com sucesso! Agora você tem um sistema completo de CRUD seguindo os padrões do
projeto! ✨**
