-- CreateTable
CREATE TABLE `EletricistaStatus` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eletricistaId` INTEGER NOT NULL,
    `status` ENUM('ATIVO', 'FERIAS', 'LICENCA_MEDICA', 'LICENCA_MATERNIDADE', 'LICENCA_PATERNIDADE', 'SUSPENSAO', 'TREINAMENTO', 'AFastADO', 'DESLIGADO', 'APOSENTADO') NOT NULL DEFAULT 'ATIVO',
    `dataInicio` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dataFim` DATETIME(3) NULL,
    `motivo` VARCHAR(500) NULL,
    `observacoes` VARCHAR(1000) NULL,
    `documentoPath` VARCHAR(1000) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,

    UNIQUE INDEX `EletricistaStatus_eletricistaId_key`(`eletricistaId`),
    INDEX `EletricistaStatus_status_idx`(`status`),
    INDEX `EletricistaStatus_dataInicio_idx`(`dataInicio`),
    INDEX `EletricistaStatus_eletricistaId_status_idx`(`eletricistaId`, `status`),
    INDEX `EletricistaStatus_eletricistaId_idx`(`eletricistaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EletricistaStatusHistorico` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eletricistaId` INTEGER NOT NULL,
    `status` ENUM('ATIVO', 'FERIAS', 'LICENCA_MEDICA', 'LICENCA_MATERNIDADE', 'LICENCA_PATERNIDADE', 'SUSPENSAO', 'TREINAMENTO', 'AFastADO', 'DESLIGADO', 'APOSENTADO') NOT NULL,
    `statusAnterior` ENUM('ATIVO', 'FERIAS', 'LICENCA_MEDICA', 'LICENCA_MATERNIDADE', 'LICENCA_PATERNIDADE', 'SUSPENSAO', 'TREINAMENTO', 'AFastADO', 'DESLIGADO', 'APOSENTADO') NULL,
    `dataInicio` DATETIME(3) NOT NULL,
    `dataFim` DATETIME(3) NULL,
    `motivo` VARCHAR(500) NULL,
    `observacoes` VARCHAR(1000) NULL,
    `documentoPath` VARCHAR(1000) NULL,
    `registradoPor` VARCHAR(255) NOT NULL,
    `registradoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,

    INDEX `EletricistaStatusHistorico_eletricistaId_idx`(`eletricistaId`),
    INDEX `EletricistaStatusHistorico_status_idx`(`status`),
    INDEX `EletricistaStatusHistorico_dataInicio_idx`(`dataInicio`),
    INDEX `EletricistaStatusHistorico_dataFim_idx`(`dataFim`),
    INDEX `EletricistaStatusHistorico_eletricistaId_dataInicio_idx`(`eletricistaId`, `dataInicio`),
    INDEX `EletricistaStatusHistorico_eletricistaId_status_idx`(`eletricistaId`, `status`),
    INDEX `EletricistaStatusHistorico_eletricistaId_dataInicio_dataFim_idx`(`eletricistaId`, `dataInicio`, `dataFim`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_EletricistaStatusToEletricistaStatusHistorico` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_EletricistaStatusToEletricistaStatusHistorico_AB_unique`(`A`, `B`),
    INDEX `_EletricistaStatusToEletricistaStatusHistorico_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EletricistaStatus` ADD CONSTRAINT `EletricistaStatus_eletricistaId_fkey` FOREIGN KEY (`eletricistaId`) REFERENCES `Eletricista`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EletricistaStatusHistorico` ADD CONSTRAINT `EletricistaStatusHistorico_eletricistaId_fkey` FOREIGN KEY (`eletricistaId`) REFERENCES `Eletricista`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_EletricistaStatusToEletricistaStatusHistorico` ADD CONSTRAINT `_EletricistaStatusToEletricistaStatusHistorico_A_fkey` FOREIGN KEY (`A`) REFERENCES `EletricistaStatus`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_EletricistaStatusToEletricistaStatusHistorico` ADD CONSTRAINT `_EletricistaStatusToEletricistaStatusHistorico_B_fkey` FOREIGN KEY (`B`) REFERENCES `EletricistaStatusHistorico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
