# Projetos e Programacoes Operacionais

## Objetivo

Este documento descreve o desenho funcional e arquitetural do modulo de projetos/programacoes
operacionais da operacao de rede eletrica/distribuicao.

Ele deve servir como:

- guia de modelagem de banco
- guia de implementacao da API
- guia de implementacao do mobile
- guia de implementacao do backoffice web
- referencia para discussoes futuras de medicao/faturamento

Este documento assume como base o schema atual em:

- `packages/db/prisma/models/projetos.prisma`

## Escopo desta fase

Nesta fase, o foco e modelar corretamente os fatos de negocio no banco.

O principio central aprovado e:

- o banco grava fatos
- analise, pendencia, fila de reprogramacao, progresso e indicadores sao derivados por consulta

Isso significa que o modelo evita:

- fila persistida como fonte de verdade
- contadores pre-calculados
- snapshots operacionais autoritativos em item tecnico

## Resumo do dominio

O processo real e este:

1. Existe um projeto tecnico/operacional.
2. O projeto contem itens fisicos executaveis.
3. Os principais itens sao postes, vaos e ramais previstos.
4. O projeto entra em planejamento.
5. Depois sao feitas programacoes com a distribuidora.
6. Cada programacao possui sua propria SI.
7. Cada programacao seleciona um subconjunto de itens do projeto.
8. Em campo, a equipe executa, nao executa ou encontra item resolvido por terceiros.
9. A parcial existe no conjunto dos itens programados e, para ramal, no saldo de quantidade
   executada. Ela nao existe no poste ou vao individual.
10. O que sobrar em aberto entra na proxima programacao por consulta, nao por fila manual.
11. O projeto so e considerado operacionalmente fechado quando nao houver item pendente no
    escopo e todo item tiver registro operacional de execucao/resolucao. Quando a regra exigir,
    isso inclui evidencia anexada.

## Conceitos principais

### Projeto

`Projeto` e o agregado principal.

Ele representa:

- contrato
- numero do projeto
- municipio
- concessionaria
- equipamento
- escopo tecnico associado

O projeto nao carrega a SI.

O projeto nao carrega o detalhe operacional de cada tentativa.

O projeto tem status macro:

- `PENDENTE`
- `EM_PLANEJAMENTO`
- `EM_EXECUCAO`
- `FINALIZADO`
- `CANCELADO`

### Programacao

`Programacao` representa uma tentativa operacional de execucao do projeto junto a distribuidora.

A programacao possui:

- SI
- data programada
- status proprio
- marcos operacionais
- itens incluidos naquela tentativa
- motivo de cancelamento, se houver
- encadeamento com programacao anterior, se for reprogramacao

Status da programacao:

- `PENDENTE`
- `PLANEJADA`
- `AVISOS_ENTREGUES`
- `DESLIGAMENTO_CONFIRMADO`
- `LIBERADA`
- `EM_EXECUCAO`
- `PARCIAL`
- `CONCLUIDA`
- `CANCELADA`

Importante:

- status da programacao nao deve ser confundido com status do projeto
- `PARCIAL` na programacao significa que parte dos itens previstos ficou em aberto
- a relacao de reprogramacao usa o nome `reprogramadaDeId` em banco, API e interface
- os booleans `viabilizado`, `avisosEntregues`, `desligamentoNecessario` e `desligamentoConfirmado`
  sao marcos operacionais
- os booleans nao substituem o status

### Convencoes de nome

Para evitar drift entre banco, API, web e mobile, estas convencoes devem ser mantidas:

- o campo oficial de encadeamento entre programacoes e `reprogramadaDeId`
- nao introduzir nomes alternativos como `programacaoAnteriorId`, `origemProgramacaoId` ou similares
- a entidade principal do projeto segue como `ProjetoProgramacao` nesta fase
- se houver futura simplificacao de nomenclatura, ela deve acontecer como refactor global, nao de forma parcial

### SI

A `SI` pertence a `Programacao`.

Ela nao pertence ao `Projeto`.

