-- AlterTable
ALTER TABLE `TurnoRealizado` ADD COLUMN `turnoId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `TurnoRealizado_turnoId_idx` ON `TurnoRealizado`(`turnoId`);

-- AddForeignKey
ALTER TABLE `TurnoRealizado` ADD CONSTRAINT `TurnoRealizado_turnoId_fkey` FOREIGN KEY (`turnoId`) REFERENCES `Turno`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
