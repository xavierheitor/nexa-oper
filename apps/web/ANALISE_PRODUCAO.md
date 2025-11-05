# 🔍 Análise Completa para Produção - Projeto Web

**Data:** 2025-01-27 **Status:** Análise Completa **Objetivo:** Garantir código seguro,
performático, manutenível e pronto para produção

---

## ✅ PONTOS FORTES JÁ IMPLEMENTADOS

### 1. **Segurança** ✅

- ✅ **Validação de entrada**: Zod em todas as Server Actions via `handleServerAction`
- ✅ **Autenticação obrigatória**: Todas as actions protegidas por sessão
- ✅ **SQL Injection**: Prisma previne automaticamente (prepared statements)
- ✅ **Senhas protegidas**: Removidas dos resultados (UserRepository, MobileUserRepository)
- ✅ **Error handling padronizado**: `errorHandler` centralizado
- ✅ **Logging estruturado**: Contexto completo para auditoria

### 2. **Arquitetura** ✅

- ✅ **Padrão Repository**: Separação de responsabilidades
- ✅ **Service Layer**: Lógica de negócio isolada
- ✅ **Action Handler centralizado**: Reduz boilerplate
- ✅ **Type Safety**: TypeScript em todo o projeto
- ✅ **Error Handling**: Centralizado e padronizado

### 3. **Performance Parcial** ✅

- ✅ **Promise.all**: Usado para queries paralelas
- ✅ **Select específico**: Campos necessários apenas
- ✅ **Paginação**: Implementada na maioria dos casos
- ✅ **Soft Delete**: Filtro automático em repositories

---

## 🔴 CRÍTICO - CORRIGIR ANTES DE PRODUÇÃO

### 1. **Problema N+1 Query** 🔴 **ALTA PRIORIDADE**

#### Problema 1: `checklist/getByTurno.ts`

**Situação Atual:**

```typescript
// ❌ PROBLEMA: Loop aninhado com queries dentro
const checklistsComFotos = await Promise.all(
  checklistsPreenchidos.map(async checklist => {
    const respostasComFotos = await Promise.all(
      checklist.ChecklistResposta.map(async resposta => {
        // Query dentro de loop aninhado
        const fotosDaResposta = await prisma.mobilePhoto.findMany({
          where: {
            turnoId: data.turnoId,
            checklistUuid: checklist.uuid,
            checklistPerguntaId: resposta.perguntaId,
            // ...
          },
        });
      })
    );
  })
);
```

**Impacto:**

- Se há 10 checklists com 5 respostas cada = 50 queries individuais
- Performance degrada exponencialmente com volume

**Solução:**

```typescript
// ✅ SOLUÇÃO: Buscar todas as fotos de uma vez e agrupar em memória
// 1. Buscar todas as fotos do turno de uma vez
const todasFotos = await prisma.mobilePhoto.findMany({
  where: {
    turnoId: data.turnoId,
    tipo: { in: ['checklistReprova', 'assinatura'] },
    deletedAt: null,
  },
});

// 2. Agrupar por checklistUuid + perguntaId
const fotosPorResposta = todasFotos.reduce(
  (acc, foto) => {
    const key = `${foto.checklistUuid}-${foto.checklistPerguntaId}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(foto);
    return acc;
  },
  {} as Record<string, typeof todasFotos>
);

// 3. Mapear resultados usando o mapa
const respostasComFotos = checklist.ChecklistResposta.map(resposta => {
  const key = `${checklist.uuid}-${resposta.perguntaId}`;
  const fotos = fotosPorResposta[key] || [];
  // ... formatação
});
```

#### Problema 2: `escala/visualizacaoGeral.ts`

**Situação Atual:**

```typescript
// ❌ PROBLEMA: Query dentro de loop
const escalasComBase = await Promise.all(
  escalas.map(async (escala) => {
    const baseHistorico = await prisma.equipeBaseHistorico.findFirst({
      where: { equipeId: escala.equipe.id, dataFim: null },
    });
    // Outra query dentro do mesmo loop
    const temHorario = await prisma.equipeTurnoHistorico.findFirst({
      where: { equipeId: escala.equipe.id, ... },
    });
  })
);
```

**Impacto:**

- Se há 100 escalas = 200 queries individuais
- Performance muito ruim em escala

**Solução:**

```typescript
// ✅ SOLUÇÃO: Buscar todas as bases e horários de uma vez
const equipeIds = escalas.map(e => e.equipe.id);

