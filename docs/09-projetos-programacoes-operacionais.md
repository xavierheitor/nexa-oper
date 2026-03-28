# Projetos e Programacoes Operacionais

## Objetivo

Este documento descreve o desenho funcional e arquitetural do modulo de projetos/programacoes
operacionais da operacao de rede eletrica/distribuicao.

Ele deve servir como:

- guia de modelagem de banco
- guia de implementacao da API
- guia de implementacao do mobile
- guia de implementacao do backoffice web
- referencia para discussoes futuras de materiais, medicao e faturamento

Este documento assume como base o schema atual em:

- `packages/db/prisma/models/projetos.prisma`

## Principio central

O principio aprovado para este modulo e:

- o banco grava fatos
- progresso, pendencia, backlog de reprogramacao, indicadores e listas operacionais sao derivados
  por consulta

Isso significa que o modelo evita:

- fila persistida como fonte de verdade
- snapshots operacionais autoritativos por item tecnico
- contadores pre-calculados como fonte oficial
- status derivado persistido em poste, vao ou ramal

## Resumo do dominio

O processo real da fase atual e este:

1. o projeto nasce como cadastro administrativo
2. o projeto entra em viabilizacao tecnica no mobile
3. a viabilizacao levanta postes, estruturas, ramais por tipo, observacoes, GPS e fotos
4. a mesma viabilizacao tambem levanta vaos e informa um unico material condutor para cada vao
5. cada envio de viabilizacao informa se o levantamento do projeto/equipamento foi parcial ou total
6. a viabilizacao parcial precisa devolver ao mobile o escopo tecnico ja levantado para que outra
   pessoa consiga continuar o levantamento
7. apos cada envio de viabilizacao existe uma etapa de validacao/correcao do levantamento
8. apenas o escopo tecnico validado fica elegivel para programacao
9. a programacao sempre seleciona subconjuntos do escopo tecnico ja levantado e validado
10. cada programacao ou reprogramacao gera uma nova SI
11. a SI pertence a programacao, nunca ao projeto
12. a execucao registra o fato ocorrido em campo
13. pendencia e reprogramacao nascem de consulta sobre escopo + historico operacional
14. a lista de materiais para requisicao e derivada da programacao com base em estruturas, ramais e
    vaos

## Entidades centrais

### Projeto

`ProjetoProgramacao` continua sendo a entidade principal nesta fase.

Ele representa o cadastro administrativo e o agregado do projeto.

Campos centrais do projeto:

- `contratoId`
- `numeroProjeto`
- `descricao`
- `equipamento`
- `municipio`
- `concessionaria`
- `observacao`
- `status`

Observacao:

- `descricao` e a descricao administrativa consolidada do projeto; ela pode ser digitada diretamente
  ou derivada a partir de numero/equipamento/municipio, desde que o schema continue persistindo esse
  campo

O projeto nao carrega SI.

O projeto nao carrega fila de reprogramacao.

O projeto nao carrega percentual consolidado como verdade operacional.

### Viabilizacao

`ProjViabilizacao` registra o fato de um envio de viabilizacao tecnica.

Cada registro informa:

- `projetoId`
- `resultado` (`PARCIAL` ou `TOTAL`)
- `dataViabilizacao`
- `enviadaEm`
- `observacao`

O resultado de viabilizacao e um fato de negocio persistido.

O status macro do projeto pode refletir:

- `EM_VIABILIZACAO`
- `AGUARDANDO_VALIDACAO`
- `EM_CORRECAO`
- `VIABILIZADO_PARCIAL`
- `VIABILIZADO_TOTAL`

Mas o banco nao persiste "fila de itens faltando viabilizar".

Essa lista deve ser derivada pelo que existe ou nao no escopo tecnico do projeto.

### Validacao da viabilizacao

`ProjValidacaoViabilizacao` registra o fato de revisao, aprovacao, correcao ou rejeicao sobre um
envio de viabilizacao.

Cada registro informa:

- `projetoId`
- `viabilizacaoId`
- `resultado` (`APROVADA`, `CORRIGIDA` ou `REJEITADA`)
- `validadaEm`
- `observacao`

Regras funcionais:

- `validadaEm` representa o instante efetivo da decisao de validacao
- o mobile continua vendo o escopo tecnico atual em projetos `VIABILIZADO_PARCIAL` e `EM_CORRECAO`
- projeto `AGUARDANDO_VALIDACAO` nao volta para o mobile ate receber uma decisao de validacao
- a programacao so pode usar itens que tenham procedencia de validacao

### Escopo tecnico

