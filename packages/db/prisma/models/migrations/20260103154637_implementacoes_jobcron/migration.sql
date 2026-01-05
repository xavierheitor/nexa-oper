-- CreateTable
CREATE TABLE `AderenciaEscalaSnapshot` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dataReferencia` DATETIME(3) NOT NULL,
    `equipeId` INTEGER NOT NULL,
    `tipoEquipeId` INTEGER NOT NULL,
    `tipoEquipeNome` VARCHAR(255) NOT NULL,
    `escalaEquipePeriodoId` INTEGER NULL,
    `horarioPrevisto` VARCHAR(8) NULL,
    `eletricistasPrevistosIds` TEXT NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `turnoId` INTEGER NULL,
    `dataAbertura` DATETIME(3) NULL,
    `diferencaMinutos` INTEGER NULL,
    `geradoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `geradoPor` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `AderenciaEscalaSnapshot_dataReferencia_idx`(`dataReferencia`),
    INDEX `AderenciaEscalaSnapshot_equipeId_idx`(`equipeId`),
    INDEX `AderenciaEscalaSnapshot_equipeId_dataReferencia_idx`(`equipeId`, `dataReferencia`),
    INDEX `AderenciaEscalaSnapshot_status_idx`(`status`),
    INDEX `AderenciaEscalaSnapshot_tipoEquipeId_dataReferencia_idx`(`tipoEquipeId`, `dataReferencia`),
    INDEX `AderenciaEscalaSnapshot_escalaEquipePeriodoId_idx`(`escalaEquipePeriodoId`),
    UNIQUE INDEX `AderenciaEscalaSnapshot_equipeId_dataReferencia_key`(`equipeId`, `dataReferencia`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JobLock` (
    `jobName` VARCHAR(100) NOT NULL,
    `lockedAt` DATETIME(3) NULL,
    `lockedBy` VARCHAR(255) NULL,
    `expiresAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `JobLock_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`jobName`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AderenciaEscalaSnapshot` ADD CONSTRAINT `AderenciaEscalaSnapshot_equipeId_fkey` FOREIGN KEY (`equipeId`) REFERENCES `Equipe`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AderenciaEscalaSnapshot` ADD CONSTRAINT `AderenciaEscalaSnapshot_escalaEquipePeriodoId_fkey` FOREIGN KEY (`escalaEquipePeriodoId`) REFERENCES `EscalaEquipePeriodo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AderenciaEscalaSnapshot` ADD CONSTRAINT `AderenciaEscalaSnapshot_turnoId_fkey` FOREIGN KEY (`turnoId`) REFERENCES `Turno`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
