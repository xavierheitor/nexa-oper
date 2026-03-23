-- Adiciona etapa formal de validacao/correcao da viabilizacao.
-- O projeto passa a ter os estados AGUARDANDO_VALIDACAO e EM_CORRECAO,
-- e o escopo tecnico aprovado para programacao recebe procedencia de validacao.

ALTER TABLE `ProjetoProgramacao`
    MODIFY `status` ENUM(
        'PENDENTE',
        'EM_VIABILIZACAO',
        'AGUARDANDO_VALIDACAO',
        'EM_CORRECAO',
        'VIABILIZADO_PARCIAL',
        'VIABILIZADO_TOTAL',
        'EM_PLANEJAMENTO',
        'EM_EXECUCAO',
        'FINALIZADO',
        'CANCELADO'
    ) NOT NULL DEFAULT 'PENDENTE';

ALTER TABLE `ProjHistoricoProjeto`
    MODIFY `statusAnterior` ENUM(
        'PENDENTE',
        'EM_VIABILIZACAO',
        'AGUARDANDO_VALIDACAO',
        'EM_CORRECAO',
        'VIABILIZADO_PARCIAL',
        'VIABILIZADO_TOTAL',
        'EM_PLANEJAMENTO',
        'EM_EXECUCAO',
        'FINALIZADO',
        'CANCELADO'
    ) NULL,
    MODIFY `statusNovo` ENUM(
        'PENDENTE',
        'EM_VIABILIZACAO',
        'AGUARDANDO_VALIDACAO',
        'EM_CORRECAO',
        'VIABILIZADO_PARCIAL',
        'VIABILIZADO_TOTAL',
        'EM_PLANEJAMENTO',
        'EM_EXECUCAO',
        'FINALIZADO',
        'CANCELADO'
    ) NOT NULL;

CREATE TABLE `ProjValidacaoViabilizacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projetoId` INTEGER NOT NULL,
    `viabilizacaoId` INTEGER NOT NULL,
    `resultado` ENUM('APROVADA', 'CORRIGIDA', 'REJEITADA') NOT NULL,
    `validadaEm` DATETIME(3) NOT NULL,
    `observacao` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    UNIQUE INDEX `uq_proj_validacao_viabilizacao_id_projeto`(`id`, `projetoId`),
    INDEX `ProjValidacaoViabilizacao_projetoId_idx`(`projetoId`),
    INDEX `ProjValidacaoViabilizacao_viabilizacaoId_idx`(`viabilizacaoId`),
    INDEX `ProjValidacaoViabilizacao_resultado_idx`(`resultado`),
    INDEX `ProjValidacaoViabilizacao_validadaEm_idx`(`validadaEm`),
    INDEX `ProjValidacaoViabilizacao_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ProjValidacaoViabilizacao`
    ADD CONSTRAINT `ProjValidacaoViabilizacao_projetoId_fkey`
        FOREIGN KEY (`projetoId`) REFERENCES `ProjetoProgramacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `ProjValidacaoViabilizacao_viabilizacaoId_projetoId_fkey`
        FOREIGN KEY (`viabilizacaoId`, `projetoId`) REFERENCES `ProjViabilizacao`(`id`, `projetoId`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `ProjPoste`
    ADD COLUMN `validacaoId` INTEGER NULL AFTER `viabilizacaoId`,
    ADD INDEX `ProjPoste_validacaoId_idx`(`validacaoId`);

ALTER TABLE `ProjPoste`
    ADD CONSTRAINT `ProjPoste_validacaoId_projetoId_fkey`
        FOREIGN KEY (`validacaoId`, `projetoId`) REFERENCES `ProjValidacaoViabilizacao`(`id`, `projetoId`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `ProjVao`
    ADD COLUMN `validacaoId` INTEGER NULL AFTER `viabilizacaoId`,
    ADD INDEX `ProjVao_validacaoId_idx`(`validacaoId`);

ALTER TABLE `ProjVao`
    ADD CONSTRAINT `ProjVao_validacaoId_projetoId_fkey`
        FOREIGN KEY (`validacaoId`, `projetoId`) REFERENCES `ProjValidacaoViabilizacao`(`id`, `projetoId`) ON DELETE RESTRICT ON UPDATE CASCADE;
