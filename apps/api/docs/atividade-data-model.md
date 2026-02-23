# Modelo de Dados - Módulo de Atividades

Este documento propõe o modelo relacional da API para:
- alimentar o app (sync de catálogo)
- receber dados executados no app (upload de execução)

O desenho segue os padrões atuais do projeto:
- auditoria (`createdAt`, `createdBy`, `updatedAt`, `updatedBy`)
- soft delete (`deletedAt`, `deletedBy`) para catálogos
- FKs explícitas quando útil para consistência

## 1) Catálogo (download/sync)

Coleções esperadas pelo app:
1. `atividade-tipo`
2. `atividade-tipo-servico`
3. `atividade-form-template`
4. `atividade-form-pergunta`
5. `atividade-form-tipo-servico-relacao`
6. `material-catalogo`

Modelos recomendados:
- `TipoAtividade`
- `TipoAtividadeServico`
- `AtividadeFormTemplate`
- `AtividadeFormPergunta`
- `AtividadeFormTipoServicoRelacao`
- `MaterialCatalogo`

## 2) Operacional (upload de execução)

Modelos recomendados:
- `AtividadeExecucao`
- `AtividadeMedidor`
- `AtividadeMaterialAplicado`
- `AtividadeFormResposta`
- `AtividadeEvento`

## 3) Ajustes importantes no seu rascunho

1. Evitar `@@unique([nome])` global.
Use unicidade contextual por contrato/tipo (ex.: `@@unique([contratoId, nome])`).

2. Incluir campos funcionais do contrato do app:
`codigo`, `ativo`, `versao`/`versaoTemplate`.

3. Garantir idempotência da execução:
`atividadeUuid` único em `AtividadeExecucao`.

4. Indexar campos de sync/consulta:
`updatedAt`, `deletedAt`, FKs e status de upload.

## 4) Base Prisma sugerida