O modelo separa:

- cadastro mestre do poste
- poste do projeto

Essa separacao existe para que:

- a identificacao estavel do poste nao seja a mesma coisa que o numero do poste da distribuidora
- o numero do poste possa ser corrigido no cadastro sem quebrar relacoes de vao
- o vao relacione postes por chave estavel, nunca por numero editavel

#### Cadastro mestre do poste

`ProjCadastroPoste` representa o cadastro principal do poste.

Campos centrais:

- `contratoId`
- `identificador`
- `numeroPoste`

Regras:

- `identificador` e a chave estavel usada pelo sistema/app
- `numeroPoste` e o numero atual da distribuidora
- ambos devem ser unicos por contrato

#### Poste do projeto

`ProjPoste` representa o uso daquele poste dentro do projeto.

Ele referencia:

- `cadastroPosteId`
- `projetoId`
- `viabilizacaoId`
- `validacaoId`

E guarda os fatos de campo do projeto:

- GPS
- tipo do poste
- observacao
- estruturas
- ramais previstos

O escopo tecnico levantado do projeto e composto por:

- `ProjCadastroPoste`
- `ProjPoste`
- `ProjPosteEstrutura`
- `ProjPosteRamal`
- `ProjVao`

Interpretacao:

- `ProjCadastroPoste` representa o cadastro estavel do poste
- `ProjPoste` representa o poste daquele projeto/levantamento
- `ProjPosteEstrutura` representa as estruturas informadas para o poste
- `ProjPosteRamal` representa a quantidade prevista por tipo de ramal naquele poste
- `ProjVao` representa a ligacao tecnica entre dois postes, com um unico material condutor informado

Os fatos levantados em campo sao persistidos no proprio escopo tecnico.

Nao existe tabela separada de "pendencia de levantamento".

Nao existe status individual de viabilizacao por item.

O modelo adotado e:

- `ProjPoste.viabilizacaoId` identifica a viabilizacao que levantou ou consolidou o poste
- `ProjPoste.validacaoId` identifica a validacao que aprovou a versao atual do poste para
  programacao
- `ProjVao.viabilizacaoId` identifica a viabilizacao que levantou ou consolidou o vao
- `ProjVao.validacaoId` identifica a validacao que aprovou a versao atual do vao para programacao
- `ProjPosteEstrutura` e `ProjPosteRamal` sao detalhes tecnicos do poste levantado
- `ProjVao` guarda apenas os extremos do vao e o material condutor
- a metragem do vao e derivada pelas coordenadas GPS dos postes do projeto

Decisao de modelagem:

- faz sentido marcar viabilizacao nos itens tecnicos levantados quando isso representa procedencia
  factual
- faz sentido marcar validacao nos itens tecnicos quando isso representa procedencia factual de
  liberacao para programacao
- nao faz sentido criar booleano `viabilizado` por item, porque isso seria redundante
- nao faz sentido criar booleano `validado` por item, porque `validacaoId` aponta para um fato de
  negocio persistido

### Programacao

`ProjProgramacao` representa a tentativa operacional junto a distribuidora.

Cada programacao possui:

- `projetoId`
- `siNumero`
- `status`
- `dataProgramada`
- `percentualPrevisto`
- `reprogramadaDeId`
- marcos operacionais
- motivo de cancelamento, quando houver

Marcos operacionais da programacao:

- `avisosEntregues`
- `desligamentoNecessario`
- `desligamentoConfirmado`

Importante:

- o booleano `viabilizado` nao existe mais na programacao
- viabilizacao e fato do projeto/levantamento, nao da SI
- `percentualPrevisto` e apenas metadado de planejamento, nao fonte oficial de progresso

### Item programado

Um item programado e apenas um vinculo entre programacao e escopo tecnico.

Tabelas:

- `ProjProgramacaoPoste`
- `ProjProgramacaoVao`
- `ProjProgramacaoRamal`

Essas tabelas guardam somente:

- referencia ao item tecnico
- referencia a programacao
- ordem planejada
- quantidade planejada, no caso de ramal

Elas nao guardam:

- resultado
- motivo
- pendencia
- encerramento manual
- status derivado

### Execucao

`ProjExecucao` e o cabecalho de uma ida a campo ou lote sincronizado.

Ela pode estar:

- vinculada a uma programacao
- vinculada opcionalmente a um turno

Os fatos detalhados sao:

- `ProjExecucaoPoste`
- `ProjExecucaoVao`
- `ProjExecucaoRamal`

Esses detalhes sao a verdade operacional sobre o que ocorreu em campo.

