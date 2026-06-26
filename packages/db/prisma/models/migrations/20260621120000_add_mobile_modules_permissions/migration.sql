CREATE TABLE `MobileModule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(100) NOT NULL,
    `nome` VARCHAR(255) NOT NULL,
    `descricao` VARCHAR(500) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    UNIQUE INDEX `MobileModule_key_key`(`key`),
    INDEX `idx_mobile_module_active_order`(`ativo`, `ordem`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `MobileUserModulePermission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mobileUserId` INTEGER NOT NULL,
    `mobileModuleId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `uk_mobile_user_module_permission`(`mobileUserId`, `mobileModuleId`),
    INDEX `idx_mobile_user_module_permission_user`(`mobileUserId`),
    INDEX `idx_mobile_user_module_permission_module`(`mobileModuleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `MobileUserModulePermission`
    ADD CONSTRAINT `MobileUserModulePermission_mobileUserId_fkey`
    FOREIGN KEY (`mobileUserId`) REFERENCES `MobileUser`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `MobileUserModulePermission`
    ADD CONSTRAINT `MobileUserModulePermission_mobileModuleId_fkey`
    FOREIGN KEY (`mobileModuleId`) REFERENCES `MobileModule`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
