# Manual Iniciante da API NestJS (Nexa Oper)

Este guia explica passo a passo como a API funciona, com foco em quem está começando com NestJS
ou com este projeto. A ideia é responder "o que é cada coisa, por que existe e como se
conecta".

> Recomendação de leitura: siga as seções na ordem e mantenha o código aberto ao lado para
> relacionar cada explicação com os arquivos reais do repositório.

---

## 1. Visão Geral Rápida

| Peça                         | Onde fica                                              | O que faz |
|-----------------------------|--------------------------------------------------------|-----------|
| `main.ts`                   | `apps/api/src/main.ts`                                 | Inicializa o Nest, carrega configurações globais e sobe o servidor HTTP. |
| `AppModule`                 | `apps/api/src/app.module.ts`                           | Registra todos os módulos de negócio, middlewares e interceptors globais. |
| Módulos de domínio          | `apps/api/src/modules/*`                               | Cada pasta representa um conjunto de casos de uso (ex.: `turno`, `apr`, `checklist`). |
| Infra compartilhada         | `apps/api/src/common` e `apps/api/src/middleware`      | Decorators, filtros, interceptors, loggers e middlewares reutilizáveis. |
| Banco de dados (Prisma)     | `apps/api/src/database` + `packages/db`                | Exposição do `PrismaClient` via `DatabaseModule` e schema compartilhado. |
| Configurações               | `apps/api/src/config/*`                                 | Limites de body parser, CORS, validação de `.env`, Swagger, etc. |

---

## 2. Como a aplicação inicia (bootstrap)

1. **Carregamento de `.env`** – `loadEnvironmentVariables()` em `main.ts` procura múltiplos
   caminhos até encontrar o arquivo e garantir que as variáveis estejam disponíveis antes de
   importar o resto do código (`apps/api/src/config/env-loader.ts`).
2. **Leitura de configs** – `getAppConfig()` e `getSecurityConfig()` definem limites de payload,
   portas, CORS e políticas de segurança (`apps/api/src/config/*.ts`).
3. **Criação do app** – `NestFactory.create(AppModule, …)` instancia o Nest já com um logger
   opinativo (`StandardLogger`).
4. **Express adapter** – `const expressApp = app.getHttpAdapter().getInstance()` permite aplicar
   middlewares nativos do Express antes mesmo de chegar nos pipes/guards Nest.
5. **Configuração global** – `configureCors`, `configureValidationPipe`, `configureSwagger` e
   `app.useGlobalFilters(new AllExceptionsFilter())` garantem validação, documentação e tratamento
   consistente de erros (`apps/api/src/main.ts`).
6. **Middlewares iniciais** – `requestLoggerMiddleware` e `timeoutMiddleware` são aplicados logo
   após criar o app, então todo request passa por log estruturado e proteção contra requests
   travados (`apps/api/src/middleware`).

**Resultado:** ao chamar `npm run start:dev` a API sobe em `http://localhost:3001/api`, com
Swagger disponível em `/api/docs` quando `NODE_ENV !== 'production'`.

---

## 3. Fluxo de uma requisição HTTP

```text
Cliente → Middlewares Express → Middlewares Nest → Guards → Interceptors → Controller → Service → Prisma → Resposta
```

1. **Middlewares Express** – logging e timeout (`apps/api/src/middleware/index.ts`).
2. **Middlewares Nest** – `LoggerMiddleware` roda para todas as rotas e o `RateLimitMiddleware`
   protege `POST /auth/login` (`AppModule.configure`).
3. **Guards** – rotas protegidas usam `JwtAuthGuard` (`apps/api/src/modules/engine/auth/guards/jwt-auth.guard.ts`)
   para garantir que o token é válido. Alguns endpoints adicionam `ContractPermissionsGuard` para
   checar permissões de contrato.
4. **Pipes globais** – o `ValidationPipe` transforma e valida DTOs automaticamente; qualquer dado
   fora do esperado resulta em `400 Bad Request` antes da lógica de negócio.
5. **Interceptors** – `ErrorLoggingInterceptor` e `OperationLoggingInterceptor` adicionam
   observabilidade (`@common/interceptors`).
6. **Controller** – classes anotadas com `@Controller()` definem rotas e recebem DTOs. Exemplo:
   `TurnoController` em `src/modules/turno/controllers/turno.controller.ts` expõe `POST /turnos/abrir`.
7. **Service** – a lógica mora em services injetados nos controllers. `TurnoService` coordena
   validações e acesso a banco (`src/modules/turno/services/turno.service.ts`).
8. **Banco** – `DatabaseService` (`src/database/database.service.ts`) injeta o `PrismaClient`
   configurado para timezone GMT-3 e logging.

---

## 4. Conceitos NestJS aplicados na prática

### 4.1 Modules (organização)
- `AppModule` (`src/app.module.ts`) importa tudo e aplica middlewares globais.
- Cada domínio tem seu módulo, por exemplo `TurnoModule` (`src/modules/turno/turno.module.ts`)
  que registra controllers, services, configura `MulterModule` e importa `DatabaseModule` +
  `AuthModule`.
- `DatabaseModule` (`src/database/database.module.ts`) exporta `DatabaseService` e o próprio
  `PrismaClient`, permitindo injeção em qualquer módulo.

### 4.2 Controllers (interface HTTP)
- Controladores traduzem rotas em chamadas de serviço. `TurnoController` expõe rotas para abrir,
  fechar e listar turnos e utiliza decorators do Swagger para documentar contratos.
- Use decorators como `@Get`, `@Post`, `@Body`, `@Query` para mapear HTTP → métodos TypeScript.

