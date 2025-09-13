-- CreateTable
CREATE TABLE `ChecklistTipoVeiculoRelacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `checklistId` INTEGER NOT NULL,
    `tipoVeiculoId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    UNIQUE INDEX `unique_active_checklist_tipo_veiculo`(`tipoVeiculoId`, `deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChecklistTipoEquipeRelacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `checklistId` INTEGER NOT NULL,
    `tipoEquipeId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    UNIQUE INDEX `unique_active_checklist_tipo_equipe`(`tipoEquipeId`, `deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ChecklistTipoVeiculoRelacao` ADD CONSTRAINT `ChecklistTipoVeiculoRelacao_checklistId_fkey` FOREIGN KEY (`checklistId`) REFERENCES `Checklist`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistTipoVeiculoRelacao` ADD CONSTRAINT `ChecklistTipoVeiculoRelacao_tipoVeiculoId_fkey` FOREIGN KEY (`tipoVeiculoId`) REFERENCES `TipoVeiculo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistTipoEquipeRelacao` ADD CONSTRAINT `ChecklistTipoEquipeRelacao_checklistId_fkey` FOREIGN KEY (`checklistId`) REFERENCES `Checklist`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistTipoEquipeRelacao` ADD CONSTRAINT `ChecklistTipoEquipeRelacao_tipoEquipeId_fkey` FOREIGN KEY (`tipoEquipeId`) REFERENCES `TipoEquipe`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
