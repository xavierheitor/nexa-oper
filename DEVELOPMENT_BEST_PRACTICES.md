# 🏆 Melhores Práticas de Desenvolvimento - Nexa Oper

## 📋 Visão Geral

Este documento contém as melhores práticas, padrões de código e diretrizes para desenvolvimento no
projeto Nexa Oper, garantindo consistência, qualidade e manutenibilidade.

## 🎯 Princípios Fundamentais

### **1. Clean Architecture**

- **Separação de responsabilidades** entre camadas
- **Inversão de dependência** com container de serviços
- **Abstração** de complexidade através de interfaces
- **Testabilidade** com injeção de dependência

### **2. DRY (Don't Repeat Yourself)**

- **Reutilização de código** através de abstrações
- **Componentes genéricos** para funcionalidades comuns
- **Hooks customizados** para lógica compartilhada
- **Utilitários centralizados**

### **3. SOLID Principles**

- **Single Responsibility**: Cada classe/função tem uma responsabilidade
- **Open/Closed**: Aberto para extensão, fechado para modificação
- **Liskov Substitution**: Subclasses devem ser substituíveis
- **Interface Segregation**: Interfaces específicas e focadas
- **Dependency Inversion**: Dependa de abstrações, não implementações

## 🏗️ Padrões de Arquitetura

### **Repository Pattern**

#### ✅ **Boas Práticas**

```typescript
// ✅ BOM: Repository focado em acesso a dados
export class VeiculoRepository extends AbstractCrudRepository<Veiculo, VeiculoFilter> {
  // Métodos específicos de acesso a dados
  async findByPlaca(placa: string): Promise<Veiculo | null> {
    return prisma.veiculo.findFirst({
      where: { placa, deletedAt: null },
    });
  }

  // Conversão de dados para Prisma
  private toPrismaData(data: VeiculoInput): Prisma.VeiculoCreateInput {
    return {
      placa: data.placa,
      tipoVeiculo: { connect: { id: data.tipoVeiculoId } },
    };
  }
}
```

#### ❌ **Evitar**

```typescript
// ❌ RUIM: Lógica de negócio no repository
export class VeiculoRepository {
  async create(data: VeiculoInput): Promise<Veiculo> {
    // ❌ Validação deveria estar no Service
    if (!data.placa.match(/^[A-Z]{3}[0-9]{4}$/)) {
      throw new Error('Placa inválida');
    }

    // ❌ Regra de negócio deveria estar no Service
    if (await this.existsPlaca(data.placa)) {
      throw new Error('Placa já existe');
    }

    return prisma.veiculo.create({ data });
  }
}
```

### **Service Pattern**

### ✅ ***Boas Práticas**

```typescript
// ✅ BOM: Service com lógica de negócio
export class VeiculoService extends AbstractCrudService<...> {
  async create(raw: unknown, userId: string): Promise<Veiculo> {
    // 1. Validação de entrada
    const data = veiculoCreateSchema.parse(raw);

    // 2. Regras de negócio
    await this.validatePlacaUnica(data.placa);
    await this.validateTipoVeiculoExists(data.tipoVeiculoId);

    // 3. Transformação de dados
    const createData = this.transformToCreateData(data);

    // 4. Auditoria
    createData.createdBy = userId;
    createData.createdAt = new Date();

    // 5. Persistência através do repository
    return this.repo.create(createData);
  }

  private async validatePlacaUnica(placa: string): Promise<void> {
    const existing = await this.veiculoRepo.findByPlaca(placa);
    if (existing) {
      throw new Error('Placa já está em uso');
    }
  }
}
```

### **Server Actions Pattern**

#### ✅ **Estrutura Padrão**

```typescript
/**
 * Documentação JSDoc completa
 */
'use server';

import { handleServerAction } from '../common/actionHandler';
import { schema } from '../../schemas/entitySchema';
import type { EntityService } from '@/lib/services/EntityService';
import { container } from '@/lib/services/common/registerServices';

/**
 * JSDoc da função
 */
export const actionName = async (rawData: unknown) =>
  handleServerAction(
    schema, // 1. Schema de validação
    async (data, session) => {
      // 2. Lógica da action
      const service = container.get<EntityService>('entityService');
      return service.method(data, session.user.id);
    },
    rawData, // 3. Dados brutos
    { entityName: 'Entity', actionType: 'action' } // 4. Metadados
  );
```

## 📝 Padrões de Código

### **Nomenclatura**

#### **Arquivos e Diretórios**

```bash
✅ BOM:
- PascalCase para componentes: `VeiculoForm.tsx`
- camelCase para utilitários: `queryBuilder.ts`
- kebab-case para rotas: `tipo-veiculo/`
- UPPER_CASE para constantes: `API_ENDPOINTS.ts`

❌ EVITAR:
- Mistura de padrões: `veiculo-Form.tsx`
- Nomes genéricos: `utils.ts`, `helpers.ts`
- Abreviações: `VeicForm.tsx`
```