`statusGeral` no cabecalho de execucao pode existir como resumo informado, mas nunca substitui os
detalhes como fonte oficial para pendencia.

### Evidencia

`ProjEvidencia` atende tanto viabilizacao quanto execucao.

Os alvos permitidos no schema atual sao:

- `VIABILIZACAO`
- `POSTE`
- `VAO`
- `EXECUCAO`
- `EXECUCAO_POSTE`
- `EXECUCAO_VAO`
- `EXECUCAO_RAMAL`

Regra obrigatoria:

- exatamente um dono logico deve ser preenchido

Campos de dono logico possiveis:

- `viabilizacaoId`
- `posteId`
- `vaoId`
- `execucaoId`
- `execucaoPosteId`
- `execucaoVaoId`
- `execucaoRamalId`

### Historico

Os historicos continuam sendo:

- `ProjHistoricoProjeto`
- `ProjHistoricoProgramacao`

Eles servem para trilha de mudanca de estado, e nao para substituir os fatos principais.

## Status macro do projeto

O status macro aprovado para `ProjetoProgramacao` e:

- `PENDENTE`
- `EM_VIABILIZACAO`
- `AGUARDANDO_VALIDACAO`
- `EM_CORRECAO`
- `VIABILIZADO_PARCIAL`
- `VIABILIZADO_TOTAL`
- `EM_PLANEJAMENTO`
- `EM_EXECUCAO`
- `FINALIZADO`
- `CANCELADO`

Justificativa:

- `PENDENTE` cobre o cadastro administrativo ainda nao iniciado em campo
- `EM_VIABILIZACAO` cobre projeto em levantamento tecnico
- `AGUARDANDO_VALIDACAO` cobre levantamento enviado e pendente de revisao
- `EM_CORRECAO` cobre projeto cujo levantamento precisa de ajuste antes de novo aceite
- `VIABILIZADO_PARCIAL` cobre projeto com escopo parcial ja validado e elegivel para programacao
  parcial
- `VIABILIZADO_TOTAL` cobre projeto com escopo tecnico completo ja validado para o
  equipamento/projeto
- `EM_PLANEJAMENTO` cobre preparacao operacional das SIs
- `EM_EXECUCAO` cobre projeto com tentativa operacional em andamento
- `FINALIZADO` cobre projeto sem itens pendentes
- `CANCELADO` cobre encerramento administrativo sem novas programacoes, salvo regra de reabertura

## Status da programacao

O status detalhado de `ProjProgramacao` e:

- `PENDENTE`
- `PLANEJADA`
- `AVISOS_ENTREGUES`
- `DESLIGAMENTO_CONFIRMADO`
- `LIBERADA`
- `EM_EXECUCAO`
- `PARCIAL`
- `CONCLUIDA`
- `CANCELADA`

Regras importantes:

- status da programacao nao substitui status do projeto
- `PARCIAL` em programacao significa que parte do que entrou na SI nao foi resolvido
- a relacao oficial entre tentativas continua sendo `reprogramadaDeId`
- nao usar nomes alternativos como `programacaoAnteriorId`

## Transicoes de status do projeto

Fluxo canonico:

- `PENDENTE` -> `EM_VIABILIZACAO`
- `PENDENTE` -> `CANCELADO`
- `EM_VIABILIZACAO` -> `AGUARDANDO_VALIDACAO`
- `EM_VIABILIZACAO` -> `CANCELADO`
- `AGUARDANDO_VALIDACAO` -> `VIABILIZADO_PARCIAL`
- `AGUARDANDO_VALIDACAO` -> `VIABILIZADO_TOTAL`
- `AGUARDANDO_VALIDACAO` -> `EM_CORRECAO`
- `AGUARDANDO_VALIDACAO` -> `CANCELADO`
- `EM_CORRECAO` -> `EM_VIABILIZACAO`
- `EM_CORRECAO` -> `CANCELADO`
- `VIABILIZADO_PARCIAL` -> `EM_VIABILIZACAO`
- `VIABILIZADO_PARCIAL` -> `EM_PLANEJAMENTO`
- `VIABILIZADO_PARCIAL` -> `CANCELADO`
- `VIABILIZADO_TOTAL` -> `EM_PLANEJAMENTO`
- `VIABILIZADO_TOTAL` -> `CANCELADO`
- `EM_PLANEJAMENTO` -> `EM_EXECUCAO`
- `EM_PLANEJAMENTO` -> `VIABILIZADO_PARCIAL`
- `EM_PLANEJAMENTO` -> `VIABILIZADO_TOTAL`
- `EM_PLANEJAMENTO` -> `CANCELADO`
- `EM_EXECUCAO` -> `EM_PLANEJAMENTO`
- `EM_EXECUCAO` -> `VIABILIZADO_PARCIAL`
- `EM_EXECUCAO` -> `VIABILIZADO_TOTAL`
- `EM_EXECUCAO` -> `FINALIZADO`
- `EM_EXECUCAO` -> `CANCELADO`

