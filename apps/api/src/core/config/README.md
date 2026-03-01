# Config – Manual de uso

Módulo de configuração da API: variáveis de ambiente validadas (Zod) e configuração da aplicação Nest (prefixo, CORS, Helmet, Swagger, etc.).

---

## Visão geral

| Arquivo | Responsabilidade | Quando usar |
|---------|------------------|-------------|
| **env.ts** | Schema Zod das variáveis de ambiente (`envSchema`), objeto parseado (`env`), tipo `Env` e `isProd`. | Onde precisar de `env` ou `isProd`; fonte usada por `configure-app.ts`. |
| **configure-app.ts** | Função `configureApp(app)` que aplica na `INestApplication`: prefixo, trust proxy, body limits, ValidationPipe, CORS, Helmet, rota `__ping`, Swagger. | Chamar no bootstrap (main.ts) após criar a app e antes de `listen`. |
| **index.ts** | Schema reduzido (NODE_ENV, PORT, DATABASE_URL, JWT_SECRET) e `config` default. | Config mínima opcional; a configuração completa da app está em `env.ts` + `configure-app.ts`. |

---

## 1. Onde e como configurar

### 1.1 Arquivo .env

Crie um `.env` na raiz do projeto com as variáveis obrigatórias e, se quiser, as opcionais:

```env
# Obrigatórias
DATABASE_URL=postgresql://user:pass@localhost:5432/db
JWT_SECRET=seu-secret-com-pelo-menos-32-caracteres

# Opcionais (defaults na tabela abaixo)
# PORT=3000
# GLOBAL_PREFIX=api
# CORS_ORIGINS=https://app.com,https://admin.app.com
```

O módulo **env.ts** faz o parse na carga; se faltar variável obrigatória, a app falha na inicialização (Zod).

Carregamento de variáveis (prioridade maior para menor):

1. variáveis já presentes no ambiente do processo
2. `apps/api/.env.local`
3. `apps/api/.env`
4. `.env.local` da raiz
5. `.env` da raiz

### 1.2 Bootstrap (main.ts)

Para usar o módulo config completo, chame **configureApp(app)** no bootstrap após criar a app e antes de `listen`. Garanta que **NestPinoLogger** esteja registrado no módulo (configureApp usa `app.get(NestPinoLogger)` para logar).

```ts
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestPinoLogger } from './core/logger';
import { configureApp } from './core/config/configure-app';
import { env } from './core/config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(NestPinoLogger));
  configureApp(app);
  await app.listen(env.PORT ?? 3000);
}
void bootstrap();
```

---

## 2. Variáveis de ambiente

Todas as variáveis são definidas e validadas em **env.ts**. Booleans aceitam: `1`, `true`, `yes`, `y`, `on` (case insensitive).

### Obrigatórias

| Nome | Tipo | Descrição |
|------|------|-----------|
| **DATABASE_URL** | string (min 1) | URL de conexão com o banco. |
| **JWT_SECRET** | string (min 32) | Segredo para assinatura de JWT. |

### App / servidor

| Nome | Tipo / opções | Default | Descrição |
|------|----------------|---------|-----------|
| **NODE_ENV** | development \| production \| test | development | Ambiente de execução. |
| **PORT** | number | 3000 | Porta do servidor HTTP. |
| **TZ** | string (IANA) | America/Sao_Paulo | Timezone do processo (Date, Prisma, logs). Ex.: `UTC`, `America/Sao_Paulo`. |
| **GLOBAL_PREFIX** | string | api | Prefixo global das rotas (ex.: /api/users). |
| **REQUEST_TIMEOUT_MS** | number | 60_000 | Timeout de request (reservado para uso futuro). |
| **JSON_LIMIT** | string | 2mb | Limite do body JSON (express.json). |
| **ATIVIDADE_UPLOAD_JSON_LIMIT** | string | 12mb | Limite JSON específico para `/{GLOBAL_PREFIX}/mobile/uploads/activities` (upload com fotos inline). |
| **URLENCODED_LIMIT** | string | 2mb | Limite do body urlencoded. |

### Proxy / HTTPS

| Nome | Tipo | Default | Descrição |
|------|------|---------|-----------|
| **TRUST_PROXY** | bool | false | Ativar quando atrás de Nginx/reverse proxy (IP real em req.ip). |
| **HAS_HTTPS** | bool | false | Em produção, habilita HSTS (Strict-Transport-Security) via Helmet. |

### CORS

| Nome | Tipo | Default | Descrição |
|------|------|---------|-----------|
| **CORS_ORIGINS** | CSV ou JSON array | (vazio) | Origens permitidas. Ex.: `https://app.com` ou `https://a.com,https://b.com` ou `["https://a.com","https://b.com"]`. Em **produção** com vazio: CORS bloqueado. Em **dev** com vazio: CORS permissivo (aviso no log). |

### Swagger

