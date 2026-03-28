# Contrato de Dados do Mobile para Projetos e Viabilizacao

## Objetivo

Este documento define apenas:

- quais informacoes o mobile precisa receber da API
- quais tabelas locais o mobile precisa ter para armazenar essas informacoes
- quais tabelas locais o mobile precisa ter para capturar a viabilizacao offline

Este documento nao trata da estrategia de sync.

Ele deve servir como referencia para:

- modelagem do banco local do app
- modelos de dados do app
- parse do payload vindo da API
- montagem do payload de envio da viabilizacao

Documento relacionado:

- `docs/09-projetos-programacoes-operacionais.md`

## Principios

- o servidor continua sendo a fonte de verdade
- o mobile guarda um espelho local das informacoes recebidas da API
- o mobile guarda rascunhos locais separados para captura offline
- o `remoteId` vindo da API nao substitui o identificador local do app
- poste precisa ter um identificador local estavel no app para vincular vaos e fotos

## Dados que o mobile precisa receber da API

Para a viabilizacao, o mobile precisa receber quatro grupos de dados:

1. catalogo de tipos de poste
2. catalogo de tipos de estrutura
3. catalogo de tipos de ramal
4. catalogo de materiais
5. projetos editaveis no mobile com o escopo tecnico atual ja levantado

## Catalogos tecnicos recebidos da API

## Tipo de poste

Tabela local recomendada:

- `proj_tipo_poste`

Campos:

- `remote_id`
: id do tipo de poste no servidor
- `nome`
: descricao exibida no app

Uso:

- preencher o select de tipo de poste no levantamento

## Tipo de estrutura

Tabela local recomendada:

- `proj_tipo_estrutura`

Campos:

- `remote_id`
: id do tipo de estrutura no servidor
- `contrato_remote_id`
: contrato ao qual esse tipo de estrutura pertence
- `nome`
: descricao exibida no app

Uso:

- preencher a lista de estruturas possiveis de um poste
- filtrar por contrato do projeto

## Tipo de ramal

Tabela local recomendada:

- `proj_tipo_ramal`

Campos:

- `remote_id`
: id do tipo de ramal no servidor
- `nome`
: descricao exibida no app

Uso:

- preencher os tipos de ramal para informar quantidade por poste

## Material

Tabela local recomendada:

- `material_catalogo`

Campos:

- `remote_id`
: id do material no servidor
- `codigo`
: codigo operacional do material
- `descricao`
: descricao exibida no app
- `unidade_medida`
: unidade do material
- `ativo`
: indica se ainda pode ser usado

Uso:

- selecionar o material condutor do vao

## Projeto de viabilizacao recebido da API

Tabela local recomendada:

- `proj_projeto`

Cada projeto recebido pela API representa um projeto ainda editavel no mobile.

Status esperados no mobile:

- `PENDENTE`
- `EM_VIABILIZACAO`
- `EM_CORRECAO`
- `VIABILIZADO_PARCIAL`

Campos:

- `remote_id`
: id do projeto no servidor
- `contrato_remote_id`
: id do contrato do projeto
- `contrato_nome`
: nome do contrato
- `contrato_numero`
: numero do contrato
- `numero_projeto`
: identificacao administrativa do projeto
- `descricao`
: descricao administrativa do projeto
- `equipamento`
: equipamento principal do projeto
- `municipio`
: municipio do projeto
- `observacao`
: observacao administrativa do projeto
- `status`
: status macro visivel no mobile
- `tipo_viabilizacao_pendente`
: informa se o app deve tratar como viabilizacao total ou continuidade parcial
- `ultima_validacao_resultado`
: ultimo resultado de validacao, quando existir
- `ultima_validacao_observacao`
: observacao da ultima validacao, importante para correcao em campo

Observacoes:

- o mobile nao precisa guardar historico completo de viabilizacoes anteriores
- o que importa para continuidade e o escopo tecnico atual do projeto
- se a API mandar mais campos de historico, o app pode ignorar