Regras:

- `AGUARDANDO_VALIDACAO` e estado de bloqueio para programacao e para nova edicao mobile
- `EM_CORRECAO` reabre o fluxo de campo, mas preserva o escopo atual como base de continuidade
- `VIABILIZADO_PARCIAL` pode coexistir com novas rodadas de viabilizacao do escopo ainda faltante
- `FINALIZADO` so e permitido quando nao houver saldo pendente

## Transicoes de status da programacao

Fluxo detalhado esperado:

- `PENDENTE` -> `PLANEJADA`
- `PLANEJADA` -> `AVISOS_ENTREGUES`
- `PLANEJADA` -> `DESLIGAMENTO_CONFIRMADO`
- `PLANEJADA` -> `LIBERADA`
- `AVISOS_ENTREGUES` -> `DESLIGAMENTO_CONFIRMADO`
- `AVISOS_ENTREGUES` -> `LIBERADA`
- `DESLIGAMENTO_CONFIRMADO` -> `LIBERADA`
- `LIBERADA` -> `EM_EXECUCAO`
- `EM_EXECUCAO` -> `CONCLUIDA`
- `EM_EXECUCAO` -> `PARCIAL`
- `PENDENTE` -> `CANCELADA`
- `PLANEJADA` -> `CANCELADA`
- `AVISOS_ENTREGUES` -> `CANCELADA`
- `DESLIGAMENTO_CONFIRMADO` -> `CANCELADA`
- `LIBERADA` -> `CANCELADA`

Regras:

- `PARCIAL`, `CONCLUIDA` e `CANCELADA` devem ser tratados como estados terminais da SI
- nova tentativa operacional nasce como outra `ProjProgramacao`, nunca pela reutilizacao da SI
  anterior
- a relacao entre tentativas continua sendo `reprogramadaDeId`

## Resultado de execucao por item

### Poste

Resultados permitidos:

- `EXECUTADO`
- `TERCEIROS`
- `IMPEDIDO`
- `NAO_EXECUTADO`

`PARCIAL` nao existe para poste.

### Vao

Resultados permitidos:

- `EXECUTADO`
- `TERCEIROS`
- `IMPEDIDO`
- `NAO_EXECUTADO`

`PARCIAL` nao existe para vao.

### Ramal

Resultados permitidos:

- `EXECUTADO`
- `PARCIAL`
- `TERCEIROS`
- `IMPEDIDO`
- `NAO_EXECUTADO`

Aqui `PARCIAL` faz sentido porque existe saldo de quantidade.

## Contratos da API desta fase

### Leitura mobile implementada

Endpoint:

- `GET /mobile/projetos/viabilizacao`
- `GET /sync/collections/projeto-viabilizacao`

Resposta canonica por projeto:

- cabecalho administrativo do projeto
- `status` retornando apenas:
  - `PENDENTE`
  - `EM_VIABILIZACAO`
  - `EM_CORRECAO`
  - `VIABILIZADO_PARCIAL`
- `tipoViabilizacaoPendente`
- `ultimaViabilizacao`
- `ultimaValidacao`
- `escopoAtual`

Regras:

- `AGUARDANDO_VALIDACAO` nao vai para o mobile
- `VIABILIZADO_TOTAL` nao vai para o mobile
- `tipoViabilizacaoPendente = TOTAL` apenas quando ainda nao houver escopo tecnico persistido
- `tipoViabilizacaoPendente = PARCIAL` quando houver continuidade ou correcao sobre escopo ja
  existente

`escopoAtual` deve conter:

- `postes`
- `vaos`

Cada poste deve trazer:

- `id`
- `cadastroPoste`
- `viabilizacaoId`
- `validacaoId`
- `tipoPosteId`
- `latitude`
- `longitude`
- `ordem`
- `observacao`
- `estruturas`
- `ramaisPrevistos`

Cada vao deve trazer:

- `id`
- `viabilizacaoId`
- `validacaoId`
- `posteOrigemId`
- `posteDestinoId`
- `materialCondutorId`
- `observacao`

### Escrita mobile de viabilizacao

Contrato canonico a implementar:

