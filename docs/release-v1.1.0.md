# Release v1.1.0 - 2026-03-05

## Visao Geral

Esta release consolida a base de migracao para o novo fluxo de operacao, incluindo:

- fortalecimento do pipeline de evidencias/fotos;
- novas capacidades no modulo de atividades;
- consolidacao das consultas de checklist e seguranca;
- estabilizacao de build no dashboard com renderizacao dinamica.

## Versionamento

- Monorepo: `1.1.0`
- API (`apps/api`): `0.1.0`
- Web (`apps/web`): `0.3.0`
- DB package (`packages/db`): `1.1.0`

## Destaques Tecnicos

1. Upload de evidencias com deduplicacao por checksum, metadados canonicos e vinculos rastreaveis.
2. Suporte completo a APR (modelos, respostas, assinaturas e evidencias relacionadas).
3. Modulo de atividades expandido (visao geral, materiais, medidores, produtividade e causa improdutiva).
4. Consulta de checklists com filtros avancados, detalhes de respostas e consolidacao de fotos.
5. Ajustes de UX/consistencia na visualizacao de checklist para estado de sincronizacao de fotos.
6. Renderizacao dinamica no dashboard para eliminar erros de build por `headers()` durante prerender.

## Mudancas de Operacao

- Recomendado rodar migracoes e gerar client Prisma antes do deploy:
  - `npm run db:generate`
  - `npm run db:migrate:deploy`
- Build validado em `apps/web`.
- Observacao: ambiente sem acesso ao banco (`10.8.0.2:3306`) pode registrar `P1001` durante a coleta de dados do build.

## Checklist de Deploy

1. `npm ci`
2. `npm run db:generate`
3. `npm run db:migrate:deploy`
4. `npm run build`
5. Reiniciar processos de API e Web
6. Executar smoke test basico (`/__ping` da API e homepage da Web)