// Buscar todas as bases de uma vez
const [todasBases, todosHorarios] = await Promise.all([
  prisma.equipeBaseHistorico.findMany({
    where: {
      equipeId: { in: equipeIds },
      dataFim: null,
      deletedAt: null,
    },
    include: { base: { select: { id: true, nome: true } } },
  }),
  prisma.equipeTurnoHistorico.findMany({
    where: {
      equipeId: { in: equipeIds },
      deletedAt: null,
      // ... filtros de vigência
    },
  }),
]);

// Agrupar por equipeId
const basePorEquipe = new Map(todasBases.map(b => [b.equipeId, b]));
const horarioPorEquipe = new Map(todosHorarios.map(h => [h.equipeId, h]));

// Mapear resultados
const escalasComBase = escalas.map(escala => ({
  ...escala,
  baseAtual: basePorEquipe.get(escala.equipe.id)?.base,
  temHorario: !!horarioPorEquipe.get(escala.equipe.id),
}));
```

---

## 🟡 IMPORTANTE - MELHORAR PARA PRODUÇÃO

### 2. **Limites Hardcoded** 🟡

**Problema:**

```typescript
// ❌ PROBLEMA: Limites hardcoded sem validação
const resultBases = await listBases({
  page: 1,
  pageSize: 100, // E se tiver mais de 100 bases?
  orderBy: 'nome',
  orderDir: 'asc',
});
```

**Arquivos Afetados:**

- `getStatsByTipoEquipe.ts` - `pageSize: 100`
- `getStatsByBase.ts` - `pageSize: 100`
- `getStatsByHoraETipoEquipe.ts` - `pageSize: 100`

**Solução:**

```typescript
// ✅ SOLUÇÃO: Validação de limites e fallback
const MAX_STATS_ITEMS = 500; // Limite máximo configurável

const resultBases = await listBases({
  page: 1,
  pageSize: MAX_STATS_ITEMS,
  orderBy: 'nome',
  orderDir: 'asc',
});

if (resultBases.data?.meta.total > MAX_STATS_ITEMS) {
  logger.warn('Limite de items atingido nas estatísticas', {
    total: resultBases.data.meta.total,
    limite: MAX_STATS_ITEMS,
  });
}
```

### 3. **Repetição de Código (DRY)** 🟡

#### Problema 1: Formatação de Fotos Duplicada

**Arquivos:**

- `checklist/getByTurno.ts` - função `getChecklistsByTurno`
- `checklist/getByTurno.ts` - função `getChecklistByUuid`

**Solução:**

```typescript
// ✅ CRIAR: Utilitário compartilhado
// apps/web/src/lib/utils/checklistPhotoFormatter.ts

export function formatChecklistPhoto(foto: MobilePhoto) {
  return {
    id: foto.id,
    caminhoArquivo: foto.storagePath,
    urlPublica: foto.url,
    tamanhoBytes: Number(foto.fileSize),
    mimeType: foto.mimeType,
    sincronizadoEm: foto.capturedAt?.toISOString() || foto.createdAt.toISOString(),
    createdAt: foto.createdAt.toISOString(),
  };
}

export function formatChecklistPhotos(fotos: MobilePhoto[]) {
  return fotos.map(formatChecklistPhoto);
}
```

#### Problema 2: Criação de Datas do Dia Repetida

**Arquivos:**

- `getStatsByTipoEquipe.ts`
- `getStatsByBase.ts`
- `getStatsByHora.ts`
- `getStatsByHoraETipoEquipe.ts`

**Solução:**

```typescript
// ✅ CRIAR: Utilitário de datas
// apps/web/src/lib/utils/dateHelpers.ts

export function getTodayDateRange(): { inicio: Date; fim: Date } {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0);
  const fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);
  return { inicio, fim };
}
```

---

## 🟢 OPCIONAL - OTIMIZAÇÕES FUTURAS

### 4. **Cache de Queries Estáticas** 🟢

**Oportunidade:**

- Tipos de equipe, bases, contratos são dados relativamente estáticos
- Podem ser cacheados por alguns minutos

**Solução:**

```typescript
// ✅ IMPLEMENTAR: Cache simples com TTL
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minutos