- `POST /mobile/projetos/viabilizacao`

Request:

- `projetoId`
- `resultado` (`PARCIAL` ou `TOTAL`)
- `dataViabilizacao`
- `enviadaEm`
- `observacao`
- `postes`
- `vaos`

Cada item de `postes` deve aceitar:

- `posteRef` local do app
- `cadastroPoste.identificador`
- `cadastroPoste.numeroPoste`
- `tipoPosteId`
- `latitude`
- `longitude`
- `ordem`
- `observacao`
- `estruturas[]` com `tipoEstruturaId`
- `ramaisPrevistos[]` com `tipoRamalId` e `quantidadePrevista`

Cada item de `vaos` deve aceitar:

- `posteOrigemRef`
- `posteDestinoRef`
- `materialCondutorId`
- `observacao`

Response:

- `viabilizacaoId`
- `statusProjeto = AGUARDANDO_VALIDACAO`
- mapa `posteRef -> posteId`
- mapa logico dos vaos persistidos

Decisao:

- fotos nao entram nesse payload principal
- as fotos sobem depois pelo modulo generico de upload

### Upload tardio de evidencias de poste

Contrato canonico ja preparado:

- `POST /upload`
- `type = projeto-viabilizacao-poste`

Campos minimos:

- `entityId = projPosteId`
- `ownerRef = posteRef` opcional para rastreabilidade
- `clientPhotoId` opcional

Efeito esperado:

- gravar `UploadEvidence`
- gravar `UploadEvidenceLink`
- criar `ProjEvidencia` vinculada ao poste/viabilizacao/projeto

### Comando de validacao/correcao no backoffice

Contrato canonico a implementar no backend do backoffice:

- comando/endpoint de validacao da viabilizacao

Request:

- `projetoId`
- `viabilizacaoId`
- `resultado` (`APROVADA`, `CORRIGIDA` ou `REJEITADA`)
- `validadaEm`
- `observacao`
- `postesAprovadosIds`
- `vaosAprovadosIds`

Regras:

- `ProjPosteEstrutura` e `ProjPosteRamal` herdam a aprovacao do `ProjPoste`
- a camada web pode corrigir o escopo tecnico atual antes de gravar a validacao
- ao final, o projeto deve ir para `VIABILIZADO_PARCIAL`, `VIABILIZADO_TOTAL` ou `EM_CORRECAO`

## Casos de uso principais

## Caso 1: cadastrar projeto administrativamente

Objetivo:

- criar o projeto administrativo

Fluxo:

1. usuario cria `ProjetoProgramacao`
2. informa contrato, numero do projeto, descricao, equipamento e municipio
3. projeto nasce em `PENDENTE`

Importante:

- nesta fase o cadastro do projeto nao precisa carregar escopo tecnico completo
- o escopo tecnico sera levantado na viabilizacao

## Caso 2: iniciar e concluir viabilizacao

Objetivo:

- registrar o levantamento tecnico em campo

Fluxo:

1. mobile seleciona um projeto
2. projeto pode ir para `EM_VIABILIZACAO`
3. mobile envia um `ProjViabilizacao`
4. o envio informa `PARCIAL` ou `TOTAL`
5. sistema grava os fatos tecnicos levantados:
   - `ProjCadastroPoste`
   - `ProjPoste`
   - `ProjPosteEstrutura`
   - `ProjPosteRamal`
   - `ProjVao`, quando houver dados suficientes
6. sistema grava evidencias de viabilizacao em `ProjEvidencia`
7. projeto evolui para `AGUARDANDO_VALIDACAO`
8. se o projeto ja tinha escopo parcial anterior, a API deve devolver ao mobile o escopo tecnico
   atual acumulado para continuidade do levantamento

Campos esperados na viabilizacao:

- identificador interno do poste
- foto proxima ao poste
- GPS
- numero do poste da distribuidora
- estruturas do poste
- quantidade de ramais por tipo
- observacoes
- vaos, quando houver conectividade suficiente entre dois postes ja levantados
- um unico material condutor por vao

## Caso 2B: validar ou corrigir viabilizacao

Objetivo:

- revisar o levantamento antes de liberar programacao

Fluxo:

1. backoffice abre a viabilizacao enviada
2. analisa fotos, GPS, postes, estruturas, ramais e vaos
3. se necessario, corrige o escopo tecnico atual
4. sistema grava um `ProjValidacaoViabilizacao`
5. sistema atualiza `validacaoId` nos itens tecnicos aprovados na versao atual do escopo
6. projeto pode evoluir para:
   - `VIABILIZADO_PARCIAL`, quando o escopo validado ainda nao e completo
   - `VIABILIZADO_TOTAL`, quando o escopo validado ja e completo
   - `EM_CORRECAO`, quando o levantamento precisa de novo ajuste em campo