## Poste do projeto recebido da API

Tabela local recomendada:

- `proj_poste`

Cada registro representa um poste ja levantado dentro do projeto.

No contrato do mobile, o poste precisa ter um identificador estavel proprio.

Padronizacao recomendada:

- `poste_uuid`
: identificador estavel do poste no app e no contrato mobile
- `numero_cadastro`
: identificador/codigo de cadastro do poste no dominio
- `numero_poste`
: numero atual do poste na distribuidora, quando for relevante para exibicao

Observacao:

- no backend atual, o campo estavel existente e `cadastroPoste.identificador`
- para o mobile, ele pode ser tratado como `numero_cadastro`
- se o app precisar de `poste_uuid` distinto de `numero_cadastro`, esse campo deve passar a ser exposto explicitamente pela API

Campos:

- `remote_id`
: id do poste do projeto no servidor
- `poste_uuid`
: identificador estavel do poste usado pelo app para vinculos locais
- `projeto_remote_id`
: projeto ao qual o poste pertence
- `cadastro_poste_remote_id`
: id do cadastro mestre do poste no servidor
- `numero_cadastro`
: numero/codigo de cadastro do poste
- `numero_poste`
: numero atual do poste da distribuidora
- `viabilizacao_remote_id`
: viabilizacao que gerou ou atualizou esse poste
- `validacao_remote_id`
: validacao que aprovou a versao atual desse poste
- `tipo_poste_remote_id`
: tipo do poste, quando informado
- `latitude`
: latitude do poste
- `longitude`
: longitude do poste
- `ordem`
: ordem logica do poste no levantamento
- `observacao`
: observacao tecnica do poste

Observacoes importantes:

- `remote_id` e o id do servidor
- no app, esse campo deve ficar separado do identificador local do rascunho
- `poste_uuid` e a chave estavel para vincular estruturas, ramais, vaos e fotos
- `numero_cadastro` nao e a mesma coisa que `numero_poste`
- `numero_poste` pode ser alterado sem quebrar a relacao do vao
- fotos nao precisam vir na carga de poste de viabilizacao parcial

## Estrutura do poste recebida da API

Tabela local recomendada:

- `proj_poste_estrutura`

Cada registro representa uma estrutura vinculada a um poste ja levantado.

Campos:

- `remote_id`
: id da relacao no servidor
- `projeto_remote_id`
: projeto ao qual o registro pertence
- `poste_remote_id`
: poste ao qual a estrutura pertence
- `tipo_estrutura_remote_id`
: tipo de estrutura informado no poste

Uso:

- reconstruir a lista de estruturas ja informadas naquele poste

## Quantidade de ramais do poste recebida da API

Tabela local recomendada:

- `proj_poste_ramal`

Cada registro representa um tipo de ramal e a quantidade prevista naquele poste.

Campos:

- `remote_id`
: id da relacao no servidor
- `projeto_remote_id`
: projeto ao qual o registro pertence
- `poste_remote_id`
: poste ao qual o ramal pertence
- `tipo_ramal_remote_id`
: tipo do ramal
- `quantidade_prevista`
: quantidade desse tipo de ramal no poste

Uso:

- reconstruir a composicao de ramais do poste

## Vao recebido da API

Tabela local recomendada:

- `proj_vao`

Cada registro representa um vao ja levantado entre dois postes do projeto.

Campos:

- `remote_id`
: id do vao no servidor
- `projeto_remote_id`
: projeto ao qual o vao pertence
- `viabilizacao_remote_id`
: viabilizacao que gerou ou atualizou esse vao
- `validacao_remote_id`
: validacao que aprovou a versao atual desse vao
- `poste_origem_remote_id`
: poste de origem do vao
- `poste_destino_remote_id`
: poste de destino do vao
- `material_condutor_remote_id`
: material condutor informado para esse vao
- `observacao`
: observacao tecnica do vao

