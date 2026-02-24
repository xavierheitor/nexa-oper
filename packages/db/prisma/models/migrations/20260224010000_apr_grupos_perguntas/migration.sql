CREATE TABLE `AprGrupoPergunta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `tipoResposta` VARCHAR(30) NOT NULL DEFAULT 'checkbox',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `AprGrupoPergunta_tipoResposta_idx`(`tipoResposta`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AprGrupoRelacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `aprId` INTEGER NOT NULL,
    `aprGrupoPerguntaId` INTEGER NOT NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `AprGrupoRelacao_aprId_ordem_idx`(`aprId`, `ordem`),
    UNIQUE INDEX `uq_apr_grupo_rel_ativo`(`aprId`, `aprGrupoPerguntaId`, `deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AprGrupoPerguntaRelacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `aprGrupoPerguntaId` INTEGER NOT NULL,
    `aprPerguntaId` INTEGER NOT NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `AprGrupoPerguntaRelacao_aprGrupoPerguntaId_ordem_idx`(`aprGrupoPerguntaId`, `ordem`),
    UNIQUE INDEX `uq_apr_grupo_pergunta_rel_ativo`(`aprGrupoPerguntaId`, `aprPerguntaId`, `deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AprGrupoOpcaoRespostaRelacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `aprGrupoPerguntaId` INTEGER NOT NULL,
    `aprOpcaoRespostaId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `AprGrupoOpcaoRespostaRelacao_aprGrupoPerguntaId_idx`(`aprGrupoPerguntaId`),
    UNIQUE INDEX `uq_apr_grupo_opcao_rel_ativo`(`aprGrupoPerguntaId`, `aprOpcaoRespostaId`, `deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `AprGrupoRelacao`
    ADD CONSTRAINT `AprGrupoRelacao_aprId_fkey`
    FOREIGN KEY (`aprId`) REFERENCES `Apr`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `AprGrupoRelacao`
    ADD CONSTRAINT `AprGrupoRelacao_aprGrupoPerguntaId_fkey`
    FOREIGN KEY (`aprGrupoPerguntaId`) REFERENCES `AprGrupoPergunta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `AprGrupoPerguntaRelacao`
    ADD CONSTRAINT `AprGrupoPerguntaRelacao_aprGrupoPerguntaId_fkey`
    FOREIGN KEY (`aprGrupoPerguntaId`) REFERENCES `AprGrupoPergunta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `AprGrupoPerguntaRelacao`
    ADD CONSTRAINT `AprGrupoPerguntaRelacao_aprPerguntaId_fkey`
    FOREIGN KEY (`aprPerguntaId`) REFERENCES `AprPergunta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `AprGrupoOpcaoRespostaRelacao`
    ADD CONSTRAINT `AprGrupoOpcaoRespostaRelacao_aprGrupoPerguntaId_fkey`
    FOREIGN KEY (`aprGrupoPerguntaId`) REFERENCES `AprGrupoPergunta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `AprGrupoOpcaoRespostaRelacao`
    ADD CONSTRAINT `AprGrupoOpcaoRespostaRelacao_aprOpcaoRespostaId_fkey`
    FOREIGN KEY (`aprOpcaoRespostaId`) REFERENCES `AprOpcaoResposta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill legados: converte vínculos antigos APR->Perguntas/Opções para APR->Grupos
CREATE TEMPORARY TABLE `_apr_grupo_migracao` (
    `aprId` INTEGER NOT NULL,
    `aprGrupoPerguntaId` INTEGER NOT NULL,
    PRIMARY KEY (`aprId`)
);

INSERT INTO `AprGrupoPergunta` (
    `nome`,
    `tipoResposta`,
    `createdAt`,
    `createdBy`,
    `updatedAt`,
    `updatedBy`,
    `deletedAt`,
    `deletedBy`
)
SELECT
    CONCAT('[LEGADO APR ', `a`.`id`, '] ', `a`.`nome`) AS `nome`,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM `AprOpcaoRespostaRelacao` `aor`
            WHERE `aor`.`aprId` = `a`.`id`
              AND `aor`.`deletedAt` IS NULL
        ) THEN 'opcao'
        ELSE 'checkbox'
    END AS `tipoResposta`,
    `a`.`createdAt`,
    COALESCE(`a`.`createdBy`, 'migration'),
    `a`.`updatedAt`,
    `a`.`updatedBy`,
    `a`.`deletedAt`,
    `a`.`deletedBy`
FROM `Apr` `a`
WHERE EXISTS (
    SELECT 1
    FROM `AprPerguntaRelacao` `apr`
    WHERE `apr`.`aprId` = `a`.`id`
      AND `apr`.`deletedAt` IS NULL
);

INSERT INTO `_apr_grupo_migracao` (`aprId`, `aprGrupoPerguntaId`)
SELECT
    `a`.`id` AS `aprId`,
    `agp`.`id` AS `aprGrupoPerguntaId`
FROM `Apr` `a`
INNER JOIN `AprGrupoPergunta` `agp`
    ON `agp`.`nome` = CONCAT('[LEGADO APR ', `a`.`id`, '] ', `a`.`nome`);

INSERT INTO `AprGrupoRelacao` (
    `aprId`,
    `aprGrupoPerguntaId`,
    `ordem`,
    `createdAt`,
    `createdBy`,
    `updatedAt`,
    `updatedBy`,
    `deletedAt`,
    `deletedBy`
)
SELECT
    `m`.`aprId`,
    `m`.`aprGrupoPerguntaId`,
    0,
    `a`.`createdAt`,
    COALESCE(`a`.`createdBy`, 'migration'),
    `a`.`updatedAt`,
    `a`.`updatedBy`,
    `a`.`deletedAt`,
    `a`.`deletedBy`
FROM `_apr_grupo_migracao` `m`
INNER JOIN `Apr` `a` ON `a`.`id` = `m`.`aprId`;

INSERT INTO `AprGrupoPerguntaRelacao` (
    `aprGrupoPerguntaId`,
    `aprPerguntaId`,
    `ordem`,
    `createdAt`,
    `createdBy`,
    `updatedAt`,
    `updatedBy`,
    `deletedAt`,
    `deletedBy`
)
SELECT
    `m`.`aprGrupoPerguntaId`,
    `apr`.`aprPerguntaId`,
    `apr`.`ordem`,
    `apr`.`createdAt`,
    COALESCE(`apr`.`createdBy`, 'migration'),
    `apr`.`updatedAt`,
    `apr`.`updatedBy`,
    `apr`.`deletedAt`,
    `apr`.`deletedBy`
FROM `AprPerguntaRelacao` `apr`
INNER JOIN `_apr_grupo_migracao` `m` ON `m`.`aprId` = `apr`.`aprId`
WHERE `apr`.`deletedAt` IS NULL;

INSERT INTO `AprGrupoOpcaoRespostaRelacao` (
    `aprGrupoPerguntaId`,
    `aprOpcaoRespostaId`,
    `createdAt`,
    `createdBy`,
    `updatedAt`,
    `updatedBy`,
    `deletedAt`,
    `deletedBy`
)
SELECT
    `m`.`aprGrupoPerguntaId`,
    `aor`.`aprOpcaoRespostaId`,
    `aor`.`createdAt`,
    COALESCE(`aor`.`createdBy`, 'migration'),
    `aor`.`updatedAt`,
    `aor`.`updatedBy`,
    `aor`.`deletedAt`,
    `aor`.`deletedBy`
FROM `AprOpcaoRespostaRelacao` `aor`
INNER JOIN `_apr_grupo_migracao` `m` ON `m`.`aprId` = `aor`.`aprId`
WHERE `aor`.`deletedAt` IS NULL;

DROP TEMPORARY TABLE IF EXISTS `_apr_grupo_migracao`;