#### **Variáveis e Funções**

```typescript
// ✅ BOM: Nomes descritivos
const veiculosAtivos = await service.findByStatus('ativo');
const handleVeiculoSubmit = (data: VeiculoFormData) => { ... };

// ❌ RUIM: Nomes genéricos
const data = await service.find('ativo');
const handleSubmit = (d: any) => { ... };
```

### **Tipos TypeScript**

#### ✅ ***Boas Práticas***

```typescript
// ✅ Interfaces para contratos
interface VeiculoRepository {
  findByPlaca(placa: string): Promise<Veiculo | null>;
}

// ✅ Types para união/interseção
type VeiculoStatus = 'ativo' | 'inativo' | 'manutencao';
type VeiculoWithTipo = Veiculo & { tipoVeiculo: TipoVeiculo };

// ✅ Generics para reutilização
interface Repository<T, F> {
  list(filter: F): Promise<T[]>;
  findById(id: number): Promise<T | null>;
}

// ✅ Utility types
type VeiculoCreate = Omit<Veiculo, 'id' | 'createdAt' | 'updatedAt'>;
type VeiculoUpdate = Partial<VeiculoCreate> & { id: number };
```

#### ❌ **Evitar***

```typescript
// ❌ any em produção
const processData = (data: any): any => { ... };

// ❌ Tipos muito genéricos
interface Data {
  value: any;
}

// ❌ Interfaces vazias
interface EmptyInterface {}
```

### **Validação com Zod**

#### ✅ **Estrutura Padrão***

```typescript
// ✅ Schemas bem estruturados
export const veiculoCreateSchema = z.object({
  placa: z
    .string()
    .min(1, 'Placa é obrigatória')
    .max(8, 'Placa deve ter no máximo 8 caracteres')
    .regex(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/, 'Formato de placa inválido'),

  modelo: z
    .string()
    .min(1, 'Modelo é obrigatório')
    .max(255, 'Modelo deve ter no máximo 255 caracteres'),

  ano: z
    .number()
    .int('Ano deve ser um número inteiro')
    .min(1900, 'Ano deve ser maior que 1900')
    .max(new Date().getFullYear() + 1, 'Ano não pode ser futuro'),

  tipoVeiculoId: z.number().int().positive('Tipo de veículo é obrigatório'),
});

// ✅ Reutilização de schemas
export const veiculoUpdateSchema = veiculoCreateSchema.extend({
  id: z.number().int().positive(),
});

export const veiculoFilterSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(10),
  orderBy: z.string().default('id'),
  orderDir: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().optional(),
  include: z.any().optional(),
});
```

### **Componentes React**

#### ✅ ***Estrutura Padrão***

```typescript
'use client';

// 1. Imports externos
import { Button, Form, Input } from 'antd';
import { useEffect, useState } from 'react';

// 2. Imports internos
import { createVeiculo } from '@/lib/actions/veiculo/create';
import { VeiculoFormData } from '@/lib/types/veiculo';

// 3. Tipos e interfaces
interface VeiculoFormProps {
  onSubmit: (values: VeiculoFormData) => void;
  initialValues?: Partial<VeiculoFormData>;
  loading?: boolean;
}

// 4. Constantes
const FORM_LAYOUT = {
  labelCol: { span: 6 },
  wrapperCol: { span: 18 },
};

// 5. Componente principal
export default function VeiculoForm({
  onSubmit,
  initialValues,
  loading = false,
}: VeiculoFormProps) {
  // 6. Hooks
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 7. Effects
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  // 8. Handlers
  const handleSubmit = async (values: VeiculoFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 9. Early returns
  if (loading) return <div>Carregando...</div>;

  // 10. Render principal
  return (
    <Form
      form={form}
      {...FORM_LAYOUT}
      onFinish={handleSubmit}
    >
      {/* Campos do formulário */}
    </Form>
  );
}
```

## 🔍 Qualidade de Código

### **ESLint Rules**

```javascript
// eslint.config.js
module.exports = {
  rules: {
    // TypeScript
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/prefer-const': 'error',

    // React
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Imports
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
      },
    ],

    // Código
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
  },
};
```

### **Prettier Config**

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

## 🧪 Testes

### **Estrutura de Testes**

```typescript
// ✅ Testes bem estruturados
describe('VeiculoService', () => {
  let service: VeiculoService;
  let mockRepository: jest.Mocked<VeiculoRepository>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    service = new VeiculoService(mockRepository);
  });

  describe('create', () => {
    it('should create veiculo with valid data', async () => {
      // Arrange
      const validData = {
        placa: 'ABC1234',
        modelo: 'Civic',
        ano: 2023,
        tipoVeiculoId: 1,
      };
      const expectedVeiculo = { id: 1, ...validData };
      mockRepository.create.mockResolvedValue(expectedVeiculo);

      // Act
      const result = await service.create(validData, 'user123');

      // Assert
      expect(result).toEqual(expectedVeiculo);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...validData,
          createdBy: 'user123',
        })
      );
    });

    it('should throw error for invalid placa', async () => {
      // Arrange
      const invalidData = { placa: 'INVALID' };

      // Act & Assert
      await expect(service.create(invalidData, 'user123')).rejects.toThrow(
        'Formato de placa inválido'
      );
    });
  });
});
```