Observacoes:

- o mobile nao precisa guardar metragem persistida do vao como fato oficial
- a metragem pode ser calculada localmente pelas coordenadas dos postes

## Tabelas locais de captura offline

Estas tabelas nao espelham o servidor.

Elas servem para o usuario criar ou continuar uma viabilizacao mesmo sem conexao.

## Rascunho de viabilizacao

Tabela local recomendada:

- `draft_viabilizacao`

Campos:

- `local_id`
: identificador local do rascunho, preferencialmente UUID
- `projeto_remote_id`
: projeto ao qual o rascunho pertence
- `resultado`
: `PARCIAL` ou `TOTAL`
- `data_viabilizacao`
: data informada pelo usuario
- `observacao`
: observacao geral da viabilizacao
- `status_local`
: estado interno do rascunho no app
- `remote_viabilizacao_id`
: id da viabilizacao no servidor, apos envio bem sucedido

Valores recomendados de `status_local`:

- `DRAFT`
- `PENDING_UPLOAD`
- `UPLOADED`
- `ERROR`

## Rascunho de poste

Tabela local recomendada:

- `draft_viabilizacao_poste`

Cada registro representa um poste editado no rascunho local.

Campos:

- `local_id`
: identificador local do registro
- `draft_viabilizacao_local_id`
: rascunho ao qual o poste pertence
- `poste_uuid`
: identificador unico do poste no app
- `remote_id`
: id do poste do projeto no servidor, quando esse poste ja existir
- `cadastro_poste_remote_id`
: id do cadastro mestre do poste no servidor, quando existir
- `numero_cadastro`
: numero/codigo de cadastro do poste
- `numero_poste`
: numero atual do poste
- `tipo_poste_remote_id`
: tipo do poste
- `latitude`
: latitude informada no app
- `longitude`
: longitude informada no app
- `ordem`
: ordem logica do poste no levantamento
- `observacao`
: observacao tecnica do poste

Regra:

- `poste_uuid` e a chave local principal para vincular estruturas, ramais, vaos e fotos
- `poste_uuid` nao deve depender de `numero_poste`

Fluxo esperado para poste novo:

1. criar o poste no rascunho com:
   - `local_id`
   - `poste_uuid`
   - `numero_cadastro`
   - `latitude`
   - `longitude`
   - `tipo_poste_remote_id`
2. depois associar estruturas
3. depois associar ramais
4. depois associar fotos
5. por fim sincronizar

Fluxo esperado para poste vindo de viabilizacao parcial:

- `remote_id`
- `poste_uuid`
- `numero_cadastro`
- `numero_poste`
- `latitude`
- `longitude`
- `tipo_poste_remote_id`
- `ordem`
- `observacao`

Observacao:

- nesse carregamento parcial o mobile nao precisa receber fotos do poste

## Rascunho de estrutura do poste

Tabela local recomendada:

- `draft_viabilizacao_poste_estrutura`

Campos:

- `local_id`
: identificador local do registro
- `draft_viabilizacao_local_id`
: rascunho ao qual o registro pertence
- `poste_uuid`
: poste local ao qual a estrutura pertence
- `tipo_estrutura_remote_id`
: tipo de estrutura selecionado

Uso:

- guardar todas as estruturas daquele poste no rascunho

## Rascunho de ramal do poste

Tabela local recomendada:

- `draft_viabilizacao_poste_ramal`

Campos:

- `local_id`
: identificador local do registro
- `draft_viabilizacao_local_id`
: rascunho ao qual o registro pertence
- `poste_uuid`
: poste local ao qual o ramal pertence
- `tipo_ramal_remote_id`
: tipo de ramal
- `quantidade_prevista`
: quantidade daquele tipo de ramal

Uso:

- guardar a quantidade de ramais por tipo daquele poste

## Rascunho de vao

Tabela local recomendada:

