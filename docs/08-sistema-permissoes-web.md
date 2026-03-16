# Sistema de Permissoes no Web

Este documento define o modelo alvo para um sistema de permissoes no `apps/web` do Nexa Oper.

O objetivo aqui nao e sair implementando verificacoes isoladas. O objetivo e fechar um modelo coerente, incremental e auditavel para:

- proteger rotas e layouts
- esconder ou desabilitar acoes na UI
- bloquear server actions
- alinhar sessao web, banco e backend
- permitir evolucao futura para permissoes por contrato/escopo

## Estado atual

Hoje o web ja tem uma base inicial:

- autenticacao via NextAuth em `apps/web/src/lib/utils/auth.config.ts`
- sessao com `roles` e `permissions` em `apps/web/types/next-auth.d.ts`
- hook cliente `useAuth()` em `apps/web/src/lib/hooks/useAuth.ts`
- componente `AuthGuard` em `apps/web/src/lib/components/AuthGuard.tsx`
- catalogo estatico de permissoes/roles em `apps/web/src/lib/types/permissions.ts`

Tambem existe persistencia de roles no banco:

- `User`
- `Role`
- `RoleUser`

Definidos em `packages/db/prisma/models/auth_web.prisma`.

## Problemas do modelo atual

O sistema atual e util como preparacao, mas ainda nao serve como modelo final:

1. O catalogo de permissoes esta hardcoded no frontend.
2. As permissoes efetivas sao derivadas so de role no login.
3. Nao existe fonte unica da verdade entre web, banco e API.
4. Nao existe guarda padrao para server actions.
5. Nao existe taxonomia clara de recurso/acao/escopo.
6. Algumas checagens estao espalhadas em codigo de feature, em vez de centralizadas.
7. Nao existe estrategia formal para permissao por contrato, base, equipe ou unidade organizacional.

## Principios do desenho

O sistema novo deve seguir estes principios:

1. `deny by default`: sem permissao explicita, a acao e negada.
2. A verificacao de permissao no servidor e obrigatoria para qualquer mutacao.
3. A UI pode esconder botoes, mas isso nunca substitui a validacao do servidor.
4. Roles sao agregadores convenientes; a unidade real de autorizacao e a permissao.
5. O catalogo de permissoes precisa ser tipado e versionavel.
6. Permissoes de escopo devem ser modeladas explicitamente, nao como excecao ad hoc.
7. A sessao web deve carregar permissoes efetivas ja resolvidas para leitura rapida.

## Modelo proposto

### 1. Permissao como capacidade

Formato sugerido:

- `recurso:acao`
- opcionalmente com escopo semantico resolvido fora da string

Exemplos:

- `dashboard:view`
- `turno:view`
- `turno:create`
- `turno:close`
- `escala:publish`
- `user:create`
- `user:update`
- `mobile-user:grant-contract`

Observacao: o escopo nao deve virar parte arbitraria da string, como `turno:close:contrato-7`. O escopo deve ser um dado separado.

### 2. Separar permissao de escopo

Precisamos suportar dois niveis:

- permissao global
- permissao com escopo

Escopos previstos:

- contrato
- base
- equipe
- unidade organizacional futura

Exemplo conceitual:

- usuario tem `turno:view` global
- usuario tem `turno:close` apenas para `contratoId=12`
- usuario tem `escala:update` apenas para `baseId=4`

No web, a API de autorizacao deve ficar parecida com:

```ts
can('turno:close')
can('turno:close', { contratoId: 12 })
canAny(['user:update', 'user:create'])
```

### 3. Roles viram bundles, nao regra de negocio

Roles continuam existindo, mas com responsabilidade limitada:

- facilitar atribuicao inicial
- agrupar permissoes comuns
- reduzir custo operacional

Roles nao devem concentrar regras de negocio escondidas.

Exemplo:

- `admin`
- `operacao-supervisor`
- `planejamento`
- `cadastros`
- `auditoria`

Cada role aponta para um conjunto de permissoes. Ajustes finos podem ser feitos com grants diretos por usuario.

### 4. Fonte unica da verdade no servidor

O frontend nao deve ser a origem do mapeamento de seguranca.

Modelo alvo:

- catalogo tipado compartilhado no repo
- persistencia de grants/roles no banco
- sessao NextAuth carregando permissoes efetivas resolvidas pelo servidor
- helpers cliente e servidor consumindo o mesmo catalogo

## Estrutura alvo

### Fase inicial sem migracao de banco grande

Podemos evoluir em passos:

1. manter `Role` e `RoleUser`
2. mover o catalogo de permissoes para um modulo central
3. criar um mapa explicito `role -> permissions`
4. criar helpers server-side obrigatorios para server actions
5. aplicar guardas nas features mais sensiveis

### Fase madura

Quando o modelo estiver fechado, podemos adicionar tabelas como:

- `Permission`
- `RolePermission`
- `UserPermission`
- `UserPermissionScope`

Ou um desenho equivalente, caso decidamos manter o catalogo em codigo e armazenar apenas grants.

## Recomendacao de modelagem

Minha recomendacao inicial e:

1. Catalogo de permissoes em codigo, versionado.
2. Roles persistidos no banco.
3. Mapeamento `role -> permissions` em codigo na primeira fase.
4. Grants diretos por usuario so quando realmente necessario.
5. Escopos persistidos apenas quando a feature exigir.

Esse caminho tem menor custo agora e nao impede evoluir depois.

## Camadas de implementacao

### 1. Catalogo central

Criar um modulo dedicado, por exemplo:

- `apps/web/src/lib/authz/permissions.catalog.ts`
- `apps/web/src/lib/authz/roles.catalog.ts`
- `apps/web/src/lib/authz/can.ts`

Responsabilidades:

- IDs tipados de permissao
- metadados para documentacao
- bundles por role
- helpers `can`, `canAny`, `canAll`

### 2. Sessao

No login:

- carregar roles do usuario
- resolver permissoes efetivas
- incluir permissoes no JWT/session

Depois, toda leitura cliente usa a sessao ja resolvida.

### 3. Guardas de UI

Padronizar:

- `AuthGuard` para autenticacao
- `PermissionGuard` para pagina/segmento
- componentes utilitarios como `Can`

Exemplo:

```tsx
<Can permission="turno:create">
  <Button>Abrir turno</Button>
</Can>
```

### 4. Guardas de server action

Precisamos de um wrapper padrao para impedir checagem manual espalhada.

Exemplo conceitual:

```ts
export const deleteUser = withPermission(
  'user:delete',
  async (input, ctx) => {
    // action
  }
);
```

Esse wrapper deve:

- obter sessao
- validar autenticacao
- validar permissao
- opcionalmente validar escopo
- auditar tentativa negada

### 5. Navegacao e menus

Menu, cards e atalhos nao devem depender de `if` solto em pagina.

O ideal e um registro central de navegacao:

- item de menu
- permissao requerida
- fallback visual

Isso facilita esconder paginas inacessiveis sem duplicar regra.

## Ordem sugerida de rollout

### Etapa 1. Consolidar o catalogo

- revisar nomes atuais
- normalizar recurso/acao
- remover duplicidade (`usuario:manage` vs `users:*`)
- decidir naming definitivo em ingles ou portugues

### Etapa 2. Helpers server/client

- criar `can`, `canAny`, `canAll`
- criar wrapper para server actions
- adaptar `useAuth` para consumir helper central

### Etapa 3. Aplicar nas features criticas

Prioridade sugerida:

1. usuarios web
2. mobile users e permissoes de contrato
3. escalas
4. turnos
5. cadastros mestres

### Etapa 4. Escopo

- introduzir contrato/base/equipe onde realmente houver regra contextual
- evitar antecipar complexidade em todas as telas

### Etapa 5. Administracao

- tela para visualizar grants por role
- tela para override por usuario
- auditoria de quem concedeu/revogou

## Regras que precisamos fechar antes de codar pesado

Estas decisoes ainda precisam de alinhamento:

1. O web vai usar apenas role ou tambem grant direto por usuario na primeira entrega?
2. Permissao por contrato no web deve reutilizar o conceito de `MobileContratoPermissao` ou sera outro modelo?
3. Queremos `resource:view/create/update/delete` como base universal, com alias de negocio por cima, ou vamos direto para permissoes de negocio como `turno:close` e `escala:publish`?
4. O menu deve esconder item sem permissao ou mostrar desabilitado em alguns casos?