7. quando houver `EM_CORRECAO`, o mobile deve receber o escopo tecnico atual e a observacao da
   ultima validacao para orientar o retorno a campo

## Caso 3: programar projeto parcial ou totalmente viabilizado

Objetivo:

- criar uma SI com subconjunto do escopo levantado

Fluxo:

1. usuario cria `ProjProgramacao`
2. informa `siNumero`, data programada e observacoes
3. sistema seleciona apenas itens tecnicos ja levantados no projeto
4. usuario escolhe os itens que entrarao na SI
5. sistema grava os vinculos em:
   - `ProjProgramacaoPoste`
   - `ProjProgramacaoVao`
   - `ProjProgramacaoRamal`

Regras:

- projeto `VIABILIZADO_PARCIAL` so pode programar itens existentes no escopo levantado e validados
- projeto `VIABILIZADO_TOTAL` pode programar qualquer item do escopo completo validado
- a programacao nao cria item tecnico novo

## Caso 4: cancelar programacao

Objetivo:

- encerrar tentativa sem confundir isso com encerramento do projeto

Fluxo:

1. usuario cancela a programacao
2. informa motivo e observacao
3. sistema muda `ProjProgramacao.status` para `CANCELADA`
4. itens continuam pendentes por consulta

## Caso 5: gerar lista de materiais para requisicao

Objetivo:

- derivar necessidade de materiais a partir da SI

Base de calculo:

- postes programados -> estruturas do poste -> `ProjTipoEstruturaMaterial`
- ramais programados -> `ProjTipoRamalMaterial`
- vaos programados -> `ProjVao.materialCondutorId` + distancia derivada pelos GPS dos postes

Regra conceitual:

- a lista de materiais nao e tabela de dominio autoritativa
- ela deve ser derivada por consulta a partir da programacao e do escopo tecnico

Recomendacao de calculo:

- a metragem do vao nao deve ser persistida como fonte oficial
- a aplicacao mobile pode calcular localmente para orientar o usuario
- o backend/web recalcula pela coordenada dos dois postes do projeto
- aplicar regras de arredondamento/perda apenas na camada de negocio/leitura

## Caso 6: executar itens em campo

Objetivo:

- registrar o fato operacional ocorrido

Fluxo:

1. mobile sincroniza `ProjExecucao`
2. sistema registra os detalhes:
   - `ProjExecucaoPoste`
   - `ProjExecucaoVao`
   - `ProjExecucaoRamal`
3. cada detalhe guarda resultado, motivo, observacao e quantidade/metragem real quando aplicavel

## Caso 7: registrar nao execucao ou impedimento

Objetivo:

- manter o historico da tentativa sem perder o item para reprogramacao

Fluxo:

1. item entrou na SI
2. equipe foi a campo
3. item ficou `IMPEDIDO` ou `NAO_EXECUTADO`
4. sistema grava o detalhe de execucao com motivo
5. item continua pendente por consulta

## Caso 8: registrar terceiros

Objetivo:

- marcar o item como resolvido operacionalmente sem producao propria

Fluxo:

1. equipe encontra item resolvido por terceiros
2. sistema grava `TERCEIROS` no detalhe de execucao
3. item deixa de ser pendente
4. item nao entra como producao propria

## Caso 9: reprogramar

Objetivo:

- criar nova tentativa a partir do que continua em aberto

Fluxo:

1. sistema consulta pendencias do projeto
2. usuario seleciona o subconjunto reprogramavel
3. sistema cria nova `ProjProgramacao`
4. a nova programacao pode apontar para `reprogramadaDeId`

Importante:

- nao existe tabela de fila persistida
- reprogramacao e uma projection de leitura sobre escopo + historico

## Caso 10: finalizar projeto

Objetivo:

- encerrar o projeto quando nao houver mais saldo pendente

Fluxo:

1. sistema verifica pendencias de poste, vao e ramal
2. se nao houver item pendente, projeto pode ir para `FINALIZADO`
3. se houver cancelamento administrativo, projeto pode ir para `CANCELADO`

## Regras de integridade obrigatorias

## Projeto

