# Proposta: Reorganização de pastas da API

> **Implementado.** A estrutura descrita abaixo foi aplicada; `core/`, `internal/` e os path aliases `@core/*`, `@internal/*` estão em uso.

## Contexto

Hoje `modules/` mistura:

- **Módulos de domínio** (veículo, checklist, turno, equipe, apr, etc.): CRUD, sync, regras de negócio, estrutura controllers/services/dto.
- **Infraestrutura transversal** (`engine`): auth, contracts, mobile-users — usados por todos os domínios.
- **Processos internos** (`internal-reconciliacao`): jobs, reconciliação, API interna com guard próprio.
- **Suporte / observabilidade** (`web-logs`): logging do web, sem regra de negócio de domínio.

Separar isso deixa a API mais clara e alinhada a boas práticas (domínio vs core vs internal).

---

## Estrutura proposta

```bash
apps/api/src/
├── common/              # (existente) Utilitários, constantes, filters, interceptors
├── config/              # (existente)
├── database/            # (existente)
├── health/              # (existente)
├── metrics/             # (existente)
│
├── core/                # NOVO – Infraestrutura transversal (ex-engine + web-logs)
│   ├── auth/            # ex modules/engine/auth
│   │   ├── auth.module.ts
│   │   ├── controllers/
│   │   ├── decorators/
│   │   ├── dto/
│   │   ├── guards/
│   │   ├── services/
│   │   ├── strategies/
│   │   └── utils/
│   ├── contracts/       # ex modules/engine/contracts
│   │   ├── contracts.module.ts
│   │   └── controllers/
│   ├── mobile-users/    # ex modules/engine/mobile-users
│   │   ├── mobile-users.module.ts
│   │   └── services/
│   └── web-logs/        # ex modules/web-logs
│       ├── web-logs.module.ts
│       ├── web-logs.controller.ts
│       ├── web-logs.service.ts
│       └── dto/
│
├── internal/            # NOVO – Processos internos / sistema (não domínio)
│   └── reconciliacao/   # ex modules/internal-reconciliacao
│       ├── internal-reconciliacao.module.ts
│       ├── internal-reconciliacao.controller.ts
│       ├── internal-reconciliacao.service.ts
│       ├── reconciliacao-db.ts
│       ├── reconciliacao-processor.ts
│       ├── reconciliacao.scheduler.ts
│       ├── reconciliacao.utils.ts
│       ├── guards/
│       ├── dto/
│       └── types.ts
│
└── modules/             # APENAS domínio/negócio (estrutura controller/service/dto)
    ├── apr/
    ├── atividade/
    ├── checklist/
    ├── eletricista/
    ├── equipe/
    ├── mobile-upload/
    ├── turno/
    ├── turno-realizado/
    └── veiculo/
```

---

## Path aliases (tsconfig)

Adicionar em `apps/api/tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@app/*": ["src/*"],
      "@common/*": ["src/common/*"],
      "@core/*": ["src/core/*"],
      "@internal/*": ["src/internal/*"],
      "@modules/*": ["src/modules/*"],
      "@database/*": ["src/database/*"]
    }
  }
}
```

---

## Mapeamento de imports

| De (atual) | Para (novo) |
|------------|-------------|
| `@modules/engine/auth/*` | `@core/auth/*` |
| `@modules/engine/contracts/*` | `@core/contracts/*` |
| `@modules/engine/mobile-users/*` | `@core/mobile-users/*` |
| `@modules/web-logs/*` | `@core/web-logs/*` |
| `@modules/internal-reconciliacao/*` | `@internal/reconciliacao/*` |

---

## Alterações no `app.module.ts`

**Antes:**

```ts
import { AuthModule } from '@modules/engine/auth/auth.module';
import { ContractsModule } from '@modules/engine/contracts/contracts.module';
import { InternalReconciliacaoModule } from './modules/internal-reconciliacao/internal-reconciliacao.module';
import { WebLogsModule } from './modules/web-logs/web-logs.module';
```

**Depois:**

```ts
import { AuthModule } from '@core/auth/auth.module';
import { ContractsModule } from '@core/contracts/contracts.module';
import { InternalReconciliacaoModule } from '@internal/reconciliacao/internal-reconciliacao.module';
import { WebLogsModule } from '@core/web-logs/web-logs.module';
```

---

## Ajustes internos (módulos que se movem)

1. **AuthModule**
   - Trocar `../mobile-users/mobile-users.module` por `@core/mobile-users/mobile-users.module` (ou `../mobile-users/mobile-users.module` se ambos estiverem em `core/`).

2. **ContractsModule**
   - Trocar `../auth/auth.module` por `@core/auth/auth.module` (ou `../auth/auth.module` dentro de `core/`).

