SET @add_gera_pendencia_sql = (
    SELECT IF(
        EXISTS (
            SELECT 1
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'AprOpcaoResposta'
              AND COLUMN_NAME = 'geraPendencia'
        ),
        'SELECT 1',
        'ALTER TABLE `AprOpcaoResposta` ADD COLUMN `geraPendencia` BOOLEAN NOT NULL DEFAULT false AFTER `nome`'
    )
);
PREPARE add_gera_pendencia_stmt FROM @add_gera_pendencia_sql;
EXECUTE add_gera_pendencia_stmt;
DEALLOCATE PREPARE add_gera_pendencia_stmt;

CREATE TABLE IF NOT EXISTS `AprMedidaControle` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `AprGrupoPerguntaMedidaControleRelacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `aprGrupoPerguntaId` INTEGER NOT NULL,
    `aprPerguntaId` INTEGER NOT NULL,
    `aprMedidaControleId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `idx_agpmcr_grupo_pergunta`(`aprGrupoPerguntaId`, `aprPerguntaId`),
    INDEX `idx_agpmcr_medida`(`aprMedidaControleId`),
    UNIQUE INDEX `uq_apr_grupo_pergunta_medida_rel_ativo`(`aprGrupoPerguntaId`, `aprPerguntaId`, `aprMedidaControleId`, `deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `AtividadeAprRespostaMedidaControle` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `atividadeAprRespostaId` INTEGER NOT NULL,
    `aprMedidaControleId` INTEGER NULL,
    `medidaControleNomeSnapshot` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,

    INDEX `AtividadeAprRespostaMedidaControle_atividadeAprRespostaId_idx`(`atividadeAprRespostaId`),
    INDEX `AtividadeAprRespostaMedidaControle_aprMedidaControleId_idx`(`aprMedidaControleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @add_fk_agpmcr_grupo_sql = (
    SELECT IF(
        EXISTS (
            SELECT 1
            FROM information_schema.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'AprGrupoPerguntaMedidaControleRelacao'
              AND CONSTRAINT_NAME = 'AprGrupoPerguntaMedidaControleRelacao_aprGrupoPerguntaId_fkey'
        ),
        'SELECT 1',
        'ALTER TABLE `AprGrupoPerguntaMedidaControleRelacao` ADD CONSTRAINT `AprGrupoPerguntaMedidaControleRelacao_aprGrupoPerguntaId_fkey` FOREIGN KEY (`aprGrupoPerguntaId`) REFERENCES `AprGrupoPergunta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE'
    )
);
PREPARE add_fk_agpmcr_grupo_stmt FROM @add_fk_agpmcr_grupo_sql;
EXECUTE add_fk_agpmcr_grupo_stmt;
DEALLOCATE PREPARE add_fk_agpmcr_grupo_stmt;

SET @add_fk_agpmcr_pergunta_sql = (
    SELECT IF(
        EXISTS (
            SELECT 1
            FROM information_schema.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'AprGrupoPerguntaMedidaControleRelacao'
              AND CONSTRAINT_NAME = 'AprGrupoPerguntaMedidaControleRelacao_aprPerguntaId_fkey'
        ),
        'SELECT 1',
        'ALTER TABLE `AprGrupoPerguntaMedidaControleRelacao` ADD CONSTRAINT `AprGrupoPerguntaMedidaControleRelacao_aprPerguntaId_fkey` FOREIGN KEY (`aprPerguntaId`) REFERENCES `AprPergunta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE'
    )
);
PREPARE add_fk_agpmcr_pergunta_stmt FROM @add_fk_agpmcr_pergunta_sql;
EXECUTE add_fk_agpmcr_pergunta_stmt;
DEALLOCATE PREPARE add_fk_agpmcr_pergunta_stmt;

SET @add_fk_agpmcr_medida_sql = (
    SELECT IF(
        EXISTS (
            SELECT 1
            FROM information_schema.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'AprGrupoPerguntaMedidaControleRelacao'
              AND CONSTRAINT_NAME = 'AprGrupoPerguntaMedidaControleRelacao_aprMedidaControleId_fkey'
        ),
        'SELECT 1',
        'ALTER TABLE `AprGrupoPerguntaMedidaControleRelacao` ADD CONSTRAINT `AprGrupoPerguntaMedidaControleRelacao_aprMedidaControleId_fkey` FOREIGN KEY (`aprMedidaControleId`) REFERENCES `AprMedidaControle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE'
    )
);
PREPARE add_fk_agpmcr_medida_stmt FROM @add_fk_agpmcr_medida_sql;
EXECUTE add_fk_agpmcr_medida_stmt;
DEALLOCATE PREPARE add_fk_agpmcr_medida_stmt;

SET @add_fk_aarmc_resposta_sql = (
    SELECT IF(
        EXISTS (
            SELECT 1
            FROM information_schema.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'AtividadeAprRespostaMedidaControle'
              AND CONSTRAINT_NAME = 'AtividadeAprRespostaMedidaControle_atividadeAprRespostaId_fkey'
        ),
        'SELECT 1',
        'ALTER TABLE `AtividadeAprRespostaMedidaControle` ADD CONSTRAINT `AtividadeAprRespostaMedidaControle_atividadeAprRespostaId_fkey` FOREIGN KEY (`atividadeAprRespostaId`) REFERENCES `AtividadeAprResposta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE'
    )
);
PREPARE add_fk_aarmc_resposta_stmt FROM @add_fk_aarmc_resposta_sql;
EXECUTE add_fk_aarmc_resposta_stmt;
DEALLOCATE PREPARE add_fk_aarmc_resposta_stmt;

SET @add_fk_aarmc_medida_sql = (
    SELECT IF(
        EXISTS (
            SELECT 1
            FROM information_schema.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'AtividadeAprRespostaMedidaControle'
              AND CONSTRAINT_NAME = 'AtividadeAprRespostaMedidaControle_aprMedidaControleId_fkey'
        ),
        'SELECT 1',
        'ALTER TABLE `AtividadeAprRespostaMedidaControle` ADD CONSTRAINT `AtividadeAprRespostaMedidaControle_aprMedidaControleId_fkey` FOREIGN KEY (`aprMedidaControleId`) REFERENCES `AprMedidaControle`(`id`) ON DELETE SET NULL ON UPDATE CASCADE'
    )
);
PREPARE add_fk_aarmc_medida_stmt FROM @add_fk_aarmc_medida_sql;
EXECUTE add_fk_aarmc_medida_stmt;
DEALLOCATE PREPARE add_fk_aarmc_medida_stmt;
