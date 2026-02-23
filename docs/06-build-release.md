# Manual de Build e Release

## Pré-requisitos

- Node.js 20+
- npm 10+
- acesso ao banco do ambiente alvo
- `.env` configurado

## Build local (baseline)

```bash
npm run install:all
npm run db:generate
npm run lint
npm run build
```

Opcional de segurança antes de release:

```bash
npm run test
```

## Build por workspace

```bash
npm run build --workspace=apps/api
npm run build --workspace=apps/web
npm run db:generate --workspace=packages/db
```

## Fluxo recomendado de release

1. Atualizar branch e instalar deps.

```bash
git pull
npm ci
```

2. Gerar client Prisma.

```bash
npm run db:generate
```

3. Aplicar migrations no ambiente alvo.

```bash
npm run db:migrate:deploy
```

4. Build de produção.

```bash
npm run build
```

5. Publicar artefatos/processos (PM2 ou plataforma).

## Ordem correta em produção

Sempre execute nesta ordem:

1. `npm ci`
2. `npm run db:generate`
3. `npm run db:migrate:deploy`
4. `npm run build`
5. restart/reload de processos

## Smoke tests pós-build

```bash
# API
curl -i http://localhost:3001/__ping

# Web
curl -I http://localhost:3000
```

## Erros comuns

- `Prisma Client out of date`: rodar `npm run db:generate`
- migration pendente em produção: rodar `npm run db:migrate:deploy`
- quebra de tipos no web: resolver `tsc` antes de release

## Critério de aprovação de release

Release só deve seguir com:

- `npm run build` concluído sem erro
- migrations aplicadas com sucesso no ambiente alvo
- smoke tests básicos de API e Web aprovados
