-- CreateTable
CREATE TABLE `HorarioAberturaCatalogo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `inicioTurnoHora` VARCHAR(8) NOT NULL,
    `duracaoHoras` DECIMAL(5, 2) NOT NULL,
    `duracaoIntervaloHoras` DECIMAL(5, 2) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `observacoes` VARCHAR(1000) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `HorarioAberturaCatalogo_ativo_idx`(`ativo`),
    INDEX `HorarioAberturaCatalogo_nome_idx`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EquipeTurnoHistorico` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `equipeId` INTEGER NOT NULL,
    `horarioAberturaCatalogoId` INTEGER NULL,
    `dataInicio` DATETIME(3) NOT NULL,
    `dataFim` DATETIME(3) NULL,
    `inicioTurnoHora` VARCHAR(8) NOT NULL,
    `duracaoHoras` DECIMAL(5, 2) NOT NULL,
    `duracaoIntervaloHoras` DECIMAL(5, 2) NOT NULL,
    `fimTurnoHora` VARCHAR(8) NULL,
    `motivo` VARCHAR(500) NULL,
    `observacoes` VARCHAR(1000) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `EquipeTurnoHistorico_equipeId_idx`(`equipeId`),
    INDEX `EquipeTurnoHistorico_horarioAberturaCatalogoId_idx`(`horarioAberturaCatalogoId`),
    INDEX `EquipeTurnoHistorico_dataInicio_idx`(`dataInicio`),
    INDEX `EquipeTurnoHistorico_dataFim_idx`(`dataFim`),
    INDEX `EquipeTurnoHistorico_equipeId_dataInicio_idx`(`equipeId`, `dataInicio`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EquipeTurnoHistorico` ADD CONSTRAINT `EquipeTurnoHistorico_equipeId_fkey` FOREIGN KEY (`equipeId`) REFERENCES `Equipe`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EquipeTurnoHistorico` ADD CONSTRAINT `EquipeTurnoHistorico_horarioAberturaCatalogoId_fkey` FOREIGN KEY (`horarioAberturaCatalogoId`) REFERENCES `HorarioAberturaCatalogo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
