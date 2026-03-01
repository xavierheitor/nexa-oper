CREATE TABLE `UploadEvidenceLinks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uploadEvidenceId` INTEGER NOT NULL,
    `ownerType` VARCHAR(60) NOT NULL,
    `ownerRef` VARCHAR(120) NOT NULL,
    `photoCategory` VARCHAR(80) NOT NULL,
    `tipo` VARCHAR(100) NOT NULL,
    `entityType` VARCHAR(100) NOT NULL,
    `entityId` VARCHAR(50) NOT NULL,
    `turnoId` INTEGER NULL,
    `servicoId` INTEGER NULL,
    `checklistPreenchidoId` INTEGER NULL,
    `checklistRespostaId` INTEGER NULL,
    `sequenciaAssinatura` INTEGER NULL,
    `atividadeUuid` VARCHAR(36) NULL,
    `atividadeContexto` VARCHAR(120) NULL,
    `aprUuid` VARCHAR(36) NULL,
    `syncSchemaVersion` INTEGER NULL,
    `syncOrigin` VARCHAR(30) NULL,
    `clientPhotoId` INTEGER NULL,
    `metadataJson` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NULL,
    `updatedAt` DATETIME(3) NULL,

    UNIQUE INDEX `uk_upload_evidence_link_scope`(`uploadEvidenceId`, `ownerType`, `ownerRef`, `photoCategory`),
    INDEX `idx_upload_evidence_link_owner`(`ownerType`, `ownerRef`),
    INDEX `idx_upload_evidence_link_category`(`photoCategory`),
    INDEX `idx_upload_evidence_link_turno`(`turnoId`),
    INDEX `idx_upload_evidence_link_atividade_uuid`(`atividadeUuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `UploadEvidenceLinks`
  ADD CONSTRAINT `UploadEvidenceLinks_uploadEvidenceId_fkey`
  FOREIGN KEY (`uploadEvidenceId`) REFERENCES `UploadEvidences`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