### 4.3 Services (regra de negócio)
- `TurnoService` concentra validações (duplicidade, auditoria, transações) e fala com o banco via
  `DatabaseService`. Ao abrir um turno, ele roda validações, cria auditoria, executa transações
  Prisma com timeout e trata exceções de conflito.
- Outros módulos seguem o mesmo padrão (ex.: `ChecklistPreenchidoService`, `EletricistaService`).

### 4.4 DTOs + validação automática
- DTOs vivem ao lado dos módulos e usam `class-validator`. Ex.: `AbrirTurnoDto` define todos os
  campos obrigatórios, limites de string, validação de arrays e exemplos para Swagger
  (`src/modules/turno/dto/abrir-turno.dto.ts`).
- O `ValidationPipe` global (configurado em `main.ts`) valida qualquer DTO antes de chamar o
  controller.

### 4.5 Guards, interceptors e filtros
- `JwtAuthGuard` usa Passport para validar tokens e já faz logging sanitizado.
- `ContractPermissionsGuard` (no módulo de auth) garante que o usuário possui acesso ao contrato
  da operação solicitada.
- `AllExceptionsFilter` captura qualquer erro não tratado e padroniza a resposta JSON.
- Interceptors (`@common/interceptors`) logam duração de operações e erros críticos.

### 4.6 Injeção de dependência
- Qualquer classe com `@Injectable()` pode ser injetada via construtor. Exemplo: `TurnoService`
  recebe `DatabaseService` e `ChecklistPreenchidoService` no construtor; o Nest resolve as
  dependências automaticamente porque ambos foram registrados no módulo.

---

## 5. Camada de banco de dados (Prisma)

1. **Pacote compartilhado** – `packages/db` expõe o `PrismaClient` gerado e todos os tipos do
   schema Prisma. Outros projetos (`apps/web`) podem importar o mesmo pacote para garantir
   tipagens idênticas.
2. **Schema modular** – dentro de `packages/db/prisma/models` os modelos são divididos por
   arquivo. O `schema.prisma` principal inclui esses arquivos e define o datasource MySQL.
3. **DatabaseService** – ao subir, conecta no banco, executa `SET time_zone = '-03:00'` e expõe
   métodos utilitários (`findAllTests`, `healthCheck`). Ele implementa `OnModuleInit` e
   `OnModuleDestroy` para conectar/desconectar automaticamente.
4. **Uso nos services** – os services chamam `this.db.getPrisma().entidade...` ou podem receber o
   `PrismaClient` diretamente (não recomendado) exportado pelo módulo.
5. **Migrations** – executar `npm run migrate:dev` dentro de `packages/db` atualiza o schema e gera
   o client. Como o pacote é um workspace, basta rodar na raiz `npm run db:migrate` (veja
   `SCRIPTS.md` / `package.json`).

---

## 6. Exemplo completo: abertura de turno

1. **Rota** – `POST /api/turnos/abrir` definida em `TurnoController` com `@Post('abrir')`.
2. **Autenticação** – `@UseGuards(JwtAuthGuard)` garante que apenas usuários autenticados
   cheguem no método `abrirTurno`.
3. **DTO** – o corpo precisa obedecer ao `AbrirTurnoDto`. Qualquer campo fora do padrão gera erro
   automático graças ao `ValidationPipe` global.
4. **Service** – o controller chama `turnoService.abrirTurno(abrirDto, allowedContracts)`;
   `TurnoService` valida entidades, aplica regras de negócio e cria registros relacionados.
5. **Transação Prisma** – `TurnoService` usa `this.db.getPrisma().$transaction(...)` com timeout
   para garantir atomicidade e evitar race conditions.
6. **Resposta** – o service retorna um `TurnoResponseDto`, o controller apenas reenvia para o
   cliente. Interceptors logam duração e AllExceptionsFilter padroniza erros.

Esse fluxo se repete para outros casos de uso: apenas mudam os DTOs, services e repositórios
consultados.

---

## 7. Como adicionar novas funcionalidades

1. **Criar módulo** – gere uma pasta em `src/modules/seu-modulo` com `*.module.ts`, controllers,
   services e DTOs. Use `TurnoModule` como referência para imports/exports.
2. **Registrar no AppModule** – adicione seu módulo no array `imports` de `AppModule` para que o
   Nest consiga resolvê-lo.
3. **Modelar DTOs** – defina DTOs com `class-validator` e `class-transformer`. Descreva tudo com
   `@ApiProperty` para aparecer no Swagger.
4. **Implementar services** – injete `DatabaseService` ou outros services para reutilizar lógica.
   Mantenha validações e erros específicos no service.
5. **Adicionar rotas** – controllers devem receber DTOs tipados e usar decorators (`@Body`,
   `@Param`, `@Query`). Se precisar de autenticação, aplique `@UseGuards(JwtAuthGuard)`.
6. **Atualizar documentação** – descreva novos módulos/rotas em `apps/api/docs` e, se necessário,
   no `README.md` da API para manter o manual sincronizado.

---

## 8. Checklist mental para entender o código

- [ ] Conferiu `main.ts` para saber quais componentes globais estão ativos?
- [ ] Leu `AppModule` para saber quais módulos foram importados e quais middlewares existem?
- [ ] Encontrou o módulo do domínio em `src/modules/<domínio>` e viu controllers/services/DTOs?
- [ ] Conferiu `DatabaseService` para entender como o banco está configurado?
- [ ] Validou as variáveis obrigatórias em `src/config/validation.ts` antes de subir a API?
- [ ] Atualizou a documentação sempre que criar uma nova feature?

Seguindo esse roteiro, você consegue navegar por qualquer funcionalidade da API sem se perder,
mesmo que ainda esteja aprendendo NestJS.
