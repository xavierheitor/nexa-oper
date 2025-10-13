# 🔍 DIAGNÓSTICO: Paginação e Filtros

**Data:** 2025-10-13 **Problema Reportado:** Paginação não funciona bem **Status:** 🔎 DIAGNOSTICADO

---

## 🐛 **PROBLEMA IDENTIFICADO**

### **Sintoma:**

Quando você aplica filtros (select de Cargo, Tipo Veículo, Base Atual, etc):

- ✅ A tabela MOSTRA apenas os registros filtrados
- ❌ O contador continua mostrando o total SEM filtro
- ❌ Exemplo: "Mostrando 1-3 de 100 itens" (mas só tem 3 que atendem o filtro)

### **Causa Raiz:**

Os filtros do Ant Design Table estão funcionando em **CLIENT-SIDE** (navegador), não em
**SERVER-SIDE** (backend).

```bash
FLUXO ATUAL:
1. Backend retorna 10 registros (página 1, pageSize 10)
2. Frontend recebe os 10 registros
3. Usuário aplica filtro "Cargo = Eletricista"
4. Ant Design filtra no navegador: 3 dos 10 atendem o filtro
5. Tabela mostra 3 registros
6. MAS contador ainda diz "1-10 de 100" (dados do backend)
```

---

## 🔍 **ANÁLISE TÉCNICA**

### **useEntityData.ts** - Linha 290-314

```typescript
const handleTableChange: TableProps<T>['onChange'] = (pagination, filters, sorter) => {
  // ...
  setParams((prev: PaginatedParams) => ({
    ...prev,
    page: pagination?.current || 1,
    pageSize: pagination?.pageSize || 10,
    orderBy: typeof field === 'string' ? field : prev.orderBy,
    orderDir: order === 'descend' ? 'desc' : 'asc',
    filters: filters, // ← PROBLEMA: apenas salva, mas não usa!
  }));
};
```

### **QueryBuilder.ts** - Linha 125-145

```typescript
static buildQueryParams(
  params: {
    page: number;
    pageSize: number;
    orderBy: string;
    orderDir: OrderDir;
    search?: string;  // ← Só processa search, não filters!
  },
  searchFields: string[],
  additionalWhere: Record<string, any> = {}
) {
  // NÃO PROCESSA params.filters! ❌
}
```

### **Resultado:**

Os filtros do Ant Design Table são **client-side only** na implementação atual.

---

## ✅ **ISSO É NORMAL?**

**SIM!** É o comportamento padrão do Ant Design Table:

- Filtros aplicam no client-side (dados já carregados)
- Backend não recebe informação dos filtros
- Serve para filtros rápidos em pequenos datasets

**QUANDO É PROBLEMA:**

- ❌ Datasets grandes (100+ registros)
- ❌ Quando filtro pode retornar registros em outras páginas
- ❌ UX confusa (contador errado)

**QUANDO FUNCIONA BEM:**

- ✅ Datasets pequenos (10-50 registros por página)
- ✅ Filtros rápidos sem necessidade de server-side
- ✅ Performance (sem requisição ao servidor a cada filtro)

---

## 🎯 **SOLUÇÕES POSSÍVEIS**

### **OPÇÃO 1: Manter Client-Side (Simples)** ⭐

**Esforço:** 0 horas (já funciona) **Vantagens:**

- ✅ Zero mudanças necessárias
- ✅ Filtros rápidos (sem latência de rede)
- ✅ Menos carga no servidor

**Desvantagens:**

- ❌ Contador de paginação impreciso quando filtrado
- ❌ Pode perder registros em outras páginas

**Recomendado para:** Datasets pequenos, filtros auxiliares

---

### **OPÇÃO 2: Converter para Server-Side (Complexa)** ⭐⭐⭐

**Esforço:** 1-2 dias **Vantagens:**

- ✅ Contador preciso
- ✅ Encontra todos os registros (todas as páginas)
- ✅ Performance melhor com datasets grandes

**Desvantagens:**

- ❌ Requisição ao servidor a cada mudança de filtro
- ❌ Latência perceptível
- ❌ Complexidade aumentada

**Mudanças necessárias:**

1. Processar `filters` no QueryBuilder
2. Converter estrutura de filtros do AntD para Prisma where
3. Atualizar todos os repositories para suportar filtros dinâmicos
4. Modificar types do PaginatedParams para incluir filters

**Exemplo de implementação:**

```typescript
// QueryBuilder.ts
static buildFiltersWhere(filters: Record<string, any>) {
  const where: any = {};

  Object.entries(filters).forEach(([field, values]) => {
    if (Array.isArray(values) && values.length > 0) {
      where[field] = { in: values };
    }
  });

  return where;
}
```

---

### **OPÇÃO 3: Híbrido - Server-Side para Campos Específicos** ⭐⭐⭐⭐

**Esforço:** 4-6 horas **Vantagens:**

- ✅ Performance ótima
- ✅ Contador preciso para filtros importantes
- ✅ Controle fino sobre quais filtros são server-side

**Como:**