- projeto so pode ser `FINALIZADO` quando nao houver item pendente
- projeto `CANCELADO` nao aceita nova programacao sem regra explicita de reabertura
- `AGUARDANDO_VALIDACAO` nao deve liberar programacao
- `EM_CORRECAO` nao deve liberar programacao, mas continua elegivel para nova viabilizacao
- `VIABILIZADO_TOTAL` so pode ser usado quando o escopo exigido tiver sido levantado
- `VIABILIZADO_PARCIAL` pode receber programacao apenas dos itens ja existentes no escopo e
  validados

## Viabilizacao

- `ProjViabilizacao.resultado` deve ser `PARCIAL` ou `TOTAL`
- `ProjCadastroPoste.identificador` deve ser estavel e unico por contrato
- `ProjCadastroPoste.numeroPoste` deve ser unico por contrato
- poste e vao levantados podem guardar `viabilizacaoId` para procedencia
- poste e vao aprovados para programacao podem guardar `validacaoId` para procedencia de validacao
- estrutura e ramal previsto nao recebem status individual de viabilizacao
- `ProjVao.materialCondutorId` deve ser coerente com o contrato do projeto
- `ProjVao` deve ligar exatamente dois postes distintos do mesmo projeto
- a API deve normalizar a ordem dos extremos do vao antes de persistir para evitar duplicidade
  invertida

## Validacao da viabilizacao

- `ProjValidacaoViabilizacao` deve apontar para viabilizacao do mesmo projeto
- `APROVADA` e `CORRIGIDA` liberam os itens cuja versao atual recebeu `validacaoId`
- `REJEITADA` nao libera programacao
- quando a viabilizacao parcial ou em correcao for retomada no mobile, a API deve devolver o escopo
  tecnico atual ja persistido para continuidade
- `AGUARDANDO_VALIDACAO` nao deve voltar ao mobile como projeto editavel

## Programacao

- SI pertence a programacao
- cancelamento exige motivo
- `reprogramadaDeId` so pode apontar para programacao do mesmo projeto

## Item planejado

- item planejado deve pertencer ao mesmo projeto da programacao
- `ProjProgramacaoRamal` deve respeitar `ProjPosteRamal`
- `quantidadePlanejada` de ramal nao pode ultrapassar o saldo programavel, salvo regra explicita

## Execucao

- execucao vinculada a programacao deve apontar para itens do mesmo projeto
- `PARCIAL` e proibido para poste e vao
- motivo e obrigatorio para `NAO_EXECUTADO` e `IMPEDIDO`
- `quantidadeExecutada` nao pode ser negativa
- `caboExecutadoMetros` nao pode ser negativo

## Evidencia

- evidencia deve ter exatamente um dono logico
- `alvoTipo` deve ser coerente com exatamente um FK preenchido
- a API deve rejeitar payload com zero ou mais de um alvo preenchido

## O que propositalmente nao existe no modelo

Estas ausencias sao intencionais:

- nao existe `ProjFilaProgramacao`
- nao existe status atual persistido em poste, vao ou ramal previsto
- nao existe backlog persistido de reprogramacao
- nao existe lista oficial persistida de materiais por SI
- nao existe snapshot autoritativo do progresso por item tecnico
- nao existe contador oficial de vezes programado ou vezes executado

Tudo isso deve ser derivado.

## Como derivar pendencias

## Pendencia de poste

Resultados terminais:

- `EXECUTADO`
- `TERCEIROS`

Resultados nao terminais:

- `IMPEDIDO`
- `NAO_EXECUTADO`

## Pendencia de vao

Resultados terminais:

- `EXECUTADO`
- `TERCEIROS`

Resultados nao terminais:

- `IMPEDIDO`
- `NAO_EXECUTADO`

## Pendencia de ramal

Definicao:

- ramal segue pendente enquanto houver saldo entre quantidade prevista e quantidade resolvida

Formula conceitual:

- `saldo = quantidadePrevista - soma(quantidadeExecutada resolvida)`

## Como derivar materiais

## Estruturas

Para cada poste programado:

1. localizar `ProjPosteEstrutura`
2. resolver `ProjTipoEstrutura`
3. aplicar `ProjTipoEstruturaMaterial`
4. agregar por material

Observacao:

- como `ProjTipoEstrutura` e vinculado ao contrato, a composicao da estrutura ja nasce coerente com
  o contrato

## Ramais

Para cada `ProjProgramacaoRamal`:

1. localizar a quantidade planejada
2. aplicar `ProjTipoRamalMaterial`
3. multiplicar pelos fatores da composicao
4. agregar por material

## Vaos

Para cada `ProjProgramacaoVao`:

1. localizar `ProjVao.materialCondutorId`
2. calcular a distancia entre `ProjPoste` origem e destino usando GPS
3. somar a metragem por material