Uma nova programacao ou reprogramacao gera nova SI.

### Escopo tecnico

O escopo tecnico do projeto e composto por:

- `ProjPoste`
- `ProjVao`
- `ProjPosteEstrutura`
- `ProjPosteRamal`

Interpretacao:

- `ProjPoste` e o poste fisico do projeto
- `ProjVao` e a ligacao entre postes
- `ProjTipoEstrutura` e o cadastro padrao de estruturas
- `ProjPosteEstrutura` define as estruturas previstas naquele poste
- `ProjPosteRamal` define a previsao agregada de ramais por tipo naquele poste

### Item programado

Um item programado e um item do escopo que entrou em uma SI.

No banco isso aparece em:

- `ProjProgramacaoPoste`
- `ProjProgramacaoVao`
- `ProjProgramacaoRamal`

Essas tabelas devem guardar apenas:

- o vinculo do item com a programacao
- a ordem planejada, quando houver
- a quantidade planejada de ramal

Elas nao devem guardar:

- resultado da execucao
- motivo de nao execucao
- encerramento manual
- status atual derivado

### Execucao

`ProjExecucao` e o cabecalho de uma ida a campo ou lote de execucao sincronizado.

Ela pode estar:

- vinculada a uma programacao
- opcionalmente vinculada a um turno

Os fatos detalhados sao registrados em:

- `ProjExecucaoPoste`
- `ProjExecucaoVao`
- `ProjExecucaoRamal`

Essas tabelas sao a verdade operacional sobre o que aconteceu com cada item.

### Resultado de execucao

Para `Poste` e `Vao`, o resultado permitido e:

- `EXECUTADO`
- `TERCEIROS`
- `IMPEDIDO`
- `NAO_EXECUTADO`

`PARCIAL` foi removido de poste e vao porque, no dominio atual, ambos sao tratados como itens
integrais.

Para `Ramal`, o resultado permitido e:

- `EXECUTADO`
- `PARCIAL`
- `TERCEIROS`
- `IMPEDIDO`
- `NAO_EXECUTADO`

### Pendencia

Neste desenho, pendencia nao e tabela.

Pendencia e resultado de consulta.

Um item pendente e um item ainda nao resolvido terminalmente.

## Casos de uso principais

## Caso 1: cadastrar/importar projeto

Objetivo:

- criar o projeto
- gravar o escopo tecnico inicial

Fluxo:

1. usuario importa ou cadastra projeto
2. sistema cria `ProjetoProgramacao`
3. sistema grava postes, vaos, estruturas e ramais previstos
4. sistema coloca projeto em `PENDENTE` ou `EM_PLANEJAMENTO`

Regras:

- numero do projeto deve ser unico por contrato
- poste deve ser unico por `projetoId + numeroIdentificacao`
- ramal previsto deve ser unico por `poste + tipoRamal`

## Caso 2: planejar projeto

Objetivo:

- completar ou revisar dados operacionais antes da primeira SI

Fluxo:

1. equipe de planejamento revisa projeto
2. atualiza observacoes, ordenacao, dados complementares
3. projeto fica `EM_PLANEJAMENTO`

Observacao:

- versao tecnica do projeto ainda nao esta modelada nesta fase
- se houver revisoes frequentes de KMZ, este sera um proximo passo importante

## Caso 3: criar programacao

Objetivo:

- selecionar parte do escopo do projeto para uma SI

Fluxo:

1. usuario cria `ProjProgramacao`
2. informa SI, data, marcos operacionais e observacoes
3. escolhe os itens do projeto que entrarao na tentativa
4. sistema grava os vinculos em `ProjProgramacaoPoste`, `ProjProgramacaoVao` e
   `ProjProgramacaoRamal`

Regras:

- a programacao representa uma tentativa operacional
- item planejado nao deve gravar resultado
- `reprogramadaDeId` deve ser preenchido quando a tentativa nasce de outra programacao

## Caso 4: cancelar programacao antes do campo

Objetivo:

- encerrar uma tentativa sem gerar execucao

Fluxo:

1. usuario cancela a programacao
2. informa motivo e observacao
3. sistema muda `ProjProgramacao.status` para `CANCELADA`
4. os itens continuam pendentes por consulta

Importante:

- cancelamento antes do campo nao cria `ProjExecucao*`
- os itens nao saem do escopo
- eles apenas permanecem elegiveis para futura programacao

## Caso 5: executar item em campo

Objetivo:

- registrar o fato real ocorrido em campo

Fluxo:

1. app mobile sincroniza um cabecalho de execucao
2. sistema cria `ProjExecucao`
3. para cada item operado, cria o detalhe correspondente
4. opcionalmente vincula o detalhe ao item planejado da programacao

Campos relevantes:

- resultado
- motivo de ocorrencia
- observacao
- quantidade executada, no caso de ramal
- cabo executado em metros, no caso de vao/ramal

## Caso 6: registrar nao execucao

Objetivo:

- manter historico da tentativa que falhou sem perder o item para reprogramacao

Fluxo:

1. item entrou na programacao
2. equipe foi a campo
3. item nao foi executado
4. sistema grava `ProjExecucaoPoste/Vao/Ramal` com `NAO_EXECUTADO` ou `IMPEDIDO`
5. o item continua pendente por consulta

Regra:

- o motivo da nao execucao pertence ao fato de execucao, nao ao item planejado

## Caso 7: registrar parcial

Objetivo:

- registrar que a programacao nao resolveu todos os itens previstos
- registrar saldo residual de ramal quando a quantidade executada for menor que a planejada

No desenho atual:

- `PARCIAL` faz sentido no status da `Programacao`
- `PARCIAL` faz sentido no `statusGeral` da `ProjExecucao`
- `PARCIAL` faz sentido em `Ramal`
- `PARCIAL` nao existe em `Poste`
- `PARCIAL` nao existe em `Vao`

Ramal:

- `quantidadeExecutada` registra o que foi resolvido naquela tentativa
- o saldo remanescente continua pendente

Vao:

- `caboExecutadoMetros` registra a metragem realizada no vao executado
- se o vao nao foi executado, o resultado deve ser `NAO_EXECUTADO` ou `IMPEDIDO`
- o fato de a programacao ter deixado vaos pendentes fica no agregado da programacao/execucao, nao
  no resultado do vao individual

## Caso 8: item ja executado por terceiros

Objetivo:

- resolver o item operacionalmente, sem gerar producao propria

Fluxo:

1. equipe encontra item resolvido por terceiros
2. sistema grava `TERCEIROS` no detalhe de execucao
3. item deixa de ser pendente
4. item nao entra como producao propria para medicao futura

Observacao:

- evidencia pode existir ou nao
- esse caso deve ser aceito pela regra de negocio

## Caso 9: reprogramar itens pendentes

Objetivo:

- criar nova tentativa a partir do que segue em aberto

Fluxo:

1. usuario abre a tela de reprogramacao
2. sistema consulta itens pendentes do projeto
3. usuario seleciona total ou parcialmente os pendentes
4. sistema cria nova `ProjProgramacao`
5. nova programacao pode apontar para `reprogramadaDeId`

Importante:

- nao existe tabela de fila como fonte de verdade
- a lista de reprogramar e derivada por consulta

## Caso 10: fechar projeto

Objetivo:

- encerrar o projeto quando todo o escopo estiver resolvido

Fluxo:

1. sistema verifica se ainda existe item pendente
2. se nao houver, projeto pode ir para `FINALIZADO`
3. se houver cancelamento administrativo, projeto pode ir para `CANCELADO`

Observacao:

- `FINALIZADO` nao significa necessariamente "100% executado por nos"
- pode haver combinacao de `EXECUTADO` e `TERCEIROS`
- o fechamento exige que o escopo inteiro tenha registro operacional de execucao/resolucao

## Caso 11: analise operacional

Objetivo:

- extrair indicadores sem poluir o modelo transacional

Exemplos:

- quantos postes foram programados no projeto
- quantos postes foram executados
- quantos postes nao executaram em cada SI
- quantos vaos seguem pendentes
- quantos ramais previstos ainda faltam
- principais motivos de cancelamento
- principais motivos de nao execucao
- historico das programacoes

Esses dados devem sair de consulta, nao de campos persistidos de resumo.

## Modelo de dados atual

## Catalogos

- `ProjTipoPoste`
- `ProjTipoEstrutura`
- `ProjTipoRamal`
- `ProjMotivoOcorrencia`
- `ProjTipoEstruturaMaterial`
- `ProjTipoRamalMaterial`

Responsabilidade:

- padronizar tipos tecnicos
- padronizar composicoes por contrato
- padronizar catalogo de motivos

## Projeto e escopo

- `ProjetoProgramacao`
- `ProjPoste`
- `ProjPosteEstrutura`
- `ProjPosteRamal`
- `ProjVao`

Responsabilidade:

- representar o escopo base do projeto
- nunca representar tentativa operacional

## Programacao

- `ProjProgramacao`
- `ProjProgramacaoPoste`
- `ProjProgramacaoVao`
- `ProjProgramacaoRamal`

Responsabilidade:

- representar a SI/tentativa
- representar o subconjunto de itens que entrou naquela tentativa

## Execucao

- `ProjExecucao`
- `ProjExecucaoPoste`
- `ProjExecucaoVao`
- `ProjExecucaoRamal`

Responsabilidade:

- representar o que aconteceu de fato em campo
- guardar motivo, observacao, resultado e metragens/quantidades reais

## Evidencia

- `ProjEvidencia`

Responsabilidade:

- guardar anexo vinculado a uma execucao ou detalhe de execucao

Regra obrigatoria de backend:

- `alvoTipo` deve ser coerente com exatamente um FK preenchido
- `EXECUCAO` usa `execucaoId`
- `EXECUCAO_POSTE` usa `execucaoPosteId`
- `EXECUCAO_VAO` usa `execucaoVaoId`
- `EXECUCAO_RAMAL` usa `execucaoRamalId`
- a API deve validar que exatamente um entre `execucaoId`, `execucaoPosteId`, `execucaoVaoId`,
  `execucaoRamalId` esteja preenchido
- a API deve rejeitar payload com mais de um alvo preenchido
- a API deve rejeitar payload sem alvo preenchido

## Historico

- `ProjHistoricoProjeto`
- `ProjHistoricoProgramacao`

Responsabilidade:

- trilha de transicao de status
- auditoria de mudanca de estado

## O que propositalmente nao existe no modelo

Estas ausencias sao intencionais:

- nao existe `ProjFilaProgramacao`
- nao existe `statusAtual` em poste, vao ou ramal previsto
- nao existe contador de "vezes executou"
- nao existe contador de "vezes programou"
- nao existe percentuais consolidados por item

Todos esses dados devem ser derivados.

## Regras de negocio que precisam existir no backend

## Integridade de projeto

- projeto so pode ser `FINALIZADO` quando nao houver item pendente
- projeto `CANCELADO` nao deve aceitar nova programacao sem regra explicita de reabertura

## Integridade de programacao

- `SI` pertence a programacao
- cancelamento exige motivo
- `reprogramadaDeId` so pode apontar para programacao do mesmo projeto

## Integridade de item planejado

- item planejado deve pertencer ao mesmo projeto da programacao
- `ProjProgramacaoRamal` deve respeitar o `ProjPosteRamal` existente

## Integridade de execucao

- execucao vinculada a programacao deve apontar para itens do mesmo projeto
- resultado `PARCIAL` nao e permitido para poste nem vao
- motivo de ocorrencia deve ser obrigatorio para `NAO_EXECUTADO` e `IMPEDIDO`
- `quantidadeExecutada` de ramal nao pode ser negativa
- `caboExecutadoMetros` nao pode ser negativo

## Integridade de evidencia

- evidencia deve ter um unico dono logico
- evidencia nao deve ficar solta sem alvo coerente

## Regras obrigatorias de transicao de status