## Decisoes fechadas ate agora

Estas decisoes ja estao alinhadas:

1. IDs de permissao em ingles.
2. A primeira entrega do web vai focar em acesso a modulos e itens de menu.
3. O comportamento inicial desejado e definir quem pode acessar cada modulo.
4. No futuro, perfis servirao como modelos base de permissao.
5. Depois sera possivel customizar permissoes individualmente por usuario.
6. Depois teremos filtros mais avancados por contrato e por funcao de acao como `create`, `update` e `delete`.

## Terminologia recomendada

Para evitar confusao de implementacao, vale separar estes conceitos:

### Role

Role e a classificacao ampla do usuario no sistema.

Exemplos:

- `admin`
- `manager`
- `supervisor`

Role ajuda a agrupar usuarios e pode continuar existindo no banco, mas nao precisa ser a interface principal de administracao de permissoes.

### Profile template

Profile template e um modelo reutilizavel de permissoes.

Exemplos:

- `almox`
- `operacao`
- `planejamento`
- `cadastros`

Esse template funciona como baseline:

- aplica um conjunto padrao de permissoes
- pode ser copiado para o usuario
- pode ser reaplicado depois com "reset to profile defaults"

Isso bate exatamente com o fluxo desejado:

- usuario recebe o perfil `almox`
- o sistema copia as permissoes padrao desse perfil
- depois um admin pode liberar ou retirar algo especifico
- se quiser, pode resetar o usuario para o padrao do perfil novamente

### Grant

Grant e a concessao efetiva de permissao para um usuario.

Exemplos:

- conceder `inventory:view`
- revogar `inventory:delete`
- conceder `turno:view` apenas para `contratoId=12`

Na pratica:

- role = agrupador amplo
- profile template = modelo padrao de permissoes
- grant = permissao final aplicada ao usuario

## Recomendacao para o modelo que voce descreveu

Como voce quer perfis-modelo com possibilidade de customizacao individual, o modelo mais coerente e:

1. roles continuam existindo, mas com importancia secundaria
2. profiles viram o ponto principal de administracao
3. grants diretos por usuario representam overrides

Em outras palavras:

- `profile` define o padrao
- `user grants` definem excecoes
- `reset to default` apaga overrides e reaplica o profile

## Fases sugeridas

### Fase 1. Menu e acesso a modulos

Objetivo:

- controlar quais modulos aparecem no menu
- bloquear acesso a paginas/modulos sem permissao

Sem entrar ainda em:

- `create`
- `update`
- `delete`
- escopo por contrato
- escopo por funcao

Formato sugerido para a fase 1:

- `dashboard:view`
- `users:view`
- `turnos:view`
- `escalas:view`
- `cadastros:view`
- `relatorios:view`

### Fase 2. Acoes dentro do modulo

Depois que a navegacao estiver estabilizada:

- `users:create`
- `users:update`
- `users:delete`
- `turnos:create`
- `turnos:close`
- `escalas:publish`

### Fase 3. Profiles como modelos

Adicionar estrutura para:

- criar profile template
- vincular usuario a um profile
- copiar permissoes do profile para o usuario
- resetar usuario para o baseline do profile

### Fase 4. Overrides por usuario

Adicionar grants explicitos de allow/deny por usuario para excecoes finas.

### Fase 5. Escopo avancado

Adicionar filtro por:

- contrato
- funcao/acao
- base
- equipe

## Primeira implementacao proposta

Dado o que ficou definido, a primeira PR funcional deveria fazer so isto:

1. criar modulo `authz` no web
2. mover o catalogo atual para esse modulo
3. renomear permissoes para naming canonico em ingles
4. criar um registro central de modulos e item de menu com permissao requerida
5. adaptar `useAuth` e `AuthGuard` para usar helper central
6. esconder menu e bloquear acesso de modulo/pagina com base em permissao `*:view`

Nao precisa ainda:

- criar tela de administracao de grants
- persistir profile template no banco
- aplicar autorizacao fina em botoes de CRUD

## Observacao importante

Mesmo depois da implementacao no web, a regra real de seguranca precisa existir no backend quando houver API mutando dado sensivel.

O web pode bloquear interface e server action local, mas nao deve ser o unico ponto de defesa para operacoes relevantes.
