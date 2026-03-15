ALTER TABLE `User`
    ADD COLUMN `permissionProfileId` INTEGER NULL;

CREATE TABLE `PermissionProfile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(100) NOT NULL,
    `nome` VARCHAR(255) NOT NULL,
    `descricao` VARCHAR(500) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,

    UNIQUE INDEX `PermissionProfile_key_key`(`key`),
    INDEX `idx_permission_profile_ativo`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PermissionProfileGrant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `profileId` INTEGER NOT NULL,
    `permission` VARCHAR(100) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,

    UNIQUE INDEX `uk_permission_profile_grant`(`profileId`, `permission`),
    INDEX `idx_permission_profile_grant_profile`(`profileId`),
    INDEX `idx_permission_profile_grant_permission`(`permission`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `idx_user_permission_profile` ON `User`(`permissionProfileId`);

ALTER TABLE `User`
    ADD CONSTRAINT `User_permissionProfileId_fkey`
    FOREIGN KEY (`permissionProfileId`) REFERENCES `PermissionProfile`(`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

ALTER TABLE `PermissionProfileGrant`
    ADD CONSTRAINT `PermissionProfileGrant_profileId_fkey`
    FOREIGN KEY (`profileId`) REFERENCES `PermissionProfile`(`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE;