- `draft_viabilizacao_vao`

Campos:

- `local_id`
: identificador local do registro
- `draft_viabilizacao_local_id`
: rascunho ao qual o vao pertence
- `remote_id`
: id do vao no servidor, quando esse vao ja existir
- `poste_origem_uuid`
: poste local de origem
- `poste_destino_uuid`
: poste local de destino
- `material_condutor_remote_id`
: material condutor selecionado
- `observacao`
: observacao tecnica do vao

Regra:

- o vao no rascunho deve apontar para `poste_uuid`
- o vao nao deve usar `numero_poste` como chave de relacao

## Rascunho de foto do poste

Tabela local recomendada:

- `draft_poste_foto`

Campos:

- `local_id`
: identificador local da foto
- `draft_viabilizacao_local_id`
: rascunho ao qual a foto pertence
- `poste_uuid`
: poste local ao qual a foto pertence
- `remote_poste_id`
: id do poste no servidor, quando ja conciliado
- `client_photo_id`
: identificador local da foto para rastreabilidade
- `local_file_uri`
: caminho local do arquivo
- `mime_type`
: tipo MIME do arquivo
- `captured_at`
: data/hora da captura
- `upload_status`
: estado do upload da foto
- `uploaded_at`
: data/hora em que a foto foi enviada
- `last_error`
: ultima mensagem de erro de upload

Valores recomendados para `upload_status`:

- `PENDING`
- `UPLOADED`
- `ERROR`

## Campos minimos que o mobile deve ter em memoria ao abrir a viabilizacao

- tipos de poste
- tipos de estrutura
- tipos de ramal
- materiais
- projeto
- postes atuais do projeto
- estruturas atuais dos postes
- ramais atuais dos postes
- vaos atuais do projeto

## Contrato de escrita esperado pelo mobile

Quando o app enviar a viabilizacao estrutural para a API, o payload deve conseguir representar:

- projeto
- cabecalho da viabilizacao
- postes
- estruturas de cada poste
- quantidades de ramal de cada poste
- vaos

Shape logico esperado:

- `projetoId`
- `resultado`
- `dataViabilizacao`
- `enviadaEm`
- `observacao`
- `postes[]`
- `vaos[]`

Cada item de `postes[]` deve conter:

- `posteUuid`
- `remoteId` opcional
- `numeroCadastro`
- `numeroPoste`
- `tipoPosteId`
- `latitude`
- `longitude`
- `ordem`
- `observacao`
- `estruturas[]`
- `ramaisPrevistos[]`

Cada item de `estruturas[]` deve conter:

- `tipoEstruturaId`

Cada item de `ramaisPrevistos[]` deve conter:

- `tipoRamalId`
- `quantidadePrevista`

Cada item de `vaos[]` deve conter:

- `remoteId` opcional
- `posteOrigemUuid`
- `posteDestinoUuid`
- `materialCondutorId`
- `observacao`

## Contrato minimo de resposta esperado apos envio

O mobile precisa receber pelo menos:

- `viabilizacaoId`
- `statusProjeto`
- lista de postes com conciliacao entre identificador local e id remoto
- lista de vaos conciliados, quando aplicavel

Resposta logica minima:

- `viabilizacaoId`
- `statusProjeto`
- `postes[]`
  - `posteUuid`
  - `remoteId`
- `vaos[]`
  - `localId` ou chave logica
  - `remoteId`

## Decisoes fechadas para o mobile

- o app deve separar ids remotos de ids locais
- o app deve ter uma chave local estavel do poste
- estruturas e ramais do poste devem ficar em tabelas separadas
- o mobile nao precisa guardar historico completo de viabilizacoes para continuar o levantamento
- o que importa para continuidade e o escopo tecnico atual do projeto
- a observacao da ultima validacao e importante quando o projeto estiver em `EM_CORRECAO`
- fotos do poste devem continuar desacopladas do envio estrutural da viabilizacao
