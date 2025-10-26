-- CreateTable
CREATE TABLE `MobilePhoto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `turnoId` INTEGER NOT NULL,
    `tipo` VARCHAR(100) NOT NULL,
    `checklistPreenchidoId` INTEGER NULL,
    `checklistRespostaId` INTEGER NULL,
    `sequenciaAssinatura` INTEGER NULL,
    `servicoId` INTEGER NULL,
    `fileName` VARCHAR(255) NOT NULL,
    `mimeType` VARCHAR(100) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `checksum` VARCHAR(128) NOT NULL,
    `storagePath` VARCHAR(1024) NOT NULL,
    `url` VARCHAR(1024) NOT NULL,
    `capturedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    UNIQUE INDEX `MobilePhoto_checksum_key`(`checksum`),
    INDEX `idx_mobile_photo_turno`(`turnoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MobileLocation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `turnoId` INTEGER NOT NULL,
    `veiculoRemoteId` INTEGER NULL,
    `equipeRemoteId` INTEGER NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `accuracy` DOUBLE NULL,
    `provider` VARCHAR(100) NULL,
    `batteryLevel` INTEGER NULL,
    `tagType` VARCHAR(100) NULL,
    `tagDetail` VARCHAR(255) NULL,
    `capturedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `signature` VARCHAR(128) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    UNIQUE INDEX `MobileLocation_signature_key`(`signature`),
    INDEX `idx_mobile_location_turno`(`turnoId`),
    INDEX `idx_mobile_location_captured_at`(`capturedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
