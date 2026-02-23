# Guia para Criar Novo Módulo na API

Este guia segue o padrão atual da API NestJS no repositório.

## Estrutura recomendada

```text
apps/api/src/modules/<modulo>/
├── <modulo>.module.ts
├── <modulo>.controller.ts
├── <modulo>.service.ts
├── dto/
├── domain/
│   └── ports/
└── application/
    └── use-cases/
```

## Passo a passo

1. Criar contratos públicos (quando endpoint for consumido externamente).

- caminho: `apps/api/src/contracts/<contexto>/*.contract.ts`

2. Criar DTOs de entrada no módulo.

- caminho: `apps/api/src/modules/<modulo>/dto/*`

3. Definir portas (interfaces + token DI).

- caminho: `apps/api/src/modules/<modulo>/domain/ports/*`

4. Implementar use case em `application/use-cases`.

- use case injeta porta via token
- regra de negócio fica no use case

5. Implementar adapter concreto (`*.service.ts`).

- integração com Prisma/serviços externos
- classe implementa a porta

6. Criar controller.

- mapeia rota
- recebe DTO
- delega para use case

7. Registrar no módulo Nest (`*.module.ts`).

- `providers`: service + use case + binding `{ provide: TOKEN, useExisting: Service }`
- `controllers`: controller

8. Registrar módulo no `AppModule`.

- arquivo: `apps/api/src/app.module.ts`

9. Adicionar README curto do módulo.

- caminho: `apps/api/src/modules/<modulo>/README.md`

10. Cobrir com testes de use case e build.

```bash
npm run build --workspace=apps/api
npm run test --workspace=apps/api
```

## Exemplo de token de porta

```ts
export const EXAMPLE_REPOSITORY = Symbol('EXAMPLE_REPOSITORY');

export interface ExampleRepositoryPort {
  findById(id: number): Promise<{ id: number } | null>;
}
```

## Exemplo de binding no módulo

```ts
providers: [
  ExampleService,
  ExampleUseCase,
  { provide: EXAMPLE_REPOSITORY, useExisting: ExampleService },
]
```

## Checklist de qualidade

- endpoint documentado (Swagger decorators)
- DTO validando payload
- use case sem dependência direta de Prisma
- erro de negócio com `AppError` quando aplicável
- contrato em `src/contracts` atualizado quando necessário
