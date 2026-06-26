-- AlterTable
ALTER TABLE `MobileLocation` ADD COLUMN `eventCategory` VARCHAR(100) NULL AFTER `tagDetail`;

-- CreateIndex
CREATE INDEX `idx_mobile_location_turno_category_captured` ON `MobileLocation`(`turnoId`, `eventCategory`, `capturedAt`);

-- AlterTable
ALTER TABLE `AtividadeAprPreenchida` ADD COLUMN `iniciadaEm` DATETIME(3) NULL AFTER `observacoes`,
    ADD COLUMN `latitudeInicio` DOUBLE NULL AFTER `iniciadaEm`,
    ADD COLUMN `longitudeInicio` DOUBLE NULL AFTER `latitudeInicio`;
