# Documentação do Monorepo

Este diretório é a fonte oficial para documentação técnica do Nexa Oper.

## Ordem recomendada de leitura

1. `docs/01-arquitetura-monorepo.md`
2. `docs/02-configuracao-env.md`
3. `docs/06-build-release.md`
4. `docs/07-deploy-producao-pm2.md`

Para implementação:

- API: `docs/03-guia-criacao-modulo-api.md`
- Web: `docs/04-guia-criacao-modulo-web.md`
- Upload/fotos: `docs/05-upload-fotos-e-arquivos.md`

## Escopo oficial (ativo)

- arquitetura e decisões de estrutura
- configuração de ambiente (dev e prod)
- padrões para novos módulos
- fluxo de upload (local/S3), deduplicação e acesso web
- manuais de build, release e deploy com PM2

## Legado

Conteúdo histórico foi movido para:

- `docs/archive/legacy-root/`
- `apps/web/docs/archive/legacy/`

Use esses arquivos apenas como referência histórica.

## Regra de governança

- novos guias de operação devem entrar em `docs/` seguindo a numeração principal
- documentos temporários de análise devem ir para `*/docs/archive/legacy/`
- em caso de conflito, os guias `01..07` prevalecem