Base de metragem:

- distancia geodesica entre `ProjPoste.latitude/longitude` de origem e destino
- se a regra de negocio exigir fator tecnico, aplicar em leitura, nao no fato persistido

## Como derivar reprogramacao

A lista de reprogramacao deve ser derivada por consulta sobre:

- itens nunca programados
- itens programados e ainda nao resolvidos
- itens de programacoes canceladas
- ramais com saldo residual
- itens com ultimo resultado `IMPEDIDO` ou `NAO_EXECUTADO`

Campos uteis para a projection:

- item
- tipo do item
- ultima programacao
- ultima SI
- ultimo resultado
- ultimo motivo
- saldo residual ou metragem pendente
- origem da pendencia

## Como derivar progresso do projeto

O projeto nao deve guardar percentual consolidado como verdade.

Indicadores recomendados:

- postes totais
- postes resolvidos
- postes pendentes
- vaos totais
- vaos resolvidos
- vaos pendentes
- ramais previstos
- ramais resolvidos
- ramais pendentes
- quantidade de viabilizacoes
- quantidade de programacoes

Tambem e importante separar:

- resolucao operacional
- producao propria

## Arquitetura recomendada

## Banco

Responsabilidade:

- persistir fatos
- garantir chaves e relacionamentos
- evitar redundancia estrutural

## API

Responsabilidade:

- aplicar regras de negocio
- validar coerencia entre viabilizacao, programacao, execucao e evidencia
- expor queries de leitura para pendencia, reprogramacao, historico e materiais

Validacoes obrigatorias:

- manter consistencia de nomenclatura usando `reprogramadaDeId`
- validar que `reprogramadaDeId`, quando informado, aponta para programacao do mesmo projeto
- validar coerencia de `alvoTipo` com exatamente um FK em `ProjEvidencia`
- bloquear `FINALIZADO` quando houver pendencia
- bloquear programacao de item inexistente no escopo levantado
- bloquear `PARCIAL` para poste e vao

## Mobile

Responsabilidade:

- capturar viabilizacao e execucao
- funcionar offline-first
- enviar payload idempotente

## Web

Responsabilidade:

- manter cadastro administrativo do projeto
- consultar escopo levantado
- criar programacoes
- consultar pendencias
- gerar leitura de materiais por programacao
- visualizar historico operacional

## Queries essenciais

Estas leituras precisam existir:

- resumo do projeto
- resumo de viabilizacao do projeto
- itens elegiveis para programacao
- pendencias por projeto
- itens elegiveis para reprogramacao
- historico de programacoes
- execucoes por programacao
- comparativo entre programado e executado
- lista de materiais derivada da programacao
- detalhamento de evidencias por viabilizacao, execucao e item

## Implementacao restante prioritaria

Para fechar o modulo da fase atual, a sequencia recomendada e:

1. endpoint de escrita da viabilizacao mobile
2. endpoint/servico de validacao e correcao da viabilizacao
3. leitura web do escopo tecnico atual com evidencias
4. CRUD de programacao com selecao apenas de itens validados
5. endpoint de escrita de execucao
6. queries derivadas de pendencia, reprogramacao e materiais

Dependencias importantes:

- programacao depende da validacao
- materiais dependem da programacao e das composicoes ja existentes
- reprogramacao depende do historico de execucao, nao de fila persistida

## Decisoes fechadas

- SI pertence a programacao
- projeto tem status macro
- programacao tem status detalhado
- o projeto nasce administrativo e depende de viabilizacao tecnica
- viabilizacao pode ser parcial ou total
- apos cada envio de viabilizacao existe validacao/correcao
- apenas escopo validado libera programacao
- `reprogramadaDeId` e o nome oficial da relacao entre programacoes
- `ProjetoProgramacao` continua sendo o nome da entidade principal nesta fase
- itens programados nao guardam resultado
- execucao guarda motivo e resultado
- pendencia e derivada por consulta
- reprogramacao e derivada por consulta
- fotos de poste podem subir depois por upload assíncrono
- `PARCIAL` nao existe para poste
- `PARCIAL` nao existe para vao
- `PARCIAL` em item individual existe apenas para ramal
- lista de materiais para requisicao e derivada da programacao

## Arquivos relacionados

- `packages/db/prisma/models/projetos.prisma`
- `packages/db/prisma/models/atividade.prisma`
- `docs/10-contrato-mobile-projetos-viabilizacao.md`
- `docs/01-arquitetura-monorepo.md`
- `docs/03-guia-criacao-modulo-api.md`