```prisma
model TipoAtividade {
  id     Int    @id @default(autoincrement())
  nome   String @db.VarChar(255)
  codigo String? @db.VarChar(100)
  ativo  Bool   @default(true)
  versao Int    @default(1)

  contratoId Int
  contrato   Contrato @relation(fields: [contratoId], references: [id])

  tipoAtividadeServicos TipoAtividadeServico[]
  atividadeExecucoes    AtividadeExecucao[]

  createdAt DateTime  @default(now())
  createdBy String    @db.VarChar(255)
  updatedAt DateTime? @updatedAt
  updatedBy String?   @db.VarChar(255)
  deletedAt DateTime?
  deletedBy String?   @db.VarChar(255)

  @@unique([contratoId, nome], map: "uq_tipo_atividade_contrato_nome")
  @@unique([contratoId, codigo], map: "uq_tipo_atividade_contrato_codigo")
  @@index([contratoId])
  @@index([updatedAt])
  @@index([deletedAt])
}

model TipoAtividadeServico {
  id     Int    @id @default(autoincrement())
  nome   String @db.VarChar(255)
  codigo String? @db.VarChar(100)
  ativo  Bool   @default(true)
  versao Int    @default(1)

  tipoAtividadeId Int
  tipoAtividade   TipoAtividade @relation(fields: [tipoAtividadeId], references: [id])

  atividadeFormTipoServicoRelacoes AtividadeFormTipoServicoRelacao[]
  atividadeExecucoes               AtividadeExecucao[]

  createdAt DateTime  @default(now())
  createdBy String    @db.VarChar(255)
  updatedAt DateTime? @updatedAt
  updatedBy String?   @db.VarChar(255)
  deletedAt DateTime?
  deletedBy String?   @db.VarChar(255)

  @@unique([tipoAtividadeId, nome], map: "uq_tipo_atividade_servico_tipo_nome")
  @@unique([tipoAtividadeId, codigo], map: "uq_tipo_atividade_servico_tipo_codigo")
  @@index([tipoAtividadeId])
  @@index([updatedAt])
  @@index([deletedAt])
}

model AtividadeFormTemplate {
  id             Int     @id @default(autoincrement())
  nome           String  @db.VarChar(255)
  descricao      String? @db.VarChar(500)
  ativo          Bool    @default(true)
  versaoTemplate Int     @default(1)

  contratoId Int
  contrato   Contrato @relation(fields: [contratoId], references: [id])

  perguntas           AtividadeFormPergunta[]
  tipoServicoRelacoes AtividadeFormTipoServicoRelacao[]
  atividadeExecucoes  AtividadeExecucao[]

  createdAt DateTime  @default(now())
  createdBy String    @db.VarChar(255)
  updatedAt DateTime? @updatedAt
  updatedBy String?   @db.VarChar(255)
  deletedAt DateTime?
  deletedBy String?   @db.VarChar(255)

  @@index([contratoId])
  @@index([updatedAt])
  @@index([deletedAt])
}

model AtividadeFormPergunta {
  id                       Int     @id @default(autoincrement())
  atividadeFormTemplateId  Int
  atividadeFormTemplate    AtividadeFormTemplate @relation(fields: [atividadeFormTemplateId], references: [id])
  perguntaChave            String  @db.VarChar(120)
  ordem                    Int     @default(0)
  titulo                   String  @db.VarChar(255)
  hintResposta             String? @db.VarChar(255)
  tipoResposta             String  @default("texto") @db.VarChar(50)
  obrigaFoto               Bool    @default(false)
  ativo                    Bool    @default(true)
  versao                   Int     @default(1)

  respostas AtividadeFormResposta[]

  createdAt DateTime  @default(now())
  createdBy String    @db.VarChar(255)
  updatedAt DateTime? @updatedAt
  updatedBy String?   @db.VarChar(255)
  deletedAt DateTime?
  deletedBy String?   @db.VarChar(255)

  @@unique([atividadeFormTemplateId, perguntaChave], map: "uq_form_pergunta_template_chave")
  @@index([atividadeFormTemplateId, ordem])
  @@index([updatedAt])
  @@index([deletedAt])
}

model AtividadeFormTipoServicoRelacao {
  id                    Int @id @default(autoincrement())
  atividadeFormTemplateId Int
  atividadeFormTemplate   AtividadeFormTemplate @relation(fields: [atividadeFormTemplateId], references: [id])

  tipoAtividadeServicoId Int
  tipoAtividadeServico   TipoAtividadeServico @relation(fields: [tipoAtividadeServicoId], references: [id])

  ativo Bool @default(true)

  createdAt DateTime  @default(now())
  createdBy String    @db.VarChar(255)
  updatedAt DateTime? @updatedAt
  updatedBy String?   @db.VarChar(255)
  deletedAt DateTime?
  deletedBy String?   @db.VarChar(255)

  @@unique([atividadeFormTemplateId, tipoAtividadeServicoId], map: "uq_form_template_tipo_servico")
  @@index([tipoAtividadeServicoId])
  @@index([updatedAt])
  @@index([deletedAt])
}

model MaterialCatalogo {
  id           Int    @id @default(autoincrement())
  codigo       String @db.VarChar(100)
  descricao    String @db.VarChar(255)
  unidadeMedida String @db.VarChar(30)
  ativo        Bool   @default(true)
  versao       Int    @default(1)

  contratoId Int
  contrato   Contrato @relation(fields: [contratoId], references: [id])

  materiaisAplicados AtividadeMaterialAplicado[]

  createdAt DateTime  @default(now())
  createdBy String    @db.VarChar(255)
  updatedAt DateTime? @updatedAt
  updatedBy String?   @db.VarChar(255)
  deletedAt DateTime?
  deletedBy String?   @db.VarChar(255)

  @@unique([contratoId, codigo], map: "uq_material_catalogo_contrato_codigo")
  @@index([contratoId])
  @@index([updatedAt])
  @@index([deletedAt])
}

model AtividadeExecucao {
  id             Int    @id @default(autoincrement())
  atividadeUuid  String @unique @db.VarChar(36)

  turnoId Int
  turno   Turno @relation(fields: [turnoId], references: [id])

  tipoAtividadeId      Int?
  tipoAtividade        TipoAtividade? @relation(fields: [tipoAtividadeId], references: [id])
  tipoAtividadeServicoId Int?
  tipoAtividadeServico TipoAtividadeServico? @relation(fields: [tipoAtividadeServicoId], references: [id])
  atividadeFormTemplateId Int?
  atividadeFormTemplate AtividadeFormTemplate? @relation(fields: [atividadeFormTemplateId], references: [id])

  tipoLigacao      String? @db.VarChar(100)
  numeroDocumento  String? @db.VarChar(100)
  aplicaMedidor    Bool    @default(false)
  aplicaRamal      Bool    @default(false)
  aplicaMaterial   Bool    @default(false)
  statusFluxo      String  @default("em_execucao") @db.VarChar(60)
  etapaAtual       String  @default("identificacao") @db.VarChar(60)
  aprPreenchidaEm  DateTime?
  finalizadaEm     DateTime?
  observacoesFinalizacao String? @db.Text

  syncStatus   String  @default("pending") @db.VarChar(30)
  attemptCount Int     @default(0)
  lastAttemptAt DateTime?
  syncError    String? @db.Text

  createdAt DateTime  @default(now())
  createdBy String    @db.VarChar(255)
  updatedAt DateTime? @updatedAt
  updatedBy String?   @db.VarChar(255)
  deletedAt DateTime?
  deletedBy String?   @db.VarChar(255)

  medidor            AtividadeMedidor?
  materiaisAplicados AtividadeMaterialAplicado[]
  respostasForm      AtividadeFormResposta[]
  eventos            AtividadeEvento[]

  @@index([turnoId, statusFluxo])
  @@index([syncStatus, attemptCount])
  @@index([createdAt])
}

model AtividadeMedidor {
  id Int @id @default(autoincrement())

  atividadeExecucaoId Int @unique
  atividadeExecucao   AtividadeExecucao @relation(fields: [atividadeExecucaoId], references: [id])

  somenteRetirada Bool @default(false)
  instaladoNumero String? @db.VarChar(100)
  instaladoPhotoId Int?
  retiradoStatus  String? @db.VarChar(100)
  retiradoNumero  String? @db.VarChar(100)
  retiradoLeitura String? @db.VarChar(100)
  retiradoPhotoId Int?

  createdAt DateTime  @default(now())
  createdBy String    @db.VarChar(255)
  updatedAt DateTime? @updatedAt
  updatedBy String?   @db.VarChar(255)
}

model AtividadeMaterialAplicado {
  id Int @id @default(autoincrement())

  atividadeExecucaoId Int
  atividadeExecucao   AtividadeExecucao @relation(fields: [atividadeExecucaoId], references: [id])

  materialCatalogoId Int?
  materialCatalogo   MaterialCatalogo? @relation(fields: [materialCatalogoId], references: [id])

  materialCodigoSnapshot    String @db.VarChar(100)
  materialDescricaoSnapshot String @db.VarChar(255)
  unidadeMedidaSnapshot     String @db.VarChar(30)
  quantidade Float

  createdAt DateTime  @default(now())
  createdBy String    @db.VarChar(255)
  updatedAt DateTime? @updatedAt
  updatedBy String?   @db.VarChar(255)

  @@index([atividadeExecucaoId])
  @@index([materialCatalogoId])
}

model AtividadeFormResposta {
  id Int @id @default(autoincrement())

  atividadeExecucaoId Int
  atividadeExecucao   AtividadeExecucao @relation(fields: [atividadeExecucaoId], references: [id])

  perguntaRemoteId Int?
  pergunta         AtividadeFormPergunta? @relation(fields: [perguntaRemoteId], references: [id])

  perguntaChaveSnapshot  String  @db.VarChar(120)
  perguntaTituloSnapshot String  @db.VarChar(255)
  ordem                  Int     @default(0)
  respostaTexto          String? @db.Text
  obrigaFotoSnapshot     Bool    @default(false)
  fotoId                 Int?
  dataResposta           DateTime @default(now())

  createdAt DateTime  @default(now())
  createdBy String    @db.VarChar(255)
  updatedAt DateTime? @updatedAt
  updatedBy String?   @db.VarChar(255)

  @@unique([atividadeExecucaoId, perguntaChaveSnapshot], map: "uq_resposta_atividade_pergunta")
  @@index([perguntaRemoteId])
}

model AtividadeEvento {
  id Int @id @default(autoincrement())

  atividadeExecucaoId Int
  atividadeExecucao   AtividadeExecucao @relation(fields: [atividadeExecucaoId], references: [id])

  tipoEvento String @db.VarChar(60)
  latitude   Float?
  longitude  Float?
  accuracy   Float?
  detalhe    String? @db.Text
  capturadoEm DateTime @default(now())
  signature  String? @unique @db.VarChar(128)

  createdAt DateTime  @default(now())
  createdBy String    @db.VarChar(255)
  updatedAt DateTime? @updatedAt
  updatedBy String?   @db.VarChar(255)

  @@index([atividadeExecucaoId, capturadoEm])
  @@index([tipoEvento])
}
```

## 5) Estratégia de rollout (recomendada)

1. Primeiro sprint: somente catálogos + sync (`manifest` e 6 coleções).
2. Segundo sprint: `AtividadeExecucao` + `AtividadeFormResposta`.
3. Terceiro sprint: `AtividadeMedidor`, `AtividadeMaterialAplicado`, `AtividadeEvento` + upload de fotos.

Assim você libera valor cedo sem travar na parte de upload completa.