## 📊 Performance

### **Otimizações de Banco**

```typescript
// ✅ Queries otimizadas
async findWithRelations(filters: VeiculoFilter) {
  return prisma.veiculo.findMany({
    where: this.buildWhereClause(filters),
    include: {
      tipoVeiculo: true,
      contrato: {
        select: { nome: true, numero: true } // ✅ Select específico
      }
    },
    orderBy: { [filters.orderBy]: filters.orderDir },
    skip: (filters.page - 1) * filters.pageSize,
    take: filters.pageSize,
  });
}

// ❌ EVITAR: N+1 queries
async findAll() {
  const veiculos = await prisma.veiculo.findMany();

  // ❌ Loop com queries individuais
  for (const veiculo of veiculos) {
    veiculo.tipoVeiculo = await prisma.tipoVeiculo.findUnique({
      where: { id: veiculo.tipoVeiculoId }
    });
  }

  return veiculos;
}
```

### **React Performance**

```typescript
// ✅ Memoização adequada
const VeiculoList = memo(({ veiculos, onEdit, onDelete }: Props) => {
  const columns = useMemo(() => [
    // configuração das colunas
  ], [onEdit, onDelete]);

  const handleTableChange = useCallback((pagination, filters, sorter) => {
    // lógica de mudança
  }, []);

  return (
    <Table
      columns={columns}
      dataSource={veiculos}
      onChange={handleTableChange}
    />
  );
});

// ✅ Custom hooks para lógica complexa
const useVeiculoData = (filters: VeiculoFilter) => {
  return useSWR(
    ['veiculos', filters],
    () => listVeiculos(filters),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );
};
```

## 🔒 Segurança

### **Validação de Entrada**

```typescript
// ✅ Sempre validar dados de entrada
export const createVeiculo = async (rawData: unknown) =>
  handleServerAction(
    veiculoCreateSchema, // ✅ Validação obrigatória
    async (data, session) => {
      // ✅ Verificar autenticação
      if (!session?.user?.id) {
        throw new Error('Usuário não autenticado');
      }

      // ✅ Verificar permissões
      await checkPermission(session.user.id, 'veiculo:create');

      const service = container.get<VeiculoService>('veiculoService');
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'Veiculo', actionType: 'create' }
  );
```

### **Auditoria**

```typescript
// ✅ Sempre incluir campos de auditoria
const auditableData = {
  ...validatedData,
  createdBy: session.user.id,
  createdAt: new Date(),
  updatedBy: session.user.id,
  updatedAt: new Date(),
};
```

## 📚 Documentação

### **JSDoc Padrão**

````typescript
/**
 * Título da função/classe
 *
 * Descrição detalhada do que faz, como funciona,
 * e quando deve ser usado.
 *
 * FUNCIONALIDADES:
 * - Lista de funcionalidades principais
 * - Recursos específicos
 * - Comportamentos especiais
 *
 * @param param1 - Descrição do parâmetro
 * @param param2 - Descrição do parâmetro
 * @returns Descrição do retorno
 * @throws Error - Quando pode lançar erro
 *
 * @example
 * ```typescript
 * // Exemplo de uso
 * const result = await myFunction(param1, param2);
 * ```
 */
````

### **README por Módulo**

Cada módulo complexo deve ter seu próprio README:

```markdown
# Módulo Veículo

## Visão Geral

Descrição do módulo

## Estrutura

- Repository: Acesso a dados
- Service: Lógica de negócio
- Actions: Server Actions
- Components: Interface

## Como Usar

Exemplos práticos

## Regras de Negócio

- Regra 1
- Regra 2

## APIs

Lista de endpoints/actions disponíveis
```

## 🚀 Deploy e Produção

### **Variáveis de Ambiente**

```bash
# .env.production
NODE_ENV=production
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="secure-secret"
LOG_LEVEL=error
```

### **Build Otimizado**

```bash
# Build com análise
npm run build
npm run analyze

# Verificação de tipos
npm run type-check

# Testes antes do deploy
npm run test
npm run e2e
```

## 📋 Checklist de Qualidade

### **Antes de Commitar**

- [ ] ESLint sem erros
- [ ] TypeScript sem erros
- [ ] Testes passando
- [ ] Documentação atualizada
- [ ] Performance verificada

### **Antes de Deploy**

- [ ] Build de produção funcionando
- [ ] Variáveis de ambiente configuradas
- [ ] Migrações de banco executadas
- [ ] Testes E2E passando
- [ ] Monitoramento configurado

---

***🏆 Seguindo essas práticas, você garante código de alta qualidade, manutenível e escalável! ✨**
