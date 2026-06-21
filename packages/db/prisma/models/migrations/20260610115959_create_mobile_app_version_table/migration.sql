-- Base table for mobile app release management.
-- Production never received this table via migration; only the follow-up
-- extend migration existed. CREATE IF NOT EXISTS keeps existing dev DBs safe.
CREATE TABLE IF NOT EXISTS `MobileAppVersion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `versao` VARCHAR(50) NOT NULL,
    `plataforma` VARCHAR(20) NOT NULL DEFAULT 'android',
    `notas` TEXT NULL,
    `arquivoUrl` VARCHAR(1024) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
