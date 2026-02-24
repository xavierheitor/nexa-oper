CREATE TABLE `AtividadeAprPreenchida` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `aprUuid` VARCHAR(36) NOT NULL,
    `remoteId` INTEGER NULL,
    `turnoId` INTEGER NOT NULL,
    `atividadeExecucaoId` INTEGER NULL,
    `aprId` INTEGER NULL,
    `tipoAtividadeId` INTEGER NULL,
    `tipoAtividadeServicoId` INTEGER NULL,
    `observacoes` TEXT NULL,
    `preenchidaEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `vinculadaAoServico` BOOLEAN NOT NULL DEFAULT true,
    `signature` VARCHAR(128) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    UNIQUE INDEX `AtividadeAprPreenchida_aprUuid_key`(`aprUuid`),
    INDEX `AtividadeAprPreenchida_turnoId_preenchidaEm_idx`(`turnoId`, `preenchidaEm`),
    INDEX `AtividadeAprPreenchida_atividadeExecucaoId_idx`(`atividadeExecucaoId`),
    INDEX `AtividadeAprPreenchida_aprId_idx`(`aprId`),
    INDEX `AtividadeAprPreenchida_tipoAtividadeId_idx`(`tipoAtividadeId`),
    INDEX `AtividadeAprPreenchida_tipoAtividadeServicoId_idx`(`tipoAtividadeServicoId`),
    INDEX `AtividadeAprPreenchida_updatedAt_idx`(`updatedAt`),
    INDEX `AtividadeAprPreenchida_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AtividadeAprResposta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `atividadeAprPreenchidaId` INTEGER NOT NULL,
    `aprGrupoPerguntaId` INTEGER NULL,
    `aprPerguntaId` INTEGER NULL,
    `aprOpcaoRespostaId` INTEGER NULL,
    `grupoNomeSnapshot` VARCHAR(255) NULL,
    `perguntaNomeSnapshot` VARCHAR(255) NOT NULL,
    `tipoRespostaSnapshot` VARCHAR(30) NOT NULL,
    `opcaoNomeSnapshot` VARCHAR(255) NULL,
    `respostaTexto` TEXT NULL,
    `marcado` BOOLEAN NULL,
    `ordemGrupo` INTEGER NOT NULL DEFAULT 0,
    `ordemPergunta` INTEGER NOT NULL DEFAULT 0,
    `dataResposta` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,

    INDEX `AtividadeAprResposta_atividadeAprPreenchidaId_ordemGrupo_ordemPergunta_idx`(`atividadeAprPreenchidaId`, `ordemGrupo`, `ordemPergunta`),
    INDEX `AtividadeAprResposta_aprGrupoPerguntaId_idx`(`aprGrupoPerguntaId`),
    INDEX `AtividadeAprResposta_aprPerguntaId_idx`(`aprPerguntaId`),
    INDEX `AtividadeAprResposta_aprOpcaoRespostaId_idx`(`aprOpcaoRespostaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AtividadeAprAssinatura` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `atividadeAprPreenchidaId` INTEGER NOT NULL,
    `turnoEletricistaId` INTEGER NULL,
    `eletricistaId` INTEGER NULL,
    `nomeAssinante` VARCHAR(255) NOT NULL,
    `matriculaAssinante` VARCHAR(100) NULL,
    `assinaturaHash` VARCHAR(128) NULL,
    `assinaturaData` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `assinanteExtra` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,

    INDEX `AtividadeAprAssinatura_atividadeAprPreenchidaId_idx`(`atividadeAprPreenchidaId`),
    INDEX `AtividadeAprAssinatura_turnoEletricistaId_idx`(`turnoEletricistaId`),
    INDEX `AtividadeAprAssinatura_eletricistaId_idx`(`eletricistaId`),
    INDEX `AtividadeAprAssinatura_assinaturaData_idx`(`assinaturaData`),
    UNIQUE INDEX `uq_atividade_apr_assinatura_hash`(`atividadeAprPreenchidaId`, `assinaturaHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `AtividadeAprPreenchida`
    ADD CONSTRAINT `AtividadeAprPreenchida_turnoId_fkey`
    FOREIGN KEY (`turnoId`) REFERENCES `Turno`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AtividadeAprPreenchida`
    ADD CONSTRAINT `AtividadeAprPreenchida_atividadeExecucaoId_fkey`
    FOREIGN KEY (`atividadeExecucaoId`) REFERENCES `AtividadeExecucao`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `AtividadeAprPreenchida`
    ADD CONSTRAINT `AtividadeAprPreenchida_aprId_fkey`
    FOREIGN KEY (`aprId`) REFERENCES `Apr`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `AtividadeAprPreenchida`
    ADD CONSTRAINT `AtividadeAprPreenchida_tipoAtividadeId_fkey`
    FOREIGN KEY (`tipoAtividadeId`) REFERENCES `TipoAtividade`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `AtividadeAprPreenchida`
    ADD CONSTRAINT `AtividadeAprPreenchida_tipoAtividadeServicoId_fkey`
    FOREIGN KEY (`tipoAtividadeServicoId`) REFERENCES `TipoAtividadeServico`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `AtividadeAprResposta`
    ADD CONSTRAINT `AtividadeAprResposta_atividadeAprPreenchidaId_fkey`
    FOREIGN KEY (`atividadeAprPreenchidaId`) REFERENCES `AtividadeAprPreenchida`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AtividadeAprResposta`
    ADD CONSTRAINT `AtividadeAprResposta_aprGrupoPerguntaId_fkey`
    FOREIGN KEY (`aprGrupoPerguntaId`) REFERENCES `AprGrupoPergunta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `AtividadeAprResposta`
    ADD CONSTRAINT `AtividadeAprResposta_aprPerguntaId_fkey`
    FOREIGN KEY (`aprPerguntaId`) REFERENCES `AprPergunta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `AtividadeAprResposta`
    ADD CONSTRAINT `AtividadeAprResposta_aprOpcaoRespostaId_fkey`
    FOREIGN KEY (`aprOpcaoRespostaId`) REFERENCES `AprOpcaoResposta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `AtividadeAprAssinatura`
    ADD CONSTRAINT `AtividadeAprAssinatura_atividadeAprPreenchidaId_fkey`
    FOREIGN KEY (`atividadeAprPreenchidaId`) REFERENCES `AtividadeAprPreenchida`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AtividadeAprAssinatura`
    ADD CONSTRAINT `AtividadeAprAssinatura_turnoEletricistaId_fkey`
    FOREIGN KEY (`turnoEletricistaId`) REFERENCES `TurnoEletricistas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `AtividadeAprAssinatura`
    ADD CONSTRAINT `AtividadeAprAssinatura_eletricistaId_fkey`
    FOREIGN KEY (`eletricistaId`) REFERENCES `Eletricista`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
