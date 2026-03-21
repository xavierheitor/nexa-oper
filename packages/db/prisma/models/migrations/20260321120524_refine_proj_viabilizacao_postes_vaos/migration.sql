-- Refina o modulo de projetos para o fluxo:
-- cadastro administrativo -> viabilizacao -> programacao -> execucao.
-- Tambem separa o cadastro mestre do poste e simplifica o vao para guardar
-- apenas extremos + material condutor.

CREATE TABLE `ProjCadastroPoste` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contratoId` INTEGER NOT NULL,
    `identificador` VARCHAR(100) NOT NULL,
    `numeroPoste` VARCHAR(100) NOT NULL,
    `observacao` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    UNIQUE INDEX `uq_proj_cadastro_poste_contrato_identificador`(`contratoId`, `identificador`),
    UNIQUE INDEX `uq_proj_cadastro_poste_contrato_numero`(`contratoId`, `numeroPoste`),
    INDEX `ProjCadastroPoste_contratoId_idx`(`contratoId`),
    INDEX `ProjCadastroPoste_numeroPoste_idx`(`numeroPoste`),
    INDEX `ProjCadastroPoste_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ProjCadastroPoste`
    ADD CONSTRAINT `ProjCadastroPoste_contratoId_fkey`
        FOREIGN KEY (`contratoId`) REFERENCES `Contrato`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `ProjetoProgramacao`
    MODIFY `status` ENUM(
        'PENDENTE',
        'EM_VIABILIZACAO',
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
        'VIABILIZADO_PARCIAL',
        'VIABILIZADO_TOTAL',
        'EM_PLANEJAMENTO',
        'EM_EXECUCAO',
        'FINALIZADO',
        'CANCELADO'
    ) NOT NULL;

ALTER TABLE `ProjetoProgramacao`
    ADD COLUMN `descricao_tmp` TEXT NULL AFTER `numeroProjeto`;

UPDATE `ProjetoProgramacao`
SET `descricao_tmp` = `nome`;

UPDATE `ProjetoProgramacao`
SET `equipamento` = ''
WHERE `equipamento` IS NULL;

UPDATE `ProjetoProgramacao`
SET `municipio` = ''
WHERE `municipio` IS NULL;

ALTER TABLE `ProjetoProgramacao`
    DROP COLUMN `nome`;

ALTER TABLE `ProjetoProgramacao`
    CHANGE COLUMN `descricao_tmp` `descricao` TEXT NOT NULL,
    MODIFY `equipamento` VARCHAR(255) NOT NULL,
    MODIFY `municipio` VARCHAR(255) NOT NULL;

CREATE TABLE `ProjViabilizacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projetoId` INTEGER NOT NULL,
    `resultado` ENUM('PARCIAL', 'TOTAL') NOT NULL,
    `dataViabilizacao` DATETIME(3) NULL,
    `enviadaEm` DATETIME(3) NULL,
    `observacao` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    UNIQUE INDEX `uq_proj_viabilizacao_id_projeto`(`id`, `projetoId`),
    INDEX `ProjViabilizacao_projetoId_idx`(`projetoId`),
    INDEX `ProjViabilizacao_resultado_idx`(`resultado`),
    INDEX `ProjViabilizacao_dataViabilizacao_idx`(`dataViabilizacao`),
    INDEX `ProjViabilizacao_enviadaEm_idx`(`enviadaEm`),
    INDEX `ProjViabilizacao_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ProjViabilizacao`
    ADD CONSTRAINT `ProjViabilizacao_projetoId_fkey`
        FOREIGN KEY (`projetoId`) REFERENCES `ProjetoProgramacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO `ProjCadastroPoste` (
    `contratoId`,
    `identificador`,
    `numeroPoste`,
    `observacao`,
    `createdAt`,
    `createdBy`,
    `updatedAt`,
    `updatedBy`,
    `deletedAt`,
    `deletedBy`
)
SELECT
    src.`contratoId`,
    src.`numeroIdentificacao`,
    src.`numeroIdentificacao`,
    NULL,
    MIN(src.`createdAt`),
    MIN(src.`createdBy`),
    MAX(src.`updatedAt`),
    MAX(src.`updatedBy`),
    MAX(src.`deletedAt`),
    MAX(src.`deletedBy`)
FROM (
    SELECT
        pp.`numeroIdentificacao`,
        pp.`createdAt`,
        pp.`createdBy`,
        pp.`updatedAt`,
        pp.`updatedBy`,
        pp.`deletedAt`,
        pp.`deletedBy`,
        pr.`contratoId`
    FROM `ProjPoste` pp
    INNER JOIN `ProjetoProgramacao` pr ON pr.`id` = pp.`projetoId`
) src
GROUP BY src.`contratoId`, src.`numeroIdentificacao`;

ALTER TABLE `ProjPoste`
    ADD COLUMN `cadastroPosteId` INTEGER NULL AFTER `projetoId`,
    ADD COLUMN `viabilizacaoId` INTEGER NULL AFTER `cadastroPosteId`;

UPDATE `ProjPoste` pp
INNER JOIN `ProjetoProgramacao` pr ON pr.`id` = pp.`projetoId`
INNER JOIN `ProjCadastroPoste` cp
    ON cp.`contratoId` = pr.`contratoId`
   AND cp.`numeroPoste` = pp.`numeroIdentificacao`
