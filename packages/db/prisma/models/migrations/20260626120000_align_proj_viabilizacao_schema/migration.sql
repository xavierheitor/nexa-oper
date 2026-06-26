-- Align legacy oper-projetos tables with the current mobile viabilizacao schema
-- (ProjPrograma, ProjProjeto, ProjEstrutura, ProjPosteEstruturas, etc.).
-- Preserves catalog data and migrates viabilizacao records when present.

SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------------
-- 1) Snapshot legacy data (no-op when tables are empty)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `_migrate_projeto_programacao` LIKE `ProjetoProgramacao`;
DELETE FROM `_migrate_projeto_programacao`;
INSERT INTO `_migrate_projeto_programacao` SELECT * FROM `ProjetoProgramacao`;

CREATE TABLE IF NOT EXISTS `_migrate_proj_cadastro_poste` LIKE `ProjCadastroPoste`;
DELETE FROM `_migrate_proj_cadastro_poste`;
INSERT INTO `_migrate_proj_cadastro_poste` SELECT * FROM `ProjCadastroPoste`;

CREATE TABLE IF NOT EXISTS `_migrate_proj_viabilizacao` LIKE `ProjViabilizacao`;
DELETE FROM `_migrate_proj_viabilizacao`;
INSERT INTO `_migrate_proj_viabilizacao` SELECT * FROM `ProjViabilizacao`;

CREATE TABLE IF NOT EXISTS `_migrate_proj_poste` LIKE `ProjPoste`;
DELETE FROM `_migrate_proj_poste`;
INSERT INTO `_migrate_proj_poste` SELECT * FROM `ProjPoste`;

CREATE TABLE IF NOT EXISTS `_migrate_proj_poste_estrutura` LIKE `ProjPosteEstrutura`;
DELETE FROM `_migrate_proj_poste_estrutura`;
INSERT INTO `_migrate_proj_poste_estrutura` SELECT * FROM `ProjPosteEstrutura`;

CREATE TABLE IF NOT EXISTS `_migrate_proj_poste_ramal` LIKE `ProjPosteRamal`;
DELETE FROM `_migrate_proj_poste_ramal`;
INSERT INTO `_migrate_proj_poste_ramal` SELECT * FROM `ProjPosteRamal`;

CREATE TABLE IF NOT EXISTS `_migrate_proj_vao` LIKE `ProjVao`;
DELETE FROM `_migrate_proj_vao`;
INSERT INTO `_migrate_proj_vao` SELECT * FROM `ProjVao`;

CREATE TABLE IF NOT EXISTS `_migrate_proj_validacao` LIKE `ProjValidacaoViabilizacao`;
DELETE FROM `_migrate_proj_validacao`;
INSERT INTO `_migrate_proj_validacao` SELECT * FROM `ProjValidacaoViabilizacao`;

CREATE TABLE IF NOT EXISTS `_migrate_proj_tipo_estrutura` LIKE `ProjTipoEstrutura`;
DELETE FROM `_migrate_proj_tipo_estrutura`;
INSERT INTO `_migrate_proj_tipo_estrutura` SELECT * FROM `ProjTipoEstrutura`;

-- ---------------------------------------------------------------------------
-- 2) Drop legacy tables not used by the current Prisma schema
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS `ProjEvidencia`;
DROP TABLE IF EXISTS `ProjHistoricoProgramacao`;
DROP TABLE IF EXISTS `ProjHistoricoProjeto`;
DROP TABLE IF EXISTS `ProjExecucaoRamal`;
DROP TABLE IF EXISTS `ProjExecucaoVao`;
DROP TABLE IF EXISTS `ProjExecucaoPoste`;
DROP TABLE IF EXISTS `ProjExecucao`;
DROP TABLE IF EXISTS `ProjProgramacaoRamal`;
DROP TABLE IF EXISTS `ProjProgramacaoVao`;
DROP TABLE IF EXISTS `ProjProgramacaoPoste`;
DROP TABLE IF EXISTS `ProjProgramacao`;
DROP TABLE IF EXISTS `ProjMotivoOcorrencia`;
DROP TABLE IF EXISTS `ProjTipoEstruturaMaterial`;
DROP TABLE IF EXISTS `ProjTipoRamalMaterial`;

