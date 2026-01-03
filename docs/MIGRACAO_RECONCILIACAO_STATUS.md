# Status da Migração de Reconciliação

## ✅ CONCLUÍDO

### 1. Modelo Prisma JobLock

- ✅ Criado `packages/db/prisma/models/job-lock.prisma`
- ⚠️ **PENDENTE**: Executar migration (`npm run migrate:dev` no diretório `packages/db`)

### 2. Utilitário de Lock

- ✅ Criado `apps/api/src/common/utils/job-lock.ts`
- ✅ Implementado `acquireLock`, `releaseLock`, `isLocked`

### 3. Módulo Internal-Reconciliacao (API)

- ✅ DTOs criados:
  - `force-reconcile.dto.ts`
  - `reconcile-response.dto.ts`
- ✅ Guard criado: `internal-key.guard.ts`
- ✅ Controller criado: `internal-reconciliacao.controller.ts`
- ✅ Service criado: `internal-reconciliacao.service.ts` (estrutura básica)
- ✅ Scheduler criado: `reconciliacao.scheduler.ts`
- ✅ Module criado e registrado no `AppModule`
- ✅ Variáveis de ambiente adicionadas ao schema de validação

### 4. Server Action (WEB)

- ✅ Criado `apps/web/src/lib/actions/admin/forcarReconciliacaoTurnos.ts`

### 5. Desativação do Cron (WEB)

- ✅ Cron de reconciliação desativado em `scheduler.service.ts`

## ⚠️ PENDENTE

### 1. Migration do Prisma

```bash
cd packages/db
npm run migrate:dev
```

### 2. Lógica Completa de Reconciliação

A lógica completa precisa ser portada de:

- `apps/web/src/lib/actions/turno/reconciliarDiaEquipe.ts` (634 linhas)

Para:

- `apps/api/src/modules/internal-reconciliacao/internal-reconciliacao.service.ts`

**Método a completar**: `reconciliarDiaEquipe()` - atualmente apenas retorna estrutura vazia.

**Lógica a portar**:

- Buscar slots da escala
- Buscar turnos realizados
- Processar casos: TRABALHO+ABRIU, TRABALHO+NÃO_ABRIU, FOLGA+ABRIU, etc.
- Criar faltas, divergências, horas extras
- Processar atrasos
- Funções auxiliares: `processarAtraso`, `calcularHorasPrevistas`, `calcularHorasTrabalhadas`

### 3. UI no WEB

Criar página/seção admin para testar reconciliação:

- Campos: dataReferencia, equipeId, intervaloDias, dryRun
- Botão para executar
- Exibir resultado (stats, warnings, etc.)

**Sugestão de localização**: `apps/web/src/app/dashboard/turnos/reconciliacao-test/page.tsx`

### 4. Variáveis de Ambiente

Adicionar ao `.env` da API:

```env
INTERNAL_KEY=sua-chave-secreta-aqui-minimo-16-caracteres
RECONCILE_CRON=0 23 * * *
RECONCILE_LOCK_TTL_MS=900000
RECONCILIACAO_DIAS_HISTORICO=30
```

Adicionar ao `.env` do WEB:

```env
API_PORT=3001
INTERNAL_KEY=sua-chave-secreta-aqui-minimo-16-caracteres
```

## 📋 TESTES

### 1. Teste de Lock

```bash
# Terminal 1
curl -X POST http://localhost:3001/api/internal/reconciliacao/turnos \
  -H "Content-Type: application/json" \
  -H "X-Internal-Key: sua-chave" \
  -d '{"dryRun": true}'

# Terminal 2 (simultaneamente)
curl -X POST http://localhost:3001/api/internal/reconciliacao/turnos \
  -H "Content-Type: application/json" \
  -H "X-Internal-Key: sua-chave" \
  -d '{"dryRun": true}'

# Esperado: Uma execução OK, outra retorna 409 (Conflict)
```

### 2. Teste Manual via API

```bash
curl -X POST http://localhost:3001/api/internal/reconciliacao/turnos \
  -H "Content-Type: application/json" \
  -H "X-Internal-Key: sua-chave" \
  -d '{
    "dataReferencia": "2024-01-15",
    "equipeId": 1,
    "intervaloDias": 1,
    "dryRun": true
  }'
```

### 3. Teste via UI (após criar UI)

- Acessar página de teste
- Preencher campos
- Executar e verificar resultado

## 🔧 PRÓXIMOS PASSOS

1. **CRÍTICO**: Portar lógica completa de reconciliação do WEB para API
2. Criar UI de teste no WEB (opcional - pode testar via curl primeiro)
3. Configurar variáveis de ambiente
4. Testar end-to-end

## 📝 NOTAS

- O scheduler da API já está configurado para rodar às 23h (configurável via `RECONCILE_CRON`)
- O lock garante execução única mesmo com múltiplas instâncias PM2
- O endpoint interno é protegido por `InternalKeyGuard`
- O WEB chama a API via Server Action (server-side, sem CORS)
