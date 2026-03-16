CREATE TABLE `UserPermissionGrant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `permission` VARCHAR(100) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,

    UNIQUE INDEX `uk_user_permission_grant`(`userId`, `permission`),
    INDEX `idx_user_permission_grant_user`(`userId`),
    INDEX `idx_user_permission_grant_permission`(`permission`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `UserPermissionGrant`
    ADD CONSTRAINT `UserPermissionGrant_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE;
