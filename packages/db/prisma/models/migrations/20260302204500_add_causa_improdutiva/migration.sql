CREATE TABLE `CausaImprodutiva` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `causa` VARCHAR(255) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    UNIQUE INDEX `uq_causa_improdutiva_causa`(`causa`),
    INDEX `CausaImprodutiva_ativo_idx`(`ativo`),
    INDEX `CausaImprodutiva_updatedAt_idx`(`updatedAt`),
    INDEX `CausaImprodutiva_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