SET pp.`cadastroPosteId` = cp.`id`;

ALTER TABLE `ProjPoste`
    MODIFY `cadastroPosteId` INTEGER NOT NULL;

ALTER TABLE `ProjPoste`
    DROP INDEX `uq_proj_poste_projeto_numero`,
    DROP INDEX `ProjPoste_numeroIdentificacao_idx`;

ALTER TABLE `ProjPoste`
    ADD UNIQUE INDEX `uq_proj_poste_projeto_cadastro`(`projetoId`, `cadastroPosteId`),
    ADD INDEX `ProjPoste_cadastroPosteId_idx`(`cadastroPosteId`),
    ADD INDEX `ProjPoste_viabilizacaoId_idx`(`viabilizacaoId`);

ALTER TABLE `ProjPoste`
    ADD CONSTRAINT `ProjPoste_cadastroPosteId_fkey`
        FOREIGN KEY (`cadastroPosteId`) REFERENCES `ProjCadastroPoste`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `ProjPoste_viabilizacaoId_projetoId_fkey`
        FOREIGN KEY (`viabilizacaoId`, `projetoId`) REFERENCES `ProjViabilizacao`(`id`, `projetoId`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `ProjPoste`
    DROP COLUMN `numeroIdentificacao`;

ALTER TABLE `ProjPosteRamal`
    MODIFY `quantidadePrevista` INTEGER UNSIGNED NOT NULL DEFAULT 0;

ALTER TABLE `ProjVao`
    ADD COLUMN `viabilizacaoId` INTEGER NULL AFTER `projetoId`,
    ADD COLUMN `materialCondutorId` INTEGER NOT NULL AFTER `posteDestinoId`;

ALTER TABLE `ProjVao`
    DROP COLUMN `distanciaMetros`,
    DROP COLUMN `caboPrevistoMetros`,
    DROP COLUMN `valorServicoMetro`;

ALTER TABLE `ProjVao`
    ADD UNIQUE INDEX `uq_proj_vao_extremos`(`projetoId`, `posteOrigemId`, `posteDestinoId`),
    ADD INDEX `ProjVao_viabilizacaoId_idx`(`viabilizacaoId`),
    ADD INDEX `ProjVao_materialCondutorId_idx`(`materialCondutorId`);

ALTER TABLE `ProjVao`
    ADD CONSTRAINT `ProjVao_viabilizacaoId_projetoId_fkey`
        FOREIGN KEY (`viabilizacaoId`, `projetoId`) REFERENCES `ProjViabilizacao`(`id`, `projetoId`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `ProjVao_materialCondutorId_fkey`
        FOREIGN KEY (`materialCondutorId`) REFERENCES `MaterialCatalogo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

UPDATE `ProjProgramacao`
SET `siNumero` = CONCAT('SI-', `id`)
WHERE `siNumero` IS NULL OR `siNumero` = '';

ALTER TABLE `ProjProgramacao`
    MODIFY `siNumero` VARCHAR(100) NOT NULL,
    DROP COLUMN `viabilizado`;

ALTER TABLE `ProjProgramacaoRamal`
    MODIFY `quantidadePlanejada` INTEGER UNSIGNED NOT NULL DEFAULT 0;

ALTER TABLE `ProjExecucaoRamal`
    MODIFY `quantidadeExecutada` INTEGER UNSIGNED NOT NULL DEFAULT 0;

ALTER TABLE `ProjEvidencia`
    MODIFY `alvoTipo` ENUM(
        'VIABILIZACAO',
        'POSTE',
        'VAO',
        'EXECUCAO',
        'EXECUCAO_POSTE',
        'EXECUCAO_VAO',
        'EXECUCAO_RAMAL'
    ) NOT NULL;

ALTER TABLE `ProjEvidencia`
    ADD COLUMN `viabilizacaoId` INTEGER NULL AFTER `alvoTipo`,
    ADD COLUMN `posteId` INTEGER NULL AFTER `viabilizacaoId`,
    ADD COLUMN `vaoId` INTEGER NULL AFTER `posteId`;

ALTER TABLE `ProjEvidencia`
    ADD INDEX `ProjEvidencia_viabilizacaoId_idx`(`viabilizacaoId`),
    ADD INDEX `ProjEvidencia_posteId_idx`(`posteId`),
    ADD INDEX `ProjEvidencia_vaoId_idx`(`vaoId`);

ALTER TABLE `ProjEvidencia`
    ADD CONSTRAINT `ProjEvidencia_viabilizacaoId_projetoId_fkey`
        FOREIGN KEY (`viabilizacaoId`, `projetoId`) REFERENCES `ProjViabilizacao`(`id`, `projetoId`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `ProjEvidencia_posteId_projetoId_fkey`
        FOREIGN KEY (`posteId`, `projetoId`) REFERENCES `ProjPoste`(`id`, `projetoId`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `ProjEvidencia_vaoId_projetoId_fkey`
        FOREIGN KEY (`vaoId`, `projetoId`) REFERENCES `ProjVao`(`id`, `projetoId`) ON DELETE RESTRICT ON UPDATE CASCADE;
