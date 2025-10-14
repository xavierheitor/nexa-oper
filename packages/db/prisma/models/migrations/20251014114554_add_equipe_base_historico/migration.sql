-- CreateTable
CREATE TABLE `EquipeBaseHistorico` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `equipeId` INTEGER NOT NULL,
    `baseId` INTEGER NOT NULL,
    `dataInicio` DATETIME(3) NOT NULL,
    `dataFim` DATETIME(3) NULL,
    `motivo` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `EquipeBaseHistorico_equipeId_idx`(`equipeId`),
    INDEX `EquipeBaseHistorico_baseId_idx`(`baseId`),
    INDEX `EquipeBaseHistorico_dataInicio_idx`(`dataInicio`),
    INDEX `EquipeBaseHistorico_dataFim_idx`(`dataFim`),
    INDEX `EquipeBaseHistorico_equipeId_dataInicio_idx`(`equipeId`, `dataInicio`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EquipeBaseHistorico` ADD CONSTRAINT `EquipeBaseHistorico_equipeId_fkey` FOREIGN KEY (`equipeId`) REFERENCES `Equipe`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EquipeBaseHistorico` ADD CONSTRAINT `EquipeBaseHistorico_baseId_fkey` FOREIGN KEY (`baseId`) REFERENCES `Base`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