DROP TABLE IF EXISTS `ProjValidacaoViabilizacao`;
DROP TABLE IF EXISTS `ProjVao`;
DROP TABLE IF EXISTS `ProjPosteRamal`;
DROP TABLE IF EXISTS `ProjPosteEstrutura`;
DROP TABLE IF EXISTS `ProjPoste`;
DROP TABLE IF EXISTS `ProjViabilizacao`;
DROP TABLE IF EXISTS `ProjCadastroPoste`;
DROP TABLE IF EXISTS `ProjetoProgramacao`;
DROP TABLE IF EXISTS `ProjTipoEstrutura`;

-- ---------------------------------------------------------------------------
-- 3) Create current schema tables
-- ---------------------------------------------------------------------------

CREATE TABLE `ProjPrograma` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `contratoId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `ProjPrograma_nome_idx`(`nome`),
    INDEX `ProjPrograma_deletedAt_idx`(`deletedAt`),
    INDEX `ProjPrograma_contratoId_idx`(`contratoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ProjProjeto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `programaId` INTEGER NOT NULL,
    `numeroProjeto` VARCHAR(255) NOT NULL,
    `descricao` TEXT NOT NULL,
    `equipamento` VARCHAR(255) NOT NULL,
    `municipio` VARCHAR(255) NOT NULL,
    `status` ENUM(
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
    ) NOT NULL DEFAULT 'PENDENTE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `ProjProjeto_numeroProjeto_idx`(`numeroProjeto`),
    INDEX `ProjProjeto_deletedAt_idx`(`deletedAt`),
    INDEX `ProjProjeto_programaId_idx`(`programaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ProjEstrutura` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `ProjEstrutura_nome_idx`(`nome`),
    INDEX `ProjEstrutura_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ProjViabilizacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projetoId` INTEGER NOT NULL,
    `data` VARCHAR(255) NOT NULL,
    `observacao` TEXT NOT NULL,
    `autorId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `ProjViabilizacao_projetoId_idx`(`projetoId`),
    INDEX `ProjViabilizacao_deletedAt_idx`(`deletedAt`),
    INDEX `ProjViabilizacao_autorId_idx`(`autorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ProjPoste` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `viabilizacaoId` INTEGER NOT NULL,
    `tipoPosteId` INTEGER NOT NULL,
    `cadastro` VARCHAR(255) NOT NULL,
    `uuid` VARCHAR(255) NOT NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `ProjPoste_viabilizacaoId_idx`(`viabilizacaoId`),
    INDEX `ProjPoste_tipoPosteId_idx`(`tipoPosteId`),
    INDEX `ProjPoste_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ProjPosteEstruturas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `posteId` INTEGER NOT NULL,
    `estruturaId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `ProjPosteEstruturas_posteId_idx`(`posteId`),
    INDEX `ProjPosteEstruturas_estruturaId_idx`(`estruturaId`),
    INDEX `ProjPosteEstruturas_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ProjPosteRamais` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `posteId` INTEGER NOT NULL,
    `tipoRamalId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `ProjPosteRamais_posteId_idx`(`posteId`),
    INDEX `ProjPosteRamais_tipoRamalId_idx`(`tipoRamalId`),
    INDEX `ProjPosteRamais_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ProjVao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `viabilizacaoId` INTEGER NOT NULL,
    `posteInicioId` INTEGER NOT NULL,
    `posteFimId` INTEGER NOT NULL,
    `materialCondutorId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `ProjVao_viabilizacaoId_idx`(`viabilizacaoId`),
    INDEX `ProjVao_posteInicioId_idx`(`posteInicioId`),
    INDEX `ProjVao_posteFimId_idx`(`posteFimId`),
    INDEX `ProjVao_materialCondutorId_idx`(`materialCondutorId`),
    INDEX `ProjVao_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ProjValidacaoViabilizacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `posteId` INTEGER NOT NULL,
    `data` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `observacao` TEXT NULL,
    `autorId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `ProjValidacaoViabilizacao_posteId_idx`(`posteId`),
    INDEX `ProjValidacaoViabilizacao_autorId_idx`(`autorId`),
    INDEX `ProjValidacaoViabilizacao_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 4) Foreign keys
-- ---------------------------------------------------------------------------

ALTER TABLE `ProjPrograma`
    ADD CONSTRAINT `ProjPrograma_contratoId_fkey`
        FOREIGN KEY (`contratoId`) REFERENCES `Contrato`(`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `ProjProjeto`
    ADD CONSTRAINT `ProjProjeto_programaId_fkey`
        FOREIGN KEY (`programaId`) REFERENCES `ProjPrograma`(`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `ProjViabilizacao`
    ADD CONSTRAINT `ProjViabilizacao_projetoId_fkey`
        FOREIGN KEY (`projetoId`) REFERENCES `ProjProjeto`(`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `ProjViabilizacao_autorId_fkey`
        FOREIGN KEY (`autorId`) REFERENCES `MobileUser`(`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `ProjPoste`
    ADD CONSTRAINT `ProjPoste_viabilizacaoId_fkey`
        FOREIGN KEY (`viabilizacaoId`) REFERENCES `ProjViabilizacao`(`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `ProjPoste_tipoPosteId_fkey`
        FOREIGN KEY (`tipoPosteId`) REFERENCES `ProjTipoPoste`(`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `ProjPosteEstruturas`
    ADD CONSTRAINT `ProjPosteEstruturas_posteId_fkey`
        FOREIGN KEY (`posteId`) REFERENCES `ProjPoste`(`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `ProjPosteEstruturas_estruturaId_fkey`
        FOREIGN KEY (`estruturaId`) REFERENCES `ProjEstrutura`(`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `ProjPosteRamais`
    ADD CONSTRAINT `ProjPosteRamais_posteId_fkey`
        FOREIGN KEY (`posteId`) REFERENCES `ProjPoste`(`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `ProjPosteRamais_tipoRamalId_fkey`
        FOREIGN KEY (`tipoRamalId`) REFERENCES `ProjTipoRamal`(`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `ProjVao`
    ADD CONSTRAINT `ProjVao_viabilizacaoId_fkey`
        FOREIGN KEY (`viabilizacaoId`) REFERENCES `ProjViabilizacao`(`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `ProjVao_posteInicioId_fkey`
        FOREIGN KEY (`posteInicioId`) REFERENCES `ProjPoste`(`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `ProjVao_posteFimId_fkey`
        FOREIGN KEY (`posteFimId`) REFERENCES `ProjPoste`(`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `ProjVao_materialCondutorId_fkey`
        FOREIGN KEY (`materialCondutorId`) REFERENCES `MaterialCatalogo`(`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `ProjValidacaoViabilizacao`
    ADD CONSTRAINT `ProjValidacaoViabilizacao_posteId_fkey`
        FOREIGN KEY (`posteId`) REFERENCES `ProjPoste`(`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `ProjValidacaoViabilizacao_autorId_fkey`
        FOREIGN KEY (`autorId`) REFERENCES `User`(`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 5) Restore data from snapshots
-- ---------------------------------------------------------------------------

-- Catalog: ProjTipoEstrutura -> ProjEstrutura (dedupe by nome)
INSERT INTO `ProjEstrutura` (
    `id`,
    `nome`,
    `createdAt`,
    `createdBy`,
    `updatedAt`,
    `updatedBy`,
    `deletedAt`,
    `deletedBy`
)
SELECT
    MIN(`id`) AS `id`,
    `nome`,
    MIN(`createdAt`) AS `createdAt`,
    MIN(`createdBy`) AS `createdBy`,
    MAX(`updatedAt`) AS `updatedAt`,
    MAX(`updatedBy`) AS `updatedBy`,
    MAX(`deletedAt`) AS `deletedAt`,
    MAX(`deletedBy`) AS `deletedBy`
FROM `_migrate_proj_tipo_estrutura`
GROUP BY `nome`;

CREATE TEMPORARY TABLE `_migrate_tipo_estrutura_map` AS
SELECT
    te.`id` AS `oldId`,
    e.`id` AS `newId`
FROM `_migrate_proj_tipo_estrutura` te
INNER JOIN `ProjEstrutura` e ON e.`nome` = te.`nome`;

-- One programa per contrato that had projetos
INSERT INTO `ProjPrograma` (
    `nome`,
    `contratoId`,
    `createdAt`,
    `createdBy`,
    `updatedAt`,
    `updatedBy`,
    `deletedAt`,
    `deletedBy`
)
SELECT
    CONCAT('Programa ', COALESCE(c.`nome`, c.`numero`, pp.`contratoId`)) AS `nome`,
    pp.`contratoId`,
    MIN(pp.`createdAt`) AS `createdAt`,
    MIN(pp.`createdBy`) AS `createdBy`,
    MAX(pp.`updatedAt`) AS `updatedAt`,
    MAX(pp.`updatedBy`) AS `updatedBy`,
    MAX(pp.`deletedAt`) AS `deletedAt`,
    MAX(pp.`deletedBy`) AS `deletedBy`
FROM `_migrate_projeto_programacao` pp
INNER JOIN `Contrato` c ON c.`id` = pp.`contratoId`
GROUP BY pp.`contratoId`, c.`nome`, c.`numero`;

-- Preserve projeto ids for downstream FK stability
INSERT INTO `ProjProjeto` (
    `id`,
    `programaId`,
    `numeroProjeto`,
    `descricao`,
    `equipamento`,
    `municipio`,
    `status`,
    `createdAt`,
    `createdBy`,
    `updatedAt`,
    `updatedBy`,
    `deletedAt`,
    `deletedBy`
)
SELECT
    pp.`id`,
    prog.`id` AS `programaId`,
    pp.`numeroProjeto`,
    pp.`descricao`,
    pp.`equipamento`,
    pp.`municipio`,
    pp.`status`,
    pp.`createdAt`,
    pp.`createdBy`,
    pp.`updatedAt`,
    pp.`updatedBy`,
    pp.`deletedAt`,
    pp.`deletedBy`
FROM `_migrate_projeto_programacao` pp
INNER JOIN `ProjPrograma` prog ON prog.`contratoId` = pp.`contratoId`;

SET @default_mobile_user_id = (
    SELECT `id` FROM `MobileUser` ORDER BY `id` ASC LIMIT 1
);

INSERT INTO `ProjViabilizacao` (
    `id`,
    `projetoId`,
    `data`,
    `observacao`,
    `autorId`,
    `createdAt`,
    `createdBy`,
    `updatedAt`,
    `updatedBy`,
    `deletedAt`,
    `deletedBy`
)
SELECT
    v.`id`,
    v.`projetoId`,
    COALESCE(
        DATE_FORMAT(v.`dataViabilizacao`, '%Y-%m-%d %H:%i:%s'),
        DATE_FORMAT(v.`enviadaEm`, '%Y-%m-%d %H:%i:%s'),
        DATE_FORMAT(v.`createdAt`, '%Y-%m-%d %H:%i:%s'),
        ''
    ) AS `data`,
    COALESCE(v.`observacao`, '') AS `observacao`,
    @default_mobile_user_id AS `autorId`,
    v.`createdAt`,
    v.`createdBy`,
    v.`updatedAt`,
    v.`updatedBy`,
    v.`deletedAt`,
    v.`deletedBy`
FROM `_migrate_proj_viabilizacao` v
INNER JOIN `ProjProjeto` p ON p.`id` = v.`projetoId`
WHERE @default_mobile_user_id IS NOT NULL;

INSERT INTO `ProjPoste` (
    `id`,
    `viabilizacaoId`,
    `tipoPosteId`,
    `cadastro`,
    `uuid`,
    `latitude`,
    `longitude`,
    `createdAt`,
    `createdBy`,
    `updatedAt`,
    `updatedBy`,
    `deletedAt`,
    `deletedBy`
)
SELECT
    p.`id`,
    p.`viabilizacaoId`,
    p.`tipoPosteId`,
    COALESCE(cp.`identificador`, cp.`numeroPoste`, CONCAT('POSTE-', p.`id`)) AS `cadastro`,
    CONCAT('migrated-', p.`id`) AS `uuid`,
    CAST(p.`latitude` AS DECIMAL(10, 8)) AS `latitude`,
    CAST(p.`longitude` AS DECIMAL(11, 8)) AS `longitude`,
    p.`createdAt`,
    p.`createdBy`,
    p.`updatedAt`,
    p.`updatedBy`,
    p.`deletedAt`,
    p.`deletedBy`
FROM `_migrate_proj_poste` p
LEFT JOIN `_migrate_proj_cadastro_poste` cp ON cp.`id` = p.`cadastroPosteId`
INNER JOIN `ProjViabilizacao` v ON v.`id` = p.`viabilizacaoId`
WHERE p.`viabilizacaoId` IS NOT NULL
  AND p.`tipoPosteId` IS NOT NULL;

INSERT INTO `ProjPosteEstruturas` (
    `id`,
    `posteId`,
    `estruturaId`,
    `createdAt`,
    `createdBy`,
    `updatedAt`,
    `updatedBy`,
    `deletedAt`,
    `deletedBy`
)
SELECT
    pe.`id`,
    pe.`posteId`,
    map.`newId` AS `estruturaId`,
    pe.`createdAt`,
    pe.`createdBy`,
    pe.`updatedAt`,
    pe.`updatedBy`,
    pe.`deletedAt`,
    pe.`deletedBy`
FROM `_migrate_proj_poste_estrutura` pe
INNER JOIN `_migrate_tipo_estrutura_map` map ON map.`oldId` = pe.`tipoEstruturaId`
INNER JOIN `ProjPoste` poste ON poste.`id` = pe.`posteId`;

INSERT INTO `ProjPosteRamais` (
    `id`,
    `posteId`,
    `tipoRamalId`,
    `createdAt`,
    `createdBy`,
    `updatedAt`,
    `updatedBy`,
    `deletedAt`,
    `deletedBy`
)
SELECT
    pr.`id`,
    pr.`posteId`,
    pr.`tipoRamalId`,
    pr.`createdAt`,
    pr.`createdBy`,
    pr.`updatedAt`,
    pr.`updatedBy`,
    pr.`deletedAt`,
    pr.`deletedBy`
FROM `_migrate_proj_poste_ramal` pr
INNER JOIN `ProjPoste` poste ON poste.`id` = pr.`posteId`;

INSERT INTO `ProjVao` (
    `id`,
    `viabilizacaoId`,
    `posteInicioId`,
    `posteFimId`,
    `materialCondutorId`,
    `createdAt`,
    `createdBy`,
    `updatedAt`,
    `updatedBy`,
    `deletedAt`,
    `deletedBy`
)
SELECT
    v.`id`,
    v.`viabilizacaoId`,
    v.`posteOrigemId` AS `posteInicioId`,
    v.`posteDestinoId` AS `posteFimId`,
    v.`materialCondutorId`,
    v.`createdAt`,
    v.`createdBy`,
    v.`updatedAt`,
    v.`updatedBy`,
    v.`deletedAt`,
    v.`deletedBy`
FROM `_migrate_proj_vao` v
INNER JOIN `ProjViabilizacao` viab ON viab.`id` = v.`viabilizacaoId`
INNER JOIN `ProjPoste` inicio ON inicio.`id` = v.`posteOrigemId`
INNER JOIN `ProjPoste` fim ON fim.`id` = v.`posteDestinoId`
WHERE v.`viabilizacaoId` IS NOT NULL;

SET @default_web_user_id = (
    SELECT `id` FROM `User` ORDER BY `id` ASC LIMIT 1
);

-- Legacy validation was per viabilizacao; map to the first poste of that viabilizacao.
INSERT INTO `ProjValidacaoViabilizacao` (
    `id`,
    `posteId`,
    `data`,
    `observacao`,
    `autorId`,
    `createdAt`,
    `createdBy`,
    `updatedAt`,
    `updatedBy`,
    `deletedAt`,
    `deletedBy`
)
SELECT
    val.`id`,
    poste.`id` AS `posteId`,
    val.`validadaEm` AS `data`,
    val.`observacao`,
    @default_web_user_id AS `autorId`,
    val.`createdAt`,
    val.`createdBy`,
    val.`updatedAt`,
    val.`updatedBy`,
    val.`deletedAt`,
    val.`deletedBy`
FROM `_migrate_proj_validacao` val
INNER JOIN (
    SELECT `viabilizacaoId`, MIN(`id`) AS `posteId`
    FROM `_migrate_proj_poste`
    WHERE `viabilizacaoId` IS NOT NULL
    GROUP BY `viabilizacaoId`
) poste_map ON poste_map.`viabilizacaoId` = val.`viabilizacaoId`
INNER JOIN `ProjPoste` poste ON poste.`id` = poste_map.`posteId`
WHERE @default_web_user_id IS NOT NULL;

-- Keep auto-increment ahead of migrated ids
SET @next_programa_id = (SELECT COALESCE(MAX(`id`), 0) + 1 FROM `ProjPrograma`);
SET @sql_programa_ai = CONCAT(
    'ALTER TABLE `ProjPrograma` AUTO_INCREMENT = ',
    @next_programa_id
);
PREPARE stmt_programa_ai FROM @sql_programa_ai;
EXECUTE stmt_programa_ai;
DEALLOCATE PREPARE stmt_programa_ai;

SET @next_projeto_id = (SELECT COALESCE(MAX(`id`), 0) + 1 FROM `ProjProjeto`);
SET @sql_projeto_ai = CONCAT(
    'ALTER TABLE `ProjProjeto` AUTO_INCREMENT = ',
    @next_projeto_id
);
PREPARE stmt_projeto_ai FROM @sql_projeto_ai;
EXECUTE stmt_projeto_ai;
DEALLOCATE PREPARE stmt_projeto_ai;

SET @next_estrutura_id = (SELECT COALESCE(MAX(`id`), 0) + 1 FROM `ProjEstrutura`);
SET @sql_estrutura_ai = CONCAT(
    'ALTER TABLE `ProjEstrutura` AUTO_INCREMENT = ',
    @next_estrutura_id
);
PREPARE stmt_estrutura_ai FROM @sql_estrutura_ai;
EXECUTE stmt_estrutura_ai;
DEALLOCATE PREPARE stmt_estrutura_ai;

-- ---------------------------------------------------------------------------
-- 6) Cleanup snapshots
-- ---------------------------------------------------------------------------

DROP TEMPORARY TABLE IF EXISTS `_migrate_tipo_estrutura_map`;

DROP TABLE IF EXISTS `_migrate_proj_tipo_estrutura`;
DROP TABLE IF EXISTS `_migrate_proj_validacao`;
DROP TABLE IF EXISTS `_migrate_proj_vao`;
DROP TABLE IF EXISTS `_migrate_proj_poste_ramal`;
DROP TABLE IF EXISTS `_migrate_proj_poste_estrutura`;
DROP TABLE IF EXISTS `_migrate_proj_poste`;
DROP TABLE IF EXISTS `_migrate_proj_viabilizacao`;
DROP TABLE IF EXISTS `_migrate_proj_cadastro_poste`;
DROP TABLE IF EXISTS `_migrate_projeto_programacao`;

SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;
