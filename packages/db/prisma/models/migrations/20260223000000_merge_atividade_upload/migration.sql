-- DropIndex
DROP INDEX `TipoAtividade_nome_idx` ON `TipoAtividade`;

-- DropIndex
DROP INDEX `TipoAtividade_nome_key` ON `TipoAtividade`;

-- AlterTable
ALTER TABLE `TipoAtividade` ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `codigo` VARCHAR(100) NULL,
    ADD COLUMN `contratoId` INTEGER NOT NULL,
    ADD COLUMN `versao` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `Turno` ADD COLUMN `versaoApp` VARCHAR(255) NULL,
    MODIFY `dispositivo` VARCHAR(255) NULL;

-- CreateTable
CREATE TABLE `TipoAtividadeServico` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `codigo` VARCHAR(100) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `versao` INTEGER NOT NULL DEFAULT 1,
    `atividadeTipoId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `TipoAtividadeServico_atividadeTipoId_idx`(`atividadeTipoId`),
    INDEX `TipoAtividadeServico_updatedAt_idx`(`updatedAt`),
    INDEX `TipoAtividadeServico_deletedAt_idx`(`deletedAt`),
    UNIQUE INDEX `uq_tipo_atividade_servico_tipo_nome`(`atividadeTipoId`, `nome`),
    UNIQUE INDEX `uq_tipo_atividade_servico_tipo_codigo`(`atividadeTipoId`, `codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AtividadeFormTemplate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `descricao` VARCHAR(500) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `versaoTemplate` INTEGER NOT NULL DEFAULT 1,
    `contratoId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `AtividadeFormTemplate_contratoId_idx`(`contratoId`),
    INDEX `AtividadeFormTemplate_updatedAt_idx`(`updatedAt`),
    INDEX `AtividadeFormTemplate_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AtividadeFormPergunta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `atividadeFormTemplateId` INTEGER NOT NULL,
    `perguntaChave` VARCHAR(120) NOT NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `titulo` VARCHAR(255) NOT NULL,
    `hintResposta` VARCHAR(255) NULL,
    `tipoResposta` VARCHAR(50) NOT NULL DEFAULT 'texto',
    `obrigaFoto` BOOLEAN NOT NULL DEFAULT false,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `versao` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `AtividadeFormPergunta_atividadeFormTemplateId_ordem_idx`(`atividadeFormTemplateId`, `ordem`),
    INDEX `AtividadeFormPergunta_updatedAt_idx`(`updatedAt`),
    INDEX `AtividadeFormPergunta_deletedAt_idx`(`deletedAt`),
    UNIQUE INDEX `uq_form_pergunta_template_chave`(`atividadeFormTemplateId`, `perguntaChave`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AtividadeFormTipoServicoRelacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `atividadeFormTemplateId` INTEGER NOT NULL,
    `atividadeTipoServicoId` INTEGER NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `AtividadeFormTipoServicoRelacao_atividadeTipoServicoId_idx`(`atividadeTipoServicoId`),
    INDEX `AtividadeFormTipoServicoRelacao_updatedAt_idx`(`updatedAt`),
    INDEX `AtividadeFormTipoServicoRelacao_deletedAt_idx`(`deletedAt`),
    UNIQUE INDEX `uq_form_template_tipo_servico`(`atividadeFormTemplateId`, `atividadeTipoServicoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MaterialCatalogo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(100) NOT NULL,
    `descricao` VARCHAR(255) NOT NULL,
    `unidadeMedida` VARCHAR(30) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `versao` INTEGER NOT NULL DEFAULT 1,
    `contratoId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `MaterialCatalogo_contratoId_idx`(`contratoId`),
    INDEX `MaterialCatalogo_updatedAt_idx`(`updatedAt`),
    INDEX `MaterialCatalogo_deletedAt_idx`(`deletedAt`),
    UNIQUE INDEX `uq_material_catalogo_contrato_codigo`(`contratoId`, `codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AtividadeExecucao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `atividadeUuid` VARCHAR(36) NOT NULL,
    `remoteId` INTEGER NULL,
    `turnoId` INTEGER NOT NULL,
    `tipoAtividadeId` INTEGER NULL,
    `tipoAtividadeServicoId` INTEGER NULL,
    `atividadeFormTemplateId` INTEGER NULL,
    `tipoAtividadeNomeSnapshot` VARCHAR(255) NULL,
    `tipoServicoNomeSnapshot` VARCHAR(255) NULL,
    `tipoLigacao` VARCHAR(100) NULL,
    `numeroDocumento` VARCHAR(100) NULL,
    `aplicaMedidor` BOOLEAN NOT NULL DEFAULT false,
    `aplicaRamal` BOOLEAN NOT NULL DEFAULT false,
    `aplicaMaterial` BOOLEAN NOT NULL DEFAULT false,
    `statusFluxo` VARCHAR(60) NOT NULL DEFAULT 'em_execucao',
    `etapaAtual` VARCHAR(60) NOT NULL DEFAULT 'identificacao',
    `aprPreenchidaEm` DATETIME(3) NULL,
    `finalizadaEm` DATETIME(3) NULL,
    `observacoesFinalizacao` TEXT NULL,
    `syncStatus` VARCHAR(30) NOT NULL DEFAULT 'received',
    `attemptCount` INTEGER NOT NULL DEFAULT 0,
    `syncError` TEXT NULL,
    `lastAttemptAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    UNIQUE INDEX `AtividadeExecucao_atividadeUuid_key`(`atividadeUuid`),
    INDEX `AtividadeExecucao_turnoId_statusFluxo_idx`(`turnoId`, `statusFluxo`),
    INDEX `AtividadeExecucao_syncStatus_attemptCount_idx`(`syncStatus`, `attemptCount`),
    INDEX `AtividadeExecucao_updatedAt_idx`(`updatedAt`),
    INDEX `AtividadeExecucao_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AtividadeFoto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `atividadeExecucaoId` INTEGER NOT NULL,
    `atividadeUuid` VARCHAR(36) NOT NULL,
    `ref` VARCHAR(120) NULL,
    `contexto` VARCHAR(120) NULL,
    `checksum` VARCHAR(128) NOT NULL,
    `mimeType` VARCHAR(100) NOT NULL,
    `fileName` VARCHAR(255) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `storagePath` VARCHAR(1024) NOT NULL,
    `url` VARCHAR(1024) NOT NULL,
    `capturedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `AtividadeFoto_atividadeExecucaoId_idx`(`atividadeExecucaoId`),
    INDEX `AtividadeFoto_ref_idx`(`ref`),
    UNIQUE INDEX `uq_atividade_foto_exec_checksum`(`atividadeExecucaoId`, `checksum`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AtividadeMedidor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `atividadeExecucaoId` INTEGER NOT NULL,
    `somenteRetirada` BOOLEAN NOT NULL DEFAULT false,
    `instaladoNumero` VARCHAR(100) NULL,
    `instaladoFotoId` INTEGER NULL,
    `instaladoFotoExternalId` INTEGER NULL,
    `retiradoStatus` VARCHAR(100) NULL,
    `retiradoNumero` VARCHAR(100) NULL,
    `retiradoLeitura` VARCHAR(100) NULL,
    `retiradoFotoId` INTEGER NULL,
    `retiradoFotoExternalId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,

    UNIQUE INDEX `AtividadeMedidor_atividadeExecucaoId_key`(`atividadeExecucaoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AtividadeMaterialAplicado` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `atividadeExecucaoId` INTEGER NOT NULL,
    `materialCatalogoId` INTEGER NULL,
    `materialCatalogoRemoteId` INTEGER NULL,
    `materialCodigoSnapshot` VARCHAR(100) NOT NULL,
    `materialDescricaoSnapshot` VARCHAR(255) NOT NULL,
    `unidadeMedidaSnapshot` VARCHAR(30) NOT NULL,
    `quantidade` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,

    INDEX `AtividadeMaterialAplicado_atividadeExecucaoId_idx`(`atividadeExecucaoId`),
    INDEX `AtividadeMaterialAplicado_materialCatalogoId_idx`(`materialCatalogoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AtividadeFormResposta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `atividadeExecucaoId` INTEGER NOT NULL,
    `perguntaRemoteId` INTEGER NULL,
    `perguntaChaveSnapshot` VARCHAR(120) NOT NULL,
    `perguntaTituloSnapshot` VARCHAR(255) NOT NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `respostaTexto` TEXT NULL,
    `obrigaFotoSnapshot` BOOLEAN NOT NULL DEFAULT false,
    `fotoId` INTEGER NULL,
    `fotoExternalId` INTEGER NULL,
    `dataResposta` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,

    INDEX `AtividadeFormResposta_perguntaRemoteId_idx`(`perguntaRemoteId`),
    UNIQUE INDEX `uq_atividade_resposta_pergunta`(`atividadeExecucaoId`, `perguntaChaveSnapshot`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AtividadeEvento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `atividadeExecucaoId` INTEGER NOT NULL,
    `tipoEvento` VARCHAR(80) NOT NULL,
    `locationTrackId` INTEGER NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `accuracy` DOUBLE NULL,
    `detalhe` TEXT NULL,
    `capturadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `signature` VARCHAR(128) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,

    INDEX `AtividadeEvento_atividadeExecucaoId_capturadoEm_idx`(`atividadeExecucaoId`, `capturadoEm`),
    INDEX `AtividadeEvento_tipoEvento_idx`(`tipoEvento`),
    UNIQUE INDEX `uq_atividade_evento_signature`(`atividadeExecucaoId`, `signature`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UploadEvidences` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo` VARCHAR(100) NOT NULL,
    `entityType` VARCHAR(100) NOT NULL,
    `entityId` VARCHAR(50) NOT NULL,
    `url` VARCHAR(1024) NOT NULL,
    `path` VARCHAR(1024) NOT NULL,
    `tamanho` INTEGER NOT NULL,
    `mimeType` VARCHAR(100) NULL,
    `nomeArquivo` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NULL,

    INDEX `UploadEvidences_tipo_idx`(`tipo`),
    INDEX `UploadEvidences_entityType_entityId_idx`(`entityType`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `TipoAtividade_contratoId_idx` ON `TipoAtividade`(`contratoId`);

-- CreateIndex
CREATE INDEX `TipoAtividade_updatedAt_idx` ON `TipoAtividade`(`updatedAt`);

-- CreateIndex
CREATE INDEX `TipoAtividade_deletedAt_idx` ON `TipoAtividade`(`deletedAt`);

-- CreateIndex
CREATE UNIQUE INDEX `uq_tipo_atividade_contrato_nome` ON `TipoAtividade`(`contratoId`, `nome`);

-- CreateIndex
CREATE UNIQUE INDEX `uq_tipo_atividade_contrato_codigo` ON `TipoAtividade`(`contratoId`, `codigo`);

-- AddForeignKey
ALTER TABLE `TipoAtividade` ADD CONSTRAINT `TipoAtividade_contratoId_fkey` FOREIGN KEY (`contratoId`) REFERENCES `Contrato`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TipoAtividadeServico` ADD CONSTRAINT `TipoAtividadeServico_atividadeTipoId_fkey` FOREIGN KEY (`atividadeTipoId`) REFERENCES `TipoAtividade`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtividadeFormTemplate` ADD CONSTRAINT `AtividadeFormTemplate_contratoId_fkey` FOREIGN KEY (`contratoId`) REFERENCES `Contrato`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtividadeFormPergunta` ADD CONSTRAINT `AtividadeFormPergunta_atividadeFormTemplateId_fkey` FOREIGN KEY (`atividadeFormTemplateId`) REFERENCES `AtividadeFormTemplate`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtividadeFormTipoServicoRelacao` ADD CONSTRAINT `AtividadeFormTipoServicoRelacao_atividadeFormTemplateId_fkey` FOREIGN KEY (`atividadeFormTemplateId`) REFERENCES `AtividadeFormTemplate`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtividadeFormTipoServicoRelacao` ADD CONSTRAINT `AtividadeFormTipoServicoRelacao_atividadeTipoServicoId_fkey` FOREIGN KEY (`atividadeTipoServicoId`) REFERENCES `TipoAtividadeServico`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialCatalogo` ADD CONSTRAINT `MaterialCatalogo_contratoId_fkey` FOREIGN KEY (`contratoId`) REFERENCES `Contrato`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtividadeExecucao` ADD CONSTRAINT `AtividadeExecucao_turnoId_fkey` FOREIGN KEY (`turnoId`) REFERENCES `Turno`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtividadeExecucao` ADD CONSTRAINT `AtividadeExecucao_tipoAtividadeId_fkey` FOREIGN KEY (`tipoAtividadeId`) REFERENCES `TipoAtividade`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtividadeExecucao` ADD CONSTRAINT `AtividadeExecucao_tipoAtividadeServicoId_fkey` FOREIGN KEY (`tipoAtividadeServicoId`) REFERENCES `TipoAtividadeServico`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtividadeExecucao` ADD CONSTRAINT `AtividadeExecucao_atividadeFormTemplateId_fkey` FOREIGN KEY (`atividadeFormTemplateId`) REFERENCES `AtividadeFormTemplate`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtividadeFoto` ADD CONSTRAINT `AtividadeFoto_atividadeExecucaoId_fkey` FOREIGN KEY (`atividadeExecucaoId`) REFERENCES `AtividadeExecucao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtividadeMedidor` ADD CONSTRAINT `AtividadeMedidor_atividadeExecucaoId_fkey` FOREIGN KEY (`atividadeExecucaoId`) REFERENCES `AtividadeExecucao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtividadeMedidor` ADD CONSTRAINT `AtividadeMedidor_instaladoFotoId_fkey` FOREIGN KEY (`instaladoFotoId`) REFERENCES `AtividadeFoto`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtividadeMedidor` ADD CONSTRAINT `AtividadeMedidor_retiradoFotoId_fkey` FOREIGN KEY (`retiradoFotoId`) REFERENCES `AtividadeFoto`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtividadeMaterialAplicado` ADD CONSTRAINT `AtividadeMaterialAplicado_atividadeExecucaoId_fkey` FOREIGN KEY (`atividadeExecucaoId`) REFERENCES `AtividadeExecucao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtividadeMaterialAplicado` ADD CONSTRAINT `AtividadeMaterialAplicado_materialCatalogoId_fkey` FOREIGN KEY (`materialCatalogoId`) REFERENCES `MaterialCatalogo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtividadeFormResposta` ADD CONSTRAINT `AtividadeFormResposta_atividadeExecucaoId_fkey` FOREIGN KEY (`atividadeExecucaoId`) REFERENCES `AtividadeExecucao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtividadeFormResposta` ADD CONSTRAINT `AtividadeFormResposta_perguntaRemoteId_fkey` FOREIGN KEY (`perguntaRemoteId`) REFERENCES `AtividadeFormPergunta`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtividadeFormResposta` ADD CONSTRAINT `AtividadeFormResposta_fotoId_fkey` FOREIGN KEY (`fotoId`) REFERENCES `AtividadeFoto`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtividadeEvento` ADD CONSTRAINT `AtividadeEvento_atividadeExecucaoId_fkey` FOREIGN KEY (`atividadeExecucaoId`) REFERENCES `AtividadeExecucao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

