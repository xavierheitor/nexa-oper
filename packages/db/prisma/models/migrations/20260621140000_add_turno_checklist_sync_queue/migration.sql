-- CreateTable
CREATE TABLE `TurnoChecklistSyncQueue` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `turnoId` INTEGER NOT NULL,
    `payload` JSON NOT NULL,
    `status` ENUM('pending', 'processing', 'completed', 'failed', 'dead_letter') NOT NULL DEFAULT 'pending',
    `attemptCount` INTEGER NOT NULL DEFAULT 0,
    `maxAttempts` INTEGER NOT NULL DEFAULT 10,
    `nextAttemptAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastError` TEXT NULL,
    `processedAt` DATETIME(3) NULL,
    `checklistPreenchidoIds` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,

    INDEX `TurnoChecklistSyncQueue_turnoId_idx`(`turnoId`),
    INDEX `TurnoChecklistSyncQueue_status_nextAttemptAt_idx`(`status`, `nextAttemptAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TurnoChecklistSyncQueue` ADD CONSTRAINT `TurnoChecklistSyncQueue_turnoId_fkey` FOREIGN KEY (`turnoId`) REFERENCES `Turno`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
