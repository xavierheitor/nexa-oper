-- CreateTable
CREATE TABLE `ChecklistPreenchidos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `turnoId` INTEGER NOT NULL,
    `checklistId` INTEGER NOT NULL,
    `eletricistaId` INTEGER NOT NULL,
    `dataPreenchimento` DATETIME(3) NOT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChecklistRespostas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `checklistPreenchidoId` INTEGER NOT NULL,
    `perguntaId` INTEGER NOT NULL,
    `opcaoRespostaId` INTEGER NOT NULL,
    `dataResposta` DATETIME(3) NOT NULL,
    `aguardandoFoto` BOOLEAN NOT NULL DEFAULT false,
    `fotosSincronizadas` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChecklistPendencias` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `checklistRespostaId` INTEGER NOT NULL,
    `checklistPreenchidoId` INTEGER NOT NULL,
    `turnoId` INTEGER NOT NULL,
    `status` ENUM('AGUARDANDO_TRATAMENTO', 'EM_TRATAMENTO', 'TRATADA', 'REGISTRO_INCORRETO') NOT NULL DEFAULT 'AGUARDANDO_TRATAMENTO',
    `observacaoProblema` VARCHAR(191) NULL,
    `observacaoTratamento` VARCHAR(191) NULL,
    `tratadoPor` VARCHAR(255) NULL,
    `tratadoEm` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    UNIQUE INDEX `ChecklistPendencias_checklistRespostaId_key`(`checklistRespostaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChecklistRespostaFotos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `checklistRespostaId` INTEGER NOT NULL,
    `checklistPendenciaId` INTEGER NULL,
    `caminhoArquivo` VARCHAR(500) NOT NULL,
    `urlPublica` VARCHAR(500) NULL,
    `tamanhoBytes` BIGINT NOT NULL,
    `mimeType` VARCHAR(100) NOT NULL,
    `sincronizadoEm` DATETIME(3) NOT NULL,
    `metadados` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ChecklistPreenchidos` ADD CONSTRAINT `ChecklistPreenchidos_turnoId_fkey` FOREIGN KEY (`turnoId`) REFERENCES `Turno`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistPreenchidos` ADD CONSTRAINT `ChecklistPreenchidos_checklistId_fkey` FOREIGN KEY (`checklistId`) REFERENCES `Checklist`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistPreenchidos` ADD CONSTRAINT `ChecklistPreenchidos_eletricistaId_fkey` FOREIGN KEY (`eletricistaId`) REFERENCES `Eletricista`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistRespostas` ADD CONSTRAINT `ChecklistRespostas_checklistPreenchidoId_fkey` FOREIGN KEY (`checklistPreenchidoId`) REFERENCES `ChecklistPreenchidos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistRespostas` ADD CONSTRAINT `ChecklistRespostas_perguntaId_fkey` FOREIGN KEY (`perguntaId`) REFERENCES `ChecklistPergunta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistRespostas` ADD CONSTRAINT `ChecklistRespostas_opcaoRespostaId_fkey` FOREIGN KEY (`opcaoRespostaId`) REFERENCES `ChecklistOpcaoResposta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistPendencias` ADD CONSTRAINT `ChecklistPendencias_checklistRespostaId_fkey` FOREIGN KEY (`checklistRespostaId`) REFERENCES `ChecklistRespostas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistPendencias` ADD CONSTRAINT `ChecklistPendencias_checklistPreenchidoId_fkey` FOREIGN KEY (`checklistPreenchidoId`) REFERENCES `ChecklistPreenchidos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistPendencias` ADD CONSTRAINT `ChecklistPendencias_turnoId_fkey` FOREIGN KEY (`turnoId`) REFERENCES `Turno`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistRespostaFotos` ADD CONSTRAINT `ChecklistRespostaFotos_checklistRespostaId_fkey` FOREIGN KEY (`checklistRespostaId`) REFERENCES `ChecklistRespostas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistRespostaFotos` ADD CONSTRAINT `ChecklistRespostaFotos_checklistPendenciaId_fkey` FOREIGN KEY (`checklistPendenciaId`) REFERENCES `ChecklistPendencias`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
