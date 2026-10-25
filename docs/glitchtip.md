# Monitoramento de erros com GlitchTip

Escopo: API NestJS e Web Next.js neste monorepo. Flutter fica para o repositório mobile. Não há
deploy, migração de banco ou alteração na VPS nesta entrega.

## Arquitetura e compatibilidade

SDKs oficiais fixados em `10.22.0`: `@sentry/node` (API), `@sentry/nextjs` (Web) e `@sentry/core`
(tipos compartilhados). A versão aceita Node >=18 e Next 13.2/14/15/16; os frameworks deste
repositório são Nest 11 e Next 15.5.7. A API usa o SDK Node diretamente no filtro existente,
evitando adicionar outro filtro Nest e duplicar eventos.

Referências consultadas:

- https://glitchtip.com/sdkdocs/javascript-nextjs/
- https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
- https://github.com/getsentry/sentry-javascript/tree/10.22.0

O GlitchTip recomenda o SDK Next.js e o protocolo de envelopes Sentry. A integração limita-se a
eventos de erro: sem performance, Session Replay, profiling, logs remotos, sessões, túnel ou
dependências do Sentry SaaS. A aceitação real pelo servidor GlitchTip 6.1.0 ainda exige teste em
staging com DSNs fornecidos pelo operador. Nenhum evento foi enviado para produção durante a
implementação.

O npm encontra um conflito preexistente entre ESLint 9 e typescript-eslint 7 na raiz. Para
reproduzir a instalação do lockfile neste estado, usar `npm ci --legacy-peer-deps`; os SDKs não
exigem mudar esses pacotes. A instalação local usou `--ignore-scripts`; em checkout limpo, executar
a geração Prisma já prevista pelo projeto antes dos builds. Não executar migrations para esta
integração.

## Variáveis

Exemplos sem credenciais estão no `.env.example` da raiz.

| Variável                            | Uso                                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------ |
| `GLITCHTIP_DSN_API`                 | DSN exclusivo da API, somente servidor                                               |
| `GLITCHTIP_DSN_WEB`                 | DSN Web no Node/Edge                                                                 |
| `NEXT_PUBLIC_GLITCHTIP_DSN_WEB`     | Mesmo projeto Web, incorporado no navegador durante o build                          |
| `GLITCHTIP_ENVIRONMENT`             | `production`, `staging` ou `development`; fallback para NODE_ENV, depois development |
| `NEXT_PUBLIC_GLITCHTIP_ENVIRONMENT` | Ambiente do navegador, definido no build                                             |
| `GLITCHTIP_SAMPLE_RATE`             | Probabilidade de enviar erros entre 0 e 1; padrão 1                                  |
| `NEXT_PUBLIC_GLITCHTIP_SAMPLE_RATE` | Sampling do navegador no build; padrão 1                                             |
| `GLITCHTIP_COMMIT`                  | SHA imutável opcional                                                                |
| `NEXT_PUBLIC_GLITCHTIP_COMMIT`      | Mesmo SHA para o navegador, no build                                                 |

DSN vazio ou malformado desabilita o envio. Não copiar o DSN API para variáveis públicas. Os DSNs
públicos identificam o destino de ingestão, mas não devem ser versionados. Tokens administrativos
não são necessários. As variáveis públicas exigem rebuild para qualquer alteração; reiniciar o
servidor é suficiente para as privadas.

Releases: `nexa-api@<versão do pacote>+<SHA>` e `nexa-web@<versão do pacote>+<SHA>`, omitindo o
sufixo quando não configurado. O pipeline futuro pode fornecer o SHA com `git rev-parse HEAD` antes
do build e repetir o mesmo valor no runtime. Não usar timestamps ou SHAs diferentes entre servidor e
navegador. O Turbo inclui as variáveis de monitoramento na chave de cache.

## Fluxo de captura

- API: inicializa antes de importar AppModule. O GlobalExceptionFilter envia apenas status >=500,
  com método, rota Express normalizada e request ID do AsyncLocalStorage. Mantém logs e resposta
  HTTP existentes. Erros de processo são capturados pelos handlers oficiais de
  uncaughtException/unhandledRejection; a política normal de término do processo continua sendo
  responsabilidade do runtime.
- Web: `instrumentation.ts` carrega Node/Edge separadamente e preserva o graceful shutdown Node.
  `onRequestError` captura falhas do Next, incluindo Server Components, renderização e Server
  Actions que escapam da ação. O wrapper de build Sentry integra o framework.
- Browser: `instrumentation-client.ts` instala handlers globais e de callbacks assíncronos.
  `global-error.tsx` captura falhas de renderização locais; erros com digest já registrados no
  servidor são ignorados nessa captura.
- O ErrorHandler compartilhado envia erros capturados em operações e Server Actions que retornam
  ActionResult. Erros assíncronos tratados fora desse utilitário precisam chamar
  `captureUnexpected(error)` explicitamente. O chamador não deve capturar e depois relançar o mesmo
  erro.
- Validação Zod, AbortError, status HTTP 4xx, sinais NEXT_REDIRECT/NEXT_NOT_FOUND e as mensagens
  padronizadas de permissão são excluídos. Erros de negócio lançados como Error genérico não podem
  ser classificados com certeza: devem receber tipo/status explícito futuramente, sem alterar regras
  de negócio nesta entrega.