Estas regras devem ser tratadas como contrato minimo de implementacao:

- projeto nao vai para `FINALIZADO` se houver item pendente
- programacao `CANCELADA` nao aceita execucao posterior sem regra explicita de reabertura
- execucao vinculada a item planejado deve ser do mesmo projeto
- `PARCIAL` e proibido para `Poste` e `Vao`
- motivo de ocorrencia e obrigatorio para `NAO_EXECUTADO` e `IMPEDIDO`

## Como derivar pendencias

## Pendencia de poste

Definicao operacional:

- poste esta pendente se nao existir resultado terminal para ele

Resultados terminais de poste:

- `EXECUTADO`
- `TERCEIROS`

Resultados nao terminais:

- `IMPEDIDO`
- `NAO_EXECUTADO`

## Pendencia de vao

Definicao operacional:

- vao esta pendente se nao existir resultado terminal para ele

Resultados terminais de vao:

- `EXECUTADO`
- `TERCEIROS`

Resultados nao terminais:

- `IMPEDIDO`
- `NAO_EXECUTADO`

## Pendencia de ramal

Definicao operacional:

- ramal esta pendente enquanto houver saldo entre quantidade prevista e quantidade resolvida

Regra recomendada:

- `quantidadeExecutada` deve representar a quantidade resolvida naquela ocorrencia, mesmo quando o
  resultado for `TERCEIROS`
- faturamento futuro filtra pelo resultado, nao pela existencia de quantidade

Formula conceitual:

- `saldo = quantidadePrevista - soma(quantidadeExecutada considerada resolvida)`

Enquanto `saldo > 0`, o ramal segue pendente.

## Como derivar listas de reprogramacao

A tela de reprogramacao deve ser uma consulta sobre o escopo.

Ela deve unir:

- itens nunca programados
- itens programados e ainda nao resolvidos
- itens com historico de nao execucao
- ramais com saldo parcial
- itens de programacoes canceladas que permaneceram em aberto

Colunas uteis para a view:

- item
- tipo do item
- ultima programacao
- ultima SI
- ultimo resultado
- ultimo motivo
- quantidade/metragem pendente, quando aplicavel
- origem da pendencia

`origem da pendencia` pode ser derivada como:

- `NUNCA_PROGRAMADO`
- `CANCELADA`
- `NAO_EXECUTADO`
- `IMPEDIDO`
- `PARCIAL` para saldo residual de ramal

## Como derivar progresso do projeto

O projeto nao deve guardar percentual unico de progresso como verdade.

O ideal e expor indicadores separados:

- postes totais
- postes resolvidos
- postes pendentes
- vaos totais
- vaos resolvidos
- vaos pendentes
- ramais previstos
- ramais resolvidos
- ramais pendentes

Tambem e importante separar:

- resolucao operacional
- producao propria

Exemplo:

- um item `TERCEIROS` pode contar como resolvido operacionalmente
- o mesmo item nao conta como producao propria

## Como derivar aptidao para faturamento

Nesta fase, faturamento ainda nao e modulo fechado.

Mesmo assim, a regra conceitual fica:

- projeto apto para faturamento quando nao houver item pendente no escopo

No futuro, podem existir filtros adicionais:

- evidencias obrigatorias presentes
- validacao de supervisor
- consistencia de metragem/quantidade
- composicao vigente por contrato

## Arquitetura recomendada

## Filosofia de implementacao

- escrita simples e fiel ao fato
- leitura rica por query/projecao
- sem duplicar estado derivado em varias tabelas

## Camadas

### Banco

Responsabilidade:

- persistir fatos
- garantir chaves e relacionamentos
- evitar redundancia estrutural

### API

Responsabilidade:

- aplicar regras de negocio
- validar coerencia entre programacao, execucao e evidencias
- expor queries de analise e listas operacionais

Validacoes obrigatorias na API:

- manter consistencia de nomenclatura usando `reprogramadaDeId`
- validar que `reprogramadaDeId`, quando informado, aponta para programacao do mesmo projeto
- validar que evidencia tenha exatamente um dono logico coerente com `alvoTipo`
- bloquear execucao de programacao cancelada, salvo fluxo explicito de reabertura
- bloquear `FINALIZADO` quando houver pendencia