3. **InternalReconciliacaoModule**
   - Manter `DatabaseModule` via `@database/database.module` (recomendado) ou `../../../database/database.module` se quiser path relativo.

4. **Arquivos em `internal/reconciliacao/`**
   - Atualizar imports relativos entre si (ex. `./internal-reconciliacao.service`) – caminhos relativos continuam válidos.

---

## Escopo de atualização de imports

- **`@modules/engine/*`**
  - `app.module`, todos os módulos de domínio que importam auth/contracts/contract-helpers/guards/decorators (veiculo, equipe, eletricista, checklist, apr, atividade, turno, mobile-upload).

- **`@modules/internal-reconciliacao`**
  - `app.module` (e qualquer outro que importe o módulo ou o service, se existir).

- **`@modules/web-logs`**
  - `app.module`.

Nenhum módulo de domínio importa `internal-reconciliacao` ou `web-logs`; só `app.module`.
O único uso de `engine` fora do `app` são os imports de auth/contracts/guards/decorators nos domínios.

---

## Ordem sugerida de migração

1. **Paths**
   - Adicionar `@core/*` e `@internal/*` no `tsconfig` (e manter `@modules/*`).

2. **Core**
   - Criar `src/core/`.
   - Mover `modules/engine/auth` → `core/auth`.
   - Mover `modules/engine/contracts` → `core/contracts`.
   - Mover `modules/engine/mobile-users` → `core/mobile-users`.
   - Mover `modules/web-logs` → `core/web-logs`.
   - Ajustar imports internos entre auth, contracts e mobile-users para `@core/*` (ou relativos dentro de `core/`).
   - Atualizar `app.module` e todos os módulos/controllers que usam `@modules/engine/*` para `@core/*`.
   - Remover a pasta `modules/engine` (vazia).
   - Atualizar `app.module` para `WebLogsModule` em `@core/web-logs` e remover `modules/web-logs`.

3. **Internal**
   - Criar `src/internal/reconciliacao/`.
   - Mover todo o conteúdo de `modules/internal-reconciliacao` para `internal/reconciliacao/`.
   - Ajustar imports relativos e de `DatabaseModule` para `@database/database.module`.
   - Atualizar `app.module` para `@internal/reconciliacao`.
   - Remover `modules/internal-reconciliacao`.

4. **Validação**
   - Build: `npm run build --workspace=apps/api`.
   - Testes: `npm run test --workspace=apps/api` (se houver).
   - Conferir se não restou referência a `@modules/engine`, `@modules/internal-reconciliacao` ou `@modules/web-logs` (exceto em docs, que podem ser atualizados em seguida).

---

## Benefícios

- **Separação clara**
  - `modules/` = apenas domínio (veículo, checklist, turno, etc.).
  - `core/` = auth, contracts, mobile-users, web-logs (infra e suporte).
  - `internal/` = reconciliação e futuros jobs/APIs internas.

- **Nomenclatura**
  - `@core` e `@internal` deixam explícito o tipo de módulo.

- **Evolução**
  - Novos jobs, workers ou APIs internas tendem a ir em `internal/`.
  - Novos recursos transversais (ex.: cache, feature-flags) em `core/` ou em `common/`, conforme o caso.

- **Onboarding**
  - Fica mais fácil explicar: “domínio em `modules/`, infra em `core/`, processos de sistema em `internal/`”.

---

## Alternativas consideradas

1. **Manter `engine/` e só tirar de `modules/`**
   - Ex.: `src/engine/` com `@engine/*`.
   - O nome “engine” é genérico; `core` reflete melhor “infraestrutura base”.

2. **`internal/` com nome `internal-reconciliacao`**
   - Caminho `internal/internal-reconciliacao` é redundante.
   - `internal/reconciliacao` é mais limpo; o módulo Nest pode continuar `InternalReconciliacaoModule`.

3. **`web-logs` em `internal/`**
   - Web-logs é suporte/observabilidade, não processo de sistema.
   - Manter em `core/` junto com auth/contracts faz mais sentido; se no futuro houver um `observability/`, web-logs pode migrar para lá.

---

## Resumo

- **Criar:** `src/core/` (auth, contracts, mobile-users, web-logs) e `src/internal/` (reconciliacao).
- **Mover:** `engine/*` e `web-logs` para `core/`; `internal-reconciliacao` para `internal/reconciliacao/`.
- **Deixar em `modules/`:** só domínio (apr, atividade, checklist, eletricista, equipe, mobile-upload, turno, turno-realizado, veiculo).
- **Paths:** `@core/*`, `@internal/*`; migrar todos os imports de `@modules/engine`, `@modules/internal-reconciliacao` e `@modules/web-logs` para os novos aliases.