1. Manter filtros de texto (`getTextFilter`) como client-side
2. Implementar filtros de relacionamento (Cargo, Base, etc) como parâmetros na action
3. Criar filtros customizados usando dropdowns externos à tabela

**Exemplo:**

```tsx
// Filtro externo (fora da tabela)
<Space style={{ marginBottom: 16 }}>
  <Select
    placeholder="Filtrar por Base"
    onChange={(baseId) => eletricistas.setParams(prev => ({ ...prev, baseId, page: 1 }))}
    options={bases.map(b => ({ label: b.nome, value: b.id }))}
    allowClear
  />
  <Select
    placeholder="Filtrar por Cargo"
    onChange={(cargoId) => eletricistas.setParams(prev => ({ ...prev, cargoId, page: 1 }))}
    options={cargos.map(c => ({ label: c.nome, value: c.id }))}
    allowClear
  />
</Space>

<Table ... />
```

---

## 🎯 **RECOMENDAÇÃO**

### **Para seu caso específico:**

**OPÇÃO 3 (Híbrido)** é a melhor escolha porque:

1. **Você já tem `baseId` e `cargoId` nos filtros dos repositories** ✅

   ```typescript
   // EletricistaRepository já suporta!
   interface EletricistaFilter extends PaginationParams {
     contratoId?: number;
     cargoId?: number;
     estado?: string;
     // Só falta adicionar: baseId?: number;
   }
   ```

2. **Mudanças mínimas necessárias:**
   - Adicionar `baseId` ao schema de filtro
   - Adicionar lógica de filtro no repository
   - Criar dropdowns externos (fora da tabela)

3. **Benefícios imediatos:**
   - Contador preciso
   - Performance ótima
   - UX melhorada

---

## 🚀 **IMPLEMENTAÇÃO RECOMENDADA (OPÇÃO 3)**

### **Passo 1: Atualizar Schema de Filtro**

```typescript
// eletricista/list.ts ou schema
export const eletricistaFilterSchema = z.object({
  page: z.number().default(1),
  pageSize: z.number().default(10),
  orderBy: z.string().default('id'),
  orderDir: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().optional(),
  contratoId: z.number().optional(),
  cargoId: z.number().optional(),
  baseId: z.number().optional(), // ← ADICIONAR
  estado: z.string().optional(),
  include: z.any().optional(),
});
```

### **Passo 2: Atualizar Repository**

```typescript
// EletricistaRepository.ts
interface EletricistaFilter extends PaginationParams {
  contratoId?: number;
  cargoId?: number;
  baseId?: number;  // ← ADICIONAR
  estado?: string;
}

// No método list ou findMany, adicionar lógica:
async list(params: EletricistaFilter) {
  const where = {
    deletedAt: null,
    ...(params.contratoId && { contratoId: params.contratoId }),
    ...(params.cargoId && { cargoId: params.cargoId }),
    ...(params.estado && { estado: params.estado }),
    // ← ADICIONAR filtro de base:
    ...(params.baseId && {
      eletricistaBaseHistorico: {
        some: {
          baseId: params.baseId,
          dataFim: null,  // Base atual
        },
      },
    }),
  };

  // ... rest of the code
}
```

### **Passo 3: UI com Filtros Externos**

```tsx
// eletricista/page.tsx
<Card>
  {/* Filtros externos - ANTES da tabela */}
  <Space style={{ marginBottom: 16 }}>
    <Select
      placeholder="Filtrar por Base"
      style={{ width: 200 }}
      onChange={(baseId) =>
        eletricistas.setParams(prev => ({ ...prev, baseId, page: 1 }))
      }
      options={[
        { label: 'Todas as bases', value: undefined },
        { label: 'Sem lotação', value: -1 },  // Valor especial
        ...bases.data?.map(b => ({ label: b.nome, value: b.id })) || []
      ]}
      allowClear
    />

    <Select
      placeholder="Filtrar por Cargo"
      style={{ width: 200 }}
      onChange={(cargoId) =>
        eletricistas.setParams(prev => ({ ...prev, cargoId, page: 1 }))
      }
      options={cargos.data?.map(c => ({ label: c.nome, value: c.id })) || []}
      allowClear
    />
  </Space>

  <Table ... />  {/* Remover os filtros inline da tabela */}
</Card>
```

---

## 🎬 **PRÓXIMAS AÇÕES**

Qual solução você prefere?

### **A) Manter como está (client-side)**

- Esforço: 0h
- Funciona bem para datasets pequenos
- Apenas adicionar nota na UI

### **B) Implementar server-side completo (OPÇÃO 2)**

- Esforço: 1-2 dias
- Processa todos os filtros do AntD Table no backend
- Requer refatoração significativa

### **C) Implementar híbrido (OPÇÃO 3) - RECOMENDADO** ⭐

- Esforço: 4-6 horas
- Filtros externos (dropdowns) para campos relacionados
- Mantém filtros de texto inline como client-side
- Melhor UX e performance

---

**Me diga qual opção você prefere e eu implemento!**

Ou se quiser, posso explicar melhor o comportamento atual para você decidir.