### Mobile

Responsabilidade:

- capturar execucao e evidencia
- funcionar offline-first
- sincronizar via payload idempotente

### Web

Responsabilidade:

- criar/manter projeto
- montar programacao
- consultar pendencias
- visualizar historico e analises

## Escrita x leitura

Recomendacao:

- o modulo transacional grava apenas fatos
- consultas de backlog, historico e indicadores podem virar views SQL, queries dedicadas ou
  endpoints de leitura

## Queries essenciais do modulo

Estas consultas precisam existir para o modulo ser operacional:

- resumo do projeto
- pendencias por projeto
- itens elegiveis para reprogramacao
- historico de programacoes do projeto
- execucoes por programacao
- itens executados por terceiros
- motivos mais frequentes de nao execucao
- motivos mais frequentes de cancelamento
- comparativo entre programado e executado
- detalhamento de evidencias por execucao e por item

Descricao esperada de cada consulta:

- `resumo do projeto`: totais, resolvidos, pendentes, quantidade de programacoes e status macro
- `pendencias por projeto`: itens ainda nao resolvidos, com ultima tentativa, ultimo motivo e origem da pendencia
- `itens elegiveis para reprogramacao`: subconjunto de pendencias que pode entrar em nova SI
- `historico de programacoes do projeto`: cadeia de tentativas, SI, status, cancelamentos e `reprogramadaDeId`
- `execucoes por programacao`: o que foi executado, nao executado, impedido ou resolvido por terceiros em cada tentativa
- `itens executados por terceiros`: lista para acompanhamento operacional sem producao propria
- `motivos mais frequentes de nao execucao`: agregacao analitica por motivo
- `motivos mais frequentes de cancelamento`: agregacao analitica por motivo
- `comparativo entre programado e executado`: visao de aderencia entre o que entrou na SI e o que foi resolvido
- `detalhamento de evidencias por execucao e por item`: suporte a auditoria, validacao e rastreabilidade

## Regras para sync mobile

- payload deve ser idempotente
- repeticao de envio nao pode duplicar execucao
- detalhes de execucao devem ser reconciliados com o cabecalho sincronizado

## Ordem sugerida de implementacao

1. estabilizar schema de banco
2. implementar CRUD/importacao de projeto
3. implementar CRUD de programacao
4. implementar sync de execucao mobile
5. implementar consulta de pendencias/reprogramacao
6. implementar consultas de historico e analise
7. implementar camada futura de faturamento

## Pontos em aberto

Estes pontos ainda podem ser refinados:

- se `caboExecutadoMetros` de vao sera obrigatorio quando o resultado for `EXECUTADO`
- se `TERCEIROS` em vao precisa metragem obrigatoria ou apenas resolve operacionalmente
- se havera revisao/versionamento formal do escopo tecnico importado
- se uma programacao pode coexistir com outra programacao aberta no mesmo projeto
- se evidencia sera obrigatoria para certos resultados

## Decisoes ja fechadas

Estas decisoes devem ser tratadas como base atual:

- SI pertence a programacao
- projeto tem status macro
- programacao tem status detalhado
- `reprogramadaDeId` e o nome oficial da relacao de reprogramacao
- `ProjetoProgramacao` permanece como nome da entidade principal nesta fase
- itens programados nao guardam resultado
- execucao guarda motivo e resultado
- fila de reprogramacao nao e tabela de dominio
- pendencia e derivada por consulta
- `PARCIAL` nao existe para poste
- `PARCIAL` nao existe para vao
- `PARCIAL` em item individual existe apenas para ramal

## Arquivos relacionados

- `packages/db/prisma/models/projetos.prisma`
- `packages/db/prisma/models/migrations/20260318183000_refactor_oper_projetos/migration.sql`
- `docs/01-arquitetura-monorepo.md`
- `docs/03-guia-criacao-modulo-api.md`
