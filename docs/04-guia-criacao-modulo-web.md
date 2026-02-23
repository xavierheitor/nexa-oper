# Guia para Criar Novo Módulo na Web

Este guia segue o padrão atual do `apps/web` (schema + action + service + repository).

## Estrutura recomendada

```text
apps/web/src/lib/
├── schemas/<entidade>Schema.ts
├── repositories/<dominio>/<Entidade>Repository.ts
├── services/<dominio>/<Entidade>Service.ts
└── actions/<entidade>/
    ├── create.ts
    ├── update.ts
    ├── remove.ts
    ├── getById.ts
    └── list.ts
```

UI:

```text
apps/web/src/app/dashboard/<area>/<entidade>/
├── page.tsx
└── form.tsx (quando aplicável)
```

## Passo a passo

1. Definir schema Zod em `lib/schemas`.

- create/update/filter
- tipos `z.infer`

2. Criar repository.

- estender `AbstractCrudRepository`
- implementar: `create`, `update`, `delete`, `findById`, `findMany`, `count`

3. Criar service.

- estender `AbstractCrudService`
- implementar `create` e `update`
- delegar para repository

4. Registrar service no container.

- arquivo: `apps/web/src/lib/services/common/registerServices.ts`

5. Criar server actions.

- usar `handleServerAction` para validação/autorização/auditoria

6. Criar página/form e consumir actions.

7. Validar build/types.

```bash
npm run build --workspace=apps/web
npm run type-check --workspace=apps/web
```

## Exemplo de action

```ts
'use server';

import { container } from '@/lib/services/common/registerServices';
import { handleServerAction } from '@/lib/actions/common/actionHandler';
import { entidadeCreateSchema } from '@/lib/schemas/entidadeSchema';

export const createEntidade = async (rawData: unknown) =>
  handleServerAction(
    entidadeCreateSchema,
    async (data, session) => {
      const service = container.get<EntidadeService>('entidadeService');
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'Entidade', actionType: 'create' }
  );
```

## Checklist de qualidade

- schema cobre regras de domínio mínimas
- repository aplica `deletedAt: null` quando modelo é soft delete
- service não contém lógica de UI
- action nunca chama Prisma direto
- service registrado no container
