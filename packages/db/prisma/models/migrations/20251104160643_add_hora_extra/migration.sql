-- CreateTable
CREATE TABLE `HoraExtra` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dataReferencia` DATETIME(3) NOT NULL,
    `eletricistaId` INTEGER NOT NULL,
    `turnoRealizadoEletricistaId` INTEGER NULL,
    `escalaSlotId` INTEGER NULL,
    `tipo` VARCHAR(32) NOT NULL,
    `horasPrevistas` DECIMAL(5, 2) NULL,
    `horasRealizadas` DECIMAL(5, 2) NOT NULL,
    `diferencaHoras` DECIMAL(5, 2) NOT NULL,
    `observacoes` VARCHAR(1000) NULL,
    `status` VARCHAR(16) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,

    INDEX `HoraExtra_eletricistaId_dataReferencia_idx`(`eletricistaId`, `dataReferencia`),
    INDEX `HoraExtra_dataReferencia_idx`(`dataReferencia`),
    INDEX `HoraExtra_status_idx`(`status`),
    INDEX `HoraExtra_tipo_idx`(`tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `HoraExtra` ADD CONSTRAINT `HoraExtra_eletricistaId_fkey` FOREIGN KEY (`eletricistaId`) REFERENCES `Eletricista`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HoraExtra` ADD CONSTRAINT `HoraExtra_turnoRealizadoEletricistaId_fkey` FOREIGN KEY (`turnoRealizadoEletricistaId`) REFERENCES `TurnoRealizadoEletricista`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HoraExtra` ADD CONSTRAINT `HoraExtra_escalaSlotId_fkey` FOREIGN KEY (`escalaSlotId`) REFERENCES `SlotEscala`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
