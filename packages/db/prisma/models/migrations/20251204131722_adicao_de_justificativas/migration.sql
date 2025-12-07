-- CreateTable
CREATE TABLE `CasoJustificativaEquipe` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dataReferencia` DATETIME(3) NOT NULL,
    `equipeId` INTEGER NOT NULL,
    `slotsEscalados` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(16) NOT NULL,
    `justificativaEquipeId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,

    INDEX `CasoJustificativaEquipe_equipeId_dataReferencia_idx`(`equipeId`, `dataReferencia`),
    INDEX `CasoJustificativaEquipe_status_idx`(`status`),
    UNIQUE INDEX `CasoJustificativaEquipe_dataReferencia_equipeId_key`(`dataReferencia`, `equipeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CasoJustificativaEquipe` ADD CONSTRAINT `CasoJustificativaEquipe_equipeId_fkey` FOREIGN KEY (`equipeId`) REFERENCES `Equipe`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CasoJustificativaEquipe` ADD CONSTRAINT `CasoJustificativaEquipe_justificativaEquipeId_fkey` FOREIGN KEY (`justificativaEquipeId`) REFERENCES `JustificativaEquipe`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