export async function getTiposEquipeCached() {
  const cacheKey = 'tiposEquipe';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const result = await listTiposEquipe({ page: 1, pageSize: 100 });
  cache.set(cacheKey, result);
  return result;
}
```

### 5. **Batch Processing para Grandes Volumes** 🟢

**Oportunidade:**

- Relatórios podem processar muitos dados
- Implementar processamento em lotes

**Solução:**

```typescript
// ✅ IMPLEMENTAR: Processamento em lotes
async function processBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);
  }
  return results;
}
```

### 6. **Validação de Rate Limiting** 🟢

**Recomendação:**

- Implementar rate limiting para endpoints críticos
- Prevenir abuso de APIs

**Solução:**

```typescript
// ✅ IMPLEMENTAR: Rate limiting via middleware
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requisições por IP
});
```

---

## 📋 CHECKLIST DE PRODUÇÃO

### Segurança

- [x] Validação de entrada (Zod)
- [x] Autenticação obrigatória
- [x] Proteção contra SQL Injection (Prisma)
- [x] Senhas não expostas
- [x] Error handling padronizado
- [ ] Rate limiting (opcional)
- [ ] CORS configurado corretamente
- [ ] Headers de segurança (helmet)

### Performance

- [ ] N+1 queries corrigidas ⚠️ **CRÍTICO**
- [x] Paginação implementada
- [x] Select específico de campos
- [ ] Cache de queries estáticas (opcional)
- [ ] Índices de banco verificados
- [ ] Compressão de respostas (gzip)

### Manutenibilidade

- [ ] Código duplicado removido (DRY) ⚠️ **IMPORTANTE**
- [x] Padrões consistentes
- [x] Documentação adequada
- [x] Type safety completo
- [ ] Testes unitários (recomendado)

### Monitoramento

- [x] Logging estruturado
- [x] Error tracking centralizado
- [ ] Métricas de performance
- [ ] Alertas configurados

---

## 🎯 PRIORIZAÇÃO DE CORREÇÕES

### Sprint 1 (Crítico - Antes de Produção)

1. ✅ Corrigir N+1 queries em `checklist/getByTurno.ts`
2. ✅ Corrigir N+1 queries em `escala/visualizacaoGeral.ts`
3. ✅ Adicionar validação de limites hardcoded

### Sprint 2 (Importante - Melhorias)

1. ✅ Extrair lógica de formatação de fotos (DRY)
2. ✅ Extrair lógica de datas (DRY)
3. ✅ Adicionar constantes para limites

### Sprint 3 (Opcional - Otimizações)

1. Implementar cache de queries estáticas
2. Adicionar rate limiting
3. Implementar batch processing

---

## 📊 MÉTRICAS DE QUALIDADE

### Antes das Correções

- **N+1 Queries**: 2 arquivos críticos
- **Código Duplicado**: ~50 linhas
- **Limites Hardcoded**: 3 arquivos
- **Performance**: ⚠️ Degrada com volume

### Após Correções Propostas

- **N+1 Queries**: 0 arquivos ✅
- **Código Duplicado**: ~10 linhas (redução 80%) ✅
- **Limites Hardcoded**: 0 arquivos ✅
- **Performance**: ✅ Escalável

---

## 🚀 CONCLUSÃO

**Status Geral:** 🟡 **Bom, mas precisa de ajustes críticos**

### Pontos Fortes:

- ✅ Segurança bem implementada
- ✅ Arquitetura sólida
- ✅ Padrões consistentes
- ✅ Error handling robusto

### Ajustes Necessários:

- 🔴 **CRÍTICO**: Corrigir N+1 queries (2 arquivos)
- 🟡 **IMPORTANTE**: Reduzir duplicação de código
- 🟡 **IMPORTANTE**: Validar limites hardcoded

**Estimativa de Tempo:** 4-6 horas para correções críticas e importantes

**Risco de Produção:** 🟡 **Médio** - Funciona, mas pode ter problemas de performance com volume
alto