| Nome | Tipo | Default | Descrição |
|------|------|---------|-----------|
| **SWAGGER_ENABLED** | bool | true | Swagger só é montado se `SWAGGER_ENABLED && !isProd`; URL: `/{GLOBAL_PREFIX}/docs`. |

### Security (Helmet)

| Nome | Tipo | Default | Descrição |
|------|------|---------|-----------|
| **SECURITY_CSP** | bool | false | Content-Security-Policy (pode quebrar Swagger UI se true). |
| **SECURITY_COEP** | bool | false | Cross-Origin-Embedder-Policy. |

### Rate limit (reservado)

| Nome | Tipo | Default | Descrição |
|------|------|---------|-----------|
| **RATE_LIMIT_WINDOW_MS** | number | 60_000 | Janela em ms (uso futuro). |
| **RATE_LIMIT_MAX_PER_IP** | number | 20 | Máximo por IP (uso futuro). |
| **RATE_LIMIT_MAX_PER_USER** | number | 5 | Máximo por usuário (uso futuro). |

### Uploads

| Nome | Tipo | Default | Descrição |
|------|------|---------|-----------|
| **UPLOAD_STORAGE** | `local` \| `s3` | local | Estratégia de armazenamento usada pelo módulo de upload. |
| **UPLOAD_ROOT** | string | `<workspaceRoot>/uploads` | Diretório base local dos uploads quando `UPLOAD_STORAGE=local`. Caminho relativo é resolvido a partir da raiz do monorepo. |
| **UPLOAD_LEGACY_ROOTS** | CSV/JSON array (opcional) | (vazio) | Diretórios legados adicionais usados como fallback de leitura para `/uploads/*` e `/mobile/photos/*`. |
| **UPLOAD_BASE_URL** | string (opcional) | (vazio) | Quando definido, a API retorna URLs absolutas com essa base para uploads locais. |
| **UPLOAD_MAX_FILE_SIZE_BYTES** | number | 10_485_760 | Tamanho máximo por arquivo em bytes para endpoints de upload. |

---

## 3. O que a configureApp faz

A função **configureApp(app)** aplica na instância Nest, em ordem:

1. **Prefixo global e shutdown hooks** – `app.setGlobalPrefix(env.GLOBAL_PREFIX)`, `app.enableShutdownHooks()`.
2. **Trust proxy** – Se `env.TRUST_PROXY`, define `trust proxy` no Express para obter IP real atrás de Nginx.
3. **Body limits** – aplica parser dedicado para `/{GLOBAL_PREFIX}/mobile/uploads/activities` com `ATIVIDADE_UPLOAD_JSON_LIMIT` e, para as demais rotas, `express.json({ limit: env.JSON_LIMIT })` e `express.urlencoded({ limit: env.URLENCODED_LIMIT })`.
4. **ValidationPipe global** – `transform: true`, `whitelist: true`, `forbidNonWhitelisted: false`.
5. **CORS** – Regras por ambiente e `env.CORS_ORIGINS`: em produção com origens vazias bloqueia; em dev com vazias é permissivo. Com lista definida: valida por match exato e por base (protocolo + host).
6. **Helmet** – Middleware de segurança: `contentSecurityPolicy: env.SECURITY_CSP`, `crossOriginEmbedderPolicy: env.SECURITY_COEP`, `hsts` só em produção com `env.HAS_HTTPS`.
7. **Rota de health** – `GET /__ping` responde 200 com corpo `ok`.
8. **Swagger** – Se `env.SWAGGER_ENABLED && !isProd`, monta documento e `SwaggerModule.setup(\`${env.GLOBAL_PREFIX}/docs\`, app, doc)`.

---

## 4. Uso de env no resto da app

Importe **env** ou **isProd** de `./core/config/env` (ou do barrel do config, se existir) para ler configuração tipada:

```ts
import { env, isProd } from './core/config/env';

// Exemplos
const port = env.PORT;
const dbUrl = env.DATABASE_URL;
const prefix = env.GLOBAL_PREFIX;
if (isProd) {
  // ...
}
```

O objeto **env** é parseado na carga do módulo; se faltar variável obrigatória, a aplicação falha na inicialização (Zod lança).

---

## 5. Resumo rápido

- **Configurar**: criar `.env` com `DATABASE_URL` e `JWT_SECRET` (e opcionais). No **main.ts**, após criar a app e (opcionalmente) `app.useLogger`, chamar **configureApp(app)** e depois **app.listen(env.PORT ?? 3000)**.
- **CORS em produção**: definir **CORS_ORIGINS** (CSV ou JSON array); vazio bloqueia.
- **Swagger**: só em não-produção e com **SWAGGER_ENABLED** true; URL `/{GLOBAL_PREFIX}/docs` (ex.: /api/docs).
- **Config completa**: está em **env.ts** (variáveis) + **configure-app.ts** (aplicação na Nest); **index.ts** é schema reduzido opcional.
