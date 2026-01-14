# API - Nexa Oper

API backend da aplicação Nexa Oper, construída com NestJS.

## Visão

- Arquitetura modular por domínio (`src/modules/*`)
- Cross-cutting centralizado em `src/common` (decorators, filtros, interceptors, middleware, utils)
- Configuração global em `main.ts` (CORS, validação, filtros, Swagger em dev) e `app.module.ts`
  (imports, middlewares, interceptors globais)
- Acesso a dados via pacote compartilhado `@nexa-oper/db` (Prisma)

## Estrutura

```bash
src/
├── main.ts             # Bootstrap e configuração global
├── app.module.ts       # Módulo raiz (imports, middlewares, interceptors)
├── common/             # Infra transversal (middleware, interceptors, utils)
├── database/           # Módulo de banco de dados
├── health/             # Healthcheck
├── metrics/            # Métricas e observabilidade
└── modules/            # Módulos de negócio (apr, checklist, turno, etc.)
```

## Documentação do Código

Consulte a documentação detalhada em `apps/api/docs/`:

- `ARQUITETURA.md` — visão e organização
- `MANUAL_INICIANTE.md` — guia para entender NestJS e este projeto passo a passo
- `MIDDLEWARES_INTERCEPTORS.md` — comportamento e pontos de extensão
- `FLUXOS_TURNO.md` — fluxos de abertura/fechamento (web e mobile)
- `PAYLOADS.md` — contratos de entrada/saída por endpoint

## Ambiente

- Validação de variáveis em `src/config/validation.ts` (via `@nestjs/config`)
- Interceptores globais: `ErrorLoggingInterceptor`, `OperationLoggingInterceptor`
- Middlewares: `LoggerMiddleware` (global) e `RateLimitMiddleware` (login)

### Variáveis de Ambiente

O carregamento e validação de variáveis de ambiente é gerenciado exclusivamente pelo
`@nestjs/config` (ConfigModule). Não há carregamento manual via `dotenv` no bootstrap.

**Desenvolvimento:** Crie o arquivo `.env` na pasta `apps/api/`. O sistema também buscará `.env` na
raiz da execução se necessário.

**Produção:** Você pode especificar o caminho do arquivo `.env` explicitamente usando a variável de
ambiente `ENV_FILE_PATH`. Exemplo: `ENV_FILE_PATH=/etc/nexa-oper/api.env node dist/main`

Se `ENV_FILE_PATH` não for definido, o sistema buscará `.env`, `.env.local` e `apps/api/.env` na
ordem definida no `AppModule`.

Exemplo de arquivo `.env` na pasta `apps/api/`:

```env
# Ambiente
NODE_ENV=development
PORT=3001

# Banco de Dados
DATABASE_URL="mysql://usuario:senha@localhost:3306/nexa_oper"

# Segurança / Auth
JWT_SECRET="seu_jwt_secret_muito_longo_e_seguro_deve_ter_32_caracteres_minimo"

# CORS
# Obrigatório em produção (NODE_ENV=production).
# Formats aceitos:
#   - CSV: http://site1.com,https://site2.com
#   - JSON: ["http://site1.com", "https://site2.com"]
CORS_ORIGINS=http://localhost:3000,https://seu-dominio.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_PER_IP=20
RATE_LIMIT_MAX_PER_USER=5

# ============================================
# CONFIGURAÇÃO DE UPLOADS
# ============================================

# UPLOAD_ROOT: Caminho absoluto para pasta raiz de uploads
# Se não configurado, usa: ./uploads (relativo ao diretório de execução)
# Exemplos:
#   - Desenvolvimento: deixe vazio ou comente
#   - Produção local: /var/www/nexa-oper/storage
#   - Produção remota: /mnt/nas/storage-nexa
# Estrutura criada automaticamente:
#   {UPLOAD_ROOT}/mobile/photos/ (fotos do mobile)
#   {UPLOAD_ROOT}/justificativas/anexos/ (anexos de justificativas)
UPLOAD_ROOT=

# UPLOAD_BASE_URL: URL pública para acesso aos uploads
# Se não configurado, usa paths relativos servidos pela própria API
# Exemplos:
#   - Desenvolvimento: deixe vazio ou comente (usa /uploads/mobile/photos)
#   - Produção com subdomínio: https://storage.nexaoper.com.br
#   - Produção com CDN: https://cdn.nexaoper.com.br
# IMPORTANTE: Não inclua /mobile/photos ou /justificativas/anexos na URL
# O sistema adiciona automaticamente esses paths
UPLOAD_BASE_URL=
```

## Observabilidade

- **StandardLogger**: Logging estruturado e assíncrono.
  - Grava em arquivos via streams não bloqueantes.
  - Sanitização automática de dados sensíveis (`sanitizeHeaders`, `sanitizeData`).
- **Arquivos**:
  - `app.log`: Logs gerais (exceto debug em produção).
  - `error.log`: Apenas erros e exceptions.
  - Localização padrão: `./logs` (configurável via variável de ambiente `LOG_PATH`).
- **Métricas**: `metrics` endpoint (Prometheus) quando habilitado.