## Privacidade

`packages/observability` centraliza `beforeSend` para todos os runtimes. Reconstrói eventos usando
uma lista de campos permitidos, em vez de confiar somente no filtro do SDK.

Mantém ID/timestamp do evento, plataforma, nível, ambiente/release, tipo da exceção, mecanismo e
localizações da stack (somente nome do arquivo fonte, função, linha/coluna). Mensagens são
substituídas por `[redacted]`. Caminhos locais completos, origem de URLs, queries, fragmentos,
variáveis locais e trechos de fonte são descartados. Esse rigor reduz o detalhe disponível para
diagnóstico, especialmente em bundles minificados.

Descarta request/response completos, URL da requisição, headers, Authorization, cookies, usuário,
extras, contextos, breadcrumbs, attachments e demais campos fora da lista. Assim não envia
formulários, JWTs, senhas, banco, localização, payloads de sincronização ou URLs S3 assinadas. Tags
aceitas são apenas método, rota estática normalizada e request ID hexadecimal/UUID. Não usar dados
fornecidos por usuários nessas tags. Os logs locais existentes não são encaminhados ao GlitchTip nem
alterados por esta política.

## Volume, transporte e duplicidade

- `sampleRate` configurável, sem traces; breadcrumbs limitados a zero.
- Mesmo objeto Error só é capturado manualmente uma vez por runtime (WeakSet). Browser também usa
  Dedupe do SDK.
- Limite fixo de 30 eventos por minuto por instância SDK em beforeSend. É um limite local, não
  global; várias instâncias/navegadores multiplicam o volume. Para contenção adicional reduzir
  sampling e aplicar limites no servidor GlitchTip.
- Buffer de transporte em memória limitado a 20 envelopes. Não usa armazenamento offline persistente
  no navegador ou servidor. Eventos podem ser perdidos durante indisponibilidade ou encerramento
  abrupto.
- Envio assíncrono: falhas de transporte são absorvidas pelo SDK. Não bloqueia respostas e não tenta
  confirmar recebimento antes de responder.

## Validação e operação

```sh
npm run test --workspace=packages/observability
DATABASE_URL=postgresql://test:test@127.0.0.1:1/nexa_test \
JWT_SECRET=local-test-secret-not-for-production \
npm run test --workspace=apps/api -- --runInBand
npm run api:build
npm run type-check --workspace=apps/web
npm run web:build
```

Os testes novos cobrem configuração com/sem DSN, sanitização de segredos, volume, duplicidade,
falhas esperadas, transporte real do SDK rejeitando envio e preservação de respostas do filtro. Os
testes existentes usam mocks; a URL fictícia acima não aponta para um banco real. Supertest precisa
abrir portas locais e o build Web baixa fontes Google.

Em staging, configurar projetos independentes e ambos os DSNs Web, provocar um erro sintético sem
dados reais em API, browser, renderização e Server Action. Confirmar release/ambiente, stack, evento
único e ausência de dados proibidos. Validar também 400/401/403 sem evento e aplicações funcionando
sem DSN. Não criar endpoint público permanente de teste. Não provocar crashes/testes destrutivos em
produção.

Source maps não são enviados automaticamente (`sourcemaps.disable`), e nenhum token Sentry/GlitchTip
é necessário para build. Stack traces estão presentes, mas nomes de arquivos reduzidos por
privacidade e código minificado limitam a simbolicação. Uma futura publicação privada de source maps
precisa preservar a correspondência dos nomes de arquivos e releases e ser validada no GlitchTip
antes de ser habilitada.

Para deploy controlado posterior: instalar dependências, gerar cliente Prisma conforme fluxo
existente, definir ambiente/SHA e variáveis públicas antes do build, configurar DSNs privados no
runtime, construir API/Web e implantar pelo procedimento habitual. Nenhuma mudança de schema de
banco é exigida.

Rollback rápido: esvaziar DSNs privados e reiniciar API/Web; esvaziar DSN público e reconstruir a
Web para desabilitar navegadores novos. Clientes com bundles antigos mantêm o DSN até atualizar;
revogar a chave de ingestão no GlitchTip se for necessário interrompê-los imediatamente. Rollback de
código: reverter o commit da integração e reinstalar pelo lockfile correspondente.

## Resultado da validação local

- Pacote de observabilidade: 6 testes aprovados, incluindo SDK real sem DSN e envelope com
  attachment descartado durante falha de transporte.
- Filtro da API: 4 testes novos aprovados; build e type-check da API aprovados.
- Suíte completa da API: 105 testes aprovados, 1 falha preexistente em
  `turno-checklist-sync-queue.service.spec.ts` (mock de `findMany` sem retorno iterável). O teste e
  o serviço não foram alterados.
- Build de produção da Web e type-check aprovados; lint dos arquivos Web alterados aprovado.
- Lint dos arquivos API novos/alterados aprovado. Lint completo da API mantém 46 erros em arquivos
  não alterados (formatação e regras de tipos).
- Revisão de diff e busca por DSNs reais: nenhum segredo incluído. A validação de ingestão no
  GlitchTip e de erros no navegador em staging permanece para o operador após configurar os DSNs.
